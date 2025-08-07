import express from 'express';
import Stripe from 'stripe';
import { authenticateToken, requireCompany } from '../middleware/auth.js';
import StripeService from '../services/stripeService.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent for job posting
router.post('/create-payment-intent', authenticateToken, requireCompany, async (req, res) => {
  try {
    const { amount, jobPostId, tier = 'basic' } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create or get Stripe customer
    const customer = await StripeService.createOrGetCustomer(
      req.user.email,
      req.user.full_name,
      req.user.id
    );

    // Create payment intent
    const paymentIntent = await StripeService.createJobPostingPayment(
      amount,
      'usd',
      {
        userId: req.user.id.toString(),
        customerId: customer.id,
        jobPostId: jobPostId?.toString() || 'new',
        tier
      }
    );

    res.json({
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create subscription for premium features
router.post('/create-subscription', authenticateToken, async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Create or get Stripe customer
    const customer = await StripeService.createOrGetCustomer(
      req.user.email,
      req.user.full_name,
      req.user.id
    );

    // Create subscription
    const subscription = await StripeService.createSubscription(
      customer.id,
      priceId,
      {
        userId: req.user.id.toString(),
        userRole: req.user.role
      }
    );

    res.json({
      subscriptionId: subscription.subscriptionId,
      clientSecret: subscription.clientSecret,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    // Verify the subscription belongs to the user
    const subscription = await StripeService.getSubscription(subscriptionId);
    const customer = await prisma.user.findFirst({
      where: {
        id: req.user.id,
        email: req.user.email
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cancel the subscription
    const cancelledSubscription = await StripeService.cancelSubscription(subscriptionId);

    // Update user's subscription status in database
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        subscription_status: 'cancelled',
        subscription_end_date: new Date(cancelledSubscription.current_period_end * 1000)
      }
    });

    res.json({ success: true, subscription: cancelledSubscription });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's subscription status
router.get('/subscription-status', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        subscription_status: true,
        subscription_end_date: true,
        stripe_customer_id: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let subscriptionDetails = null;
    if (user.stripe_customer_id) {
      try {
        // Get active subscriptions from Stripe
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active',
          limit: 1
        });

        if (subscriptions.data.length > 0) {
          subscriptionDetails = subscriptions.data[0];
        }
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    res.json({
      status: user.subscription_status || 'inactive',
      endDate: user.subscription_end_date,
      stripeSubscription: subscriptionDetails
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    // Verify webhook signature
    const event = StripeService.verifyWebhookSignature(req.body, signature);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await handleSubscriptionCancellation(deletedSubscription);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        await handlePaymentFailure(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Helper functions for webhook handlers
async function handleSuccessfulPayment(paymentIntent) {
  try {
    const { userId, jobPostId, tier } = paymentIntent.metadata;

    if (jobPostId && jobPostId !== 'new') {
      // Update existing job post with premium features
      await prisma.jobPost.update({
        where: { id: parseInt(jobPostId) },
        data: {
          is_premium: tier === 'premium',
          payment_status: 'paid',
          payment_date: new Date()
        }
      });
    }

    // Log the payment
    await prisma.payment.create({
      data: {
        user_id: parseInt(userId),
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'completed',
        type: 'job_posting'
      }
    });
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    const customerId = subscription.customer;
    
    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripe_customer_id: customerId }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscription_status: subscription.status,
          subscription_end_date: new Date(subscription.current_period_end * 1000),
          stripe_subscription_id: subscription.id
        }
      });
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionCancellation(subscription) {
  try {
    const customerId = subscription.customer;
    
    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripe_customer_id: customerId }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscription_status: 'cancelled',
          subscription_end_date: new Date(subscription.current_period_end * 1000)
        }
      });
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentFailure(invoice) {
  try {
    const customerId = invoice.customer;
    
    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripe_customer_id: customerId }
    });

    if (user) {
      // Handle payment failure (send email, update status, etc.)
      console.log(`Payment failed for user ${user.id}`);
      // You might want to send an email notification here
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

export default router;
