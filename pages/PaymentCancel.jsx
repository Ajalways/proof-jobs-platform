import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, RefreshCw } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Payment Canceled</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-slate-600 mb-6">
            Your payment process was canceled. Your subscription has not been updated. You can try again from the pricing page whenever you're ready.
          </p>
          <Button asChild className="mt-4 w-full bg-slate-800 hover:bg-slate-900">
            <Link to={createPageUrl('Pricing')}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Return to Pricing
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}