import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Calendar, CreditCard, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../../api/client';

const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSubscriptionStatus();
      setSubscription(response);
    } catch (error) {
      setError('Failed to fetch subscription status');
      console.error('Subscription fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.stripeSubscription?.id) return;

    try {
      setCancelling(true);
      await apiClient.cancelSubscription(subscription.stripeSubscription.id);
      await fetchSubscriptionStatus(); // Refresh status
    } catch (error) {
      setError('Failed to cancel subscription');
      console.error('Cancellation error:', error);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'canceled':
        return <XCircle className="w-4 h-4" />;
      case 'past_due':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2">Loading subscription details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const isActive = subscription?.status === 'active';
  const isCancelled = subscription?.status === 'cancelled' || subscription?.status === 'canceled';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription Status
          </CardTitle>
          <CardDescription>
            Manage your ProofJobs subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Current Status</span>
            <Badge className={getStatusColor(subscription?.status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(subscription?.status)}
                {subscription?.status || 'inactive'}
              </span>
            </Badge>
          </div>

          {subscription?.endDate && (
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {isCancelled ? 'Access Until' : 'Next Billing Date'}
              </span>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {new Date(subscription.endDate).toLocaleDateString()}
              </div>
            </div>
          )}

          {subscription?.stripeSubscription && (
            <div className="pt-4 border-t space-y-3">
              <h4 className="font-medium">Subscription Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Plan</span>
                  <div className="font-medium">Monthly Premium</div>
                </div>
                <div>
                  <span className="text-gray-500">Amount</span>
                  <div className="font-medium">
                    ${(subscription.stripeSubscription.items.data[0]?.price?.unit_amount / 100).toFixed(2)}/month
                  </div>
                </div>
              </div>
            </div>
          )}

          {isActive && !isCancelled && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                {cancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Subscription
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Your subscription will remain active until the end of the current billing period
              </p>
            </div>
          )}

          {isCancelled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your subscription has been cancelled. You'll continue to have access to premium features until {' '}
                {subscription?.endDate && new Date(subscription.endDate).toLocaleDateString()}.
              </AlertDescription>
            </Alert>
          )}

          {!isActive && !isCancelled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have an active subscription. Upgrade to unlock premium features like unlimited job postings and advanced analytics.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Usage & Billing History could go here */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>
            Manage your payment methods and view billing history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Billing history and payment method management</p>
            <p className="text-sm">Coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager;
