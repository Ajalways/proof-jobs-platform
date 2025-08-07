
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Building, Star, ArrowRight, Shield } from "lucide-react";
import { User } from "@/api/entities";
import { createCheckoutSession } from "@/api/functions";

const companyPlans = [
  {
    name: "Trial",
    price: "Free",
    duration: "14 days",
    description: "Try our platform with demo candidates",
    features: [
      "1 demo job post",
      "Up to 3 challenges per job",
      "AI-generated challenges",
      "Demo candidate pool",
      "Basic analytics"
    ],
    cta: "Start Free Trial",
    popular: false,
    icon: Zap,
    color: "emerald"
  },
  {
    name: "Starter",
    price: "$99",
    duration: "per month",
    description: "Perfect for small companies",
    features: [
      "1 job post/month",
      "Up to 3 challenges per job",
      "AI-generated challenges",
      "Access to real candidates",
      "Basic support"
    ],
    cta: "Get Started",
    popular: false,
    icon: Building,
    color: "blue"
  },
  {
    name: "Pro",
    price: "$249",
    duration: "per month",
    description: "Most popular for growing teams",
    features: [
      "5 job posts/month",
      "Up to 5 challenges per job",
      "Invite candidates directly",
      "Access candidate bios",
      "Team collaboration",
      "Priority support"
    ],
    cta: "Go Pro",
    popular: true,
    icon: Star,
    color: "purple"
  },
  {
    name: "Elite",
    price: "$499",
    duration: "per month",
    description: "For enterprise-level hiring",
    features: [
      "Unlimited job posts",
      "Unlimited challenges per job",
      "Advanced team features",
      "Priority support",
      "Custom integrations",
      "Dedicated account manager"
    ],
    cta: "Contact Sales",
    popular: false,
    icon: Crown,
    color: "gold"
  }
];

const jobseekerAddOns = [
  {
    name: "Background Check",
    prices: ["$29 Basic", "$49 Standard", "$79 Comprehensive"],
    description: "Optional verification to boost your credibility",
    icon: Shield
  },
  {
    name: "Profile Boost",
    prices: ["$9/month"],
    description: "Higher visibility in company searches",
    icon: Zap
  },
  {
    name: "AI Resume Boost",
    prices: ["$19 one-time"],
    description: "AI-powered resume optimization",
    icon: Star
  }
];

export default function Pricing() {
  const [isCompany, setIsCompany] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleGetStarted = async (planName) => {
    if (planName === 'Trial') {
        alert('Your 14-day trial starts automatically when you sign up!');
        return;
    }
    if (planName === 'Elite') {
        alert('Please contact our sales team to get started with the Elite plan.');
        return;
    }

    setLoadingPlan(planName);
    try {
      const user = await User.me();
      if (user.role !== 'company') {
        alert("Please sign in as a company to subscribe to a plan.");
        setLoadingPlan(null);
        return;
      }

      const { data, error } = await createCheckoutSession({ planName });

      if (error || !data?.url) {
        const errorMessage = error?.data?.error || 'Could not create payment session. Please check if the plan is configured correctly and try again.';
        throw new Error(errorMessage);
      }

      window.location.href = data.url;

    } catch (error) {
      console.error("Payment error:", error);
      alert(`An error occurred: ${error.message}`);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your needs. Start with our free trial to experience skill-verified hiring.
          </p>
          
          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Button
              variant={isCompany ? "default" : "outline"}
              onClick={() => setIsCompany(true)}
              className={isCompany ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              For Companies
            </Button>
            <Button
              variant={!isCompany ? "default" : "outline"}
              onClick={() => setIsCompany(false)}
              className={!isCompany ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              For Job Seekers
            </Button>
          </div>
        </div>

        {isCompany ? (
          /* Company Plans */
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mb-16">
            {companyPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  plan.popular 
                    ? "ring-2 ring-purple-500 shadow-xl" 
                    : "hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.popular ? "pt-12" : "pt-6"}`}>
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    plan.color === 'emerald' ? 'bg-emerald-100' :
                    plan.color === 'blue' ? 'bg-blue-100' :
                    plan.color === 'purple' ? 'bg-purple-100' :
                    'bg-yellow-100'
                  }`}>
                    <plan.icon className={`w-8 h-8 ${
                      plan.color === 'emerald' ? 'text-emerald-600' :
                      plan.color === 'blue' ? 'text-blue-600' :
                      plan.color === 'purple' ? 'text-purple-600' :
                      'text-yellow-600'
                    }`} />
                  </div>
                  
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    {plan.duration && (
                      <span className="text-slate-500 ml-2">/{plan.duration}</span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-2">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="px-6 pb-8">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handleGetStarted(plan.name)}
                    disabled={loadingPlan === plan.name}
                    className={`w-full py-3 font-semibold ${
                      plan.popular
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    {loadingPlan === plan.name ? 'Processing...' : plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Job Seeker Add-ons */
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-6 py-3 rounded-full text-lg font-semibold mb-6">
                <Check className="w-5 h-5" />
                Always Free to Apply & Complete Challenges
              </div>
              <p className="text-slate-600 text-lg">
                Optional add-ons to boost your profile and credibility
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {jobseekerAddOns.map((addon) => (
                <Card key={addon.name} className="text-center hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <addon.icon className="w-8 h-8 text-emerald-600" />
                    </div>
                    <CardTitle className="text-xl">{addon.name}</CardTitle>
                    <div className="mt-2">
                      {addon.prices.map((price, index) => (
                        <Badge key={index} variant="outline" className="mx-1 mb-2">
                          {price}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-6">{addon.description}</p>
                    <Button variant="outline" className="w-full">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* FAQ or additional info */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Need Enterprise Solutions?</h3>
              <p className="text-slate-600 mb-6">
                Custom pricing with API access, white-label options, and dedicated onboarding support.
              </p>
              <Button size="lg" variant="outline">
                Contact Sales Team
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
