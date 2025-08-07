import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Check, CreditCard, Zap } from 'lucide-react';
import apiClient from '../../api/client';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PAYMENT_PLANS = {
  basic: {
    name: 'Basic Job Posting',
    price: 99,
    duration: '30 days',
    features: [
      'Standard job listing',
      'Basic candidate matching',
      'Email notifications',
      '30-day posting duration'
    ]
  },
  premium: {
    name: 'Premium Job Posting',
    price: 199,
    duration: '30 days',
    features: [
      'Featured job listing',
      'Priority in search results',
      'Advanced candidate matching',
      'Unlimited revisions',
      'Priority support',
      '30-day posting duration'
    ]
  },
  subscription: {
    name: 'Monthly Subscription',
    price: 299,
    duration: 'per month',
    features: [
      'Unlimited job postings',
      'All premium features',
      'Advanced analytics',
      'Bulk candidate messaging',
      'Priority support',
      'Custom branding'
    ]
  }
};

const PaymentForm = ({ plan, jobPostId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      let clientSecret;
      
      if (plan === 'subscription') {
        // Handle subscription
        const { subscriptionId, clientSecret: subClientSecret } = await apiClient.createSubscription('price_monthly_subscription');
        clientSecret = subClientSecret;
      } else {
        // Handle one-time payment
        const { clientSecret: paymentClientSecret } = await apiClient.createPaymentIntent(
          PAYMENT_PLANS[plan].price,
          jobPostId,
          plan
        );
        clientSecret = paymentClientSecret;
      }

      const cardElement = elements.getElement(CardElement);

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        setPaymentError(error.message);
        onError?.(error);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess?.(paymentIntent);
      }
    } catch (error) {
      setPaymentError(error.message || 'Payment failed');
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      {paymentError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {paymentError}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay ${PAYMENT_PLANS[plan].price}
          </>
        )}
      </Button>
    </form>
  );
};

const PlanCard = ({ plan, planKey, isSelected, onSelect, isPopular = false }) => {
  return (
    <Card className={`relative transition-all ${
      isSelected 
        ? 'ring-2 ring-blue-500 shadow-lg' 
        : 'hover:shadow-md'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-500 text-white px-3 py-1">
            <Zap className="w-3 h-3 mr-1" />
            Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="text-3xl font-bold text-blue-600">
          ${plan.price}
          <span className="text-sm font-normal text-gray-500">
            /{plan.duration}
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3 mb-6">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        
        <Button
          onClick={() => onSelect(planKey)}
          variant={isSelected ? "default" : "outline"}
          className="w-full"
        >
          {isSelected ? 'Selected' : 'Select Plan'}
        </Button>
      </CardContent>
    </Card>
  );
};

const PaymentModal = ({ isOpen, onClose, jobPostId = null, onSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (paymentIntent) => {
    onSuccess?.(paymentIntent);
    onClose();
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setShowPaymentForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Choose Your Plan</h2>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>

          {!showPaymentForm ? (
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(PAYMENT_PLANS).map(([key, plan]) => (
                <PlanCard
                  key={key}
                  plan={plan}
                  planKey={key}
                  isSelected={selectedPlan === key}
                  onSelect={handlePlanSelect}
                  isPopular={key === 'premium'}
                />
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">
                  {PAYMENT_PLANS[selectedPlan].name}
                </h3>
                <div className="text-2xl font-bold text-blue-600">
                  ${PAYMENT_PLANS[selectedPlan].price}
                  <span className="text-sm font-normal text-gray-500">
                    /{PAYMENT_PLANS[selectedPlan].duration}
                  </span>
                </div>
              </div>

              <Elements stripe={stripePromise}>
                <PaymentForm
                  plan={selectedPlan}
                  jobPostId={jobPostId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>

              <Button
                variant="ghost"
                onClick={() => setShowPaymentForm(false)}
                className="w-full mt-4"
              >
                ← Back to Plans
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
