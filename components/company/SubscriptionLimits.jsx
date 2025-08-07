import React, { useState, useEffect } from "react";
import { CompanySubscription } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SubscriptionLimits({ companyUserId }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, [companyUserId]);

  const loadSubscription = async () => {
    try {
      const subs = await CompanySubscription.filter({ company_user_id: companyUserId });
      if (subs.length > 0) {
        setSubscription(subs[0]);
      } else {
        // Create trial subscription for new companies
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        
        const newSub = await CompanySubscription.create({
          company_user_id: companyUserId,
          plan_type: "trial",
          trial_ends_at: trialEnd.toISOString(),
          monthly_job_limit: 1,
          challenges_per_job_limit: 3,
          can_invite_candidates: false,
          can_access_candidate_bios: false
        });
        setSubscription(newSub);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    }
    setLoading(false);
  };

  const getPlanLimits = (planType) => {
    switch (planType) {
      case "trial":
        return { jobs: 1, challenges: 3, features: ["Demo candidates only"] };
      case "starter":
        return { jobs: 1, challenges: 3, features: ["Real candidates", "AI challenges"] };
      case "pro":
        return { jobs: 5, challenges: 5, features: ["Invite candidates", "Access bios", "Team collaboration"] };
      case "elite":
        return { jobs: "Unlimited", challenges: "Unlimited", features: ["All features", "Priority support"] };
      default:
        return { jobs: 0, challenges: 0, features: [] };
    }
  };

  const isTrialExpired = () => {
    if (!subscription?.trial_ends_at) return false;
    return new Date() > new Date(subscription.trial_ends_at);
  };

  const getDaysLeft = () => {
    if (!subscription?.trial_ends_at) return 0;
    const now = new Date();
    const trialEnd = new Date(subscription.trial_ends_at);
    const diffTime = trialEnd - now;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  if (loading) return <div>Loading subscription...</div>;

  const limits = getPlanLimits(subscription?.plan_type);
  const jobsUsed = subscription?.jobs_posted_this_cycle || 0;
  const progressPercentage = limits.jobs === "Unlimited" ? 0 : (jobsUsed / limits.jobs) * 100;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {subscription?.plan_type === 'trial' && <Zap className="w-5 h-5 text-emerald-500" />}
            {subscription?.plan_type === 'pro' && <Crown className="w-5 h-5 text-purple-500" />}
            Current Plan: <Badge className="capitalize">{subscription?.plan_type || 'Trial'}</Badge>
          </CardTitle>
          <Button variant="outline" size="sm">
            Upgrade Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription?.plan_type === 'trial' && (
          <Alert className={isTrialExpired() ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isTrialExpired() 
                ? "Your trial has expired. Upgrade to continue posting jobs."
                : `Your trial expires in ${getDaysLeft()} days. Try our platform with demo candidates!`
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Job Posts This Month</span>
              <span className="text-sm text-slate-500">
                {jobsUsed}/{limits.jobs === "Unlimited" ? "∞" : limits.jobs}
              </span>
            </div>
            {limits.jobs !== "Unlimited" && (
              <Progress value={progressPercentage} className="h-2" />
            )}
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Plan Features</div>
            <div className="flex flex-wrap gap-1">
              {limits.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {subscription?.plan_type === 'trial' && (
          <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
            <strong>Trial Mode:</strong> You're currently testing with demo candidates. 
            Upgrade to access real job seekers and post actual jobs.
          </div>
        )}
      </CardContent>
    </Card>
  );
}