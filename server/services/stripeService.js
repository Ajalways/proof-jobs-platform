import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class StripeService {
  // Create a payment intent for job posting
  static async createJobPostingPayment(amount, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency,
        metadata: {
          type: 'job_posting',
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  // Create a subscription for premium features
  static async createSubscription(customerId, priceId, metadata = {}) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          type: 'premium_subscription',
          ...metadata
        },
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      };
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  // Create or retrieve a Stripe customer
  static async createOrGetCustomer(email, name, userId) {
    try {
      // Check if customer already exists
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId.toString(),
        },
      });

      return customer;
    } catch (error) {
      throw new Error(`Failed to create/get customer: ${error.message}`);
    }
  }

  // Cancel a subscription
  static async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  // Get subscription details
  static async getSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  // Verify webhook signature
  static verifyWebhookSignature(payload, signature) {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  // Handle successful payment
  static async handleSuccessfulPayment(paymentIntent) {
    // This will be called when a payment is successful
    // You can update your database, send emails, etc.
    console.log('Payment successful:', paymentIntent.id);
    return { success: true };
  }

  // Create prices for different job posting tiers
  static async createJobPostingPrices() {
    try {
      const prices = [];
      
      // Basic job posting
      const basicPrice = await stripe.prices.create({
        product_data: {
          name: 'Basic Job Posting',
          description: 'Standard job posting for 30 days',
        },
        unit_amount: 9900, // $99.00
        currency: 'usd',
        metadata: {
          type: 'job_posting',
          tier: 'basic',
          duration: '30'
        }
      });
      prices.push(basicPrice);

      // Premium job posting
      const premiumPrice = await stripe.prices.create({
        product_data: {
          name: 'Premium Job Posting',
          description: 'Featured job posting with enhanced visibility for 30 days',
        },
        unit_amount: 19900, // $199.00
        currency: 'usd',
        metadata: {
          type: 'job_posting',
          tier: 'premium',
          duration: '30'
        }
      });
      prices.push(premiumPrice);

      // Monthly subscription
      const monthlySubscription = await stripe.prices.create({
        product_data: {
          name: 'Monthly Premium Subscription',
          description: 'Unlimited job postings and premium features',
        },
        unit_amount: 29900, // $299.00
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          type: 'subscription',
          tier: 'premium'
        }
      });
      prices.push(monthlySubscription);

      return prices;
    } catch (error) {
      throw new Error(`Failed to create prices: ${error.message}`);
    }
  }
}

export default StripeService;
