import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Award, CheckCircle, Users, Briefcase, ArrowRight, Star } from "lucide-react";
import { User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // If user is logged in, redirect them to their dashboard
      if (currentUser.role === 'company') {
        window.location.href = createPageUrl("CompanyDashboard");
      } else if (currentUser.role === 'jobseeker') {
        window.location.href = createPageUrl("JobseekerDashboard");
      } else if (currentUser.role === 'admin') {
        window.location.href = createPageUrl("AdminDashboard");
      }
    } catch (error) {
      // User not authenticated, so just show the public home page
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    await User.loginWithRedirect(window.location.origin + createPageUrl("AuthCallback"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Hero Section */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-20 pb-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Proof<span className="text-emerald-400">AndFit</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              The challenge-based hiring platform for <span className="text-emerald-400 font-semibold">fraud detection</span>, 
              <span className="text-emerald-400 font-semibold"> forensic accounting</span>, and 
              <span className="text-emerald-400 font-semibold"> complex problem-solving</span> roles.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <div className="flex items-center gap-2 text-slate-300">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">Trusted by 500+ professionals</span>
              </div>
            </div>
          </div>

          {/* Value Propositions */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <Card className="glass-card border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">For Companies</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <p className="text-lg leading-relaxed">
                  Find candidates who can actually do the job. Skip the resume theater and see real skills in action.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Custom or AI-generated challenges</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Automated grading & scoring</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Skill-based candidate search</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Vetted professional pool</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">For Job Seekers</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <p className="text-lg leading-relaxed">
                  Showcase your expertise through challenges that matter. Get hired based on what you can do, not just what you say.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Skill-verified applications</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Direct company invitations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Optional background checks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Transparent salary ranges</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-white mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Badge className="bg-white text-blue-600 font-bold text-lg w-8 h-8 rounded-full p-0 flex items-center justify-center">1</Badge>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Apply & Get Vetted</h3>
                <p className="text-slate-300 leading-relaxed">
                  Complete profile, verify phone, and pass our vetting process to join the talent pool.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Badge className="bg-white text-emerald-600 font-bold text-lg w-8 h-8 rounded-full p-0 flex items-center justify-center">2</Badge>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Tackle Real Challenges</h3>
                <p className="text-slate-300 leading-relaxed">
                  Complete job-specific challenges that test your actual skills and problem-solving abilities.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Badge className="bg-white text-purple-600 font-bold text-lg w-8 h-8 rounded-full p-0 flex items-center justify-center">3</Badge>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Get Hired</h3>
                <p className="text-slate-300 leading-relaxed">
                  Stand out with verified skills and get matched with companies looking for your expertise.
                </p>
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Specialized For</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                "Fraud Detection", "Forensic Accounting", "Financial Investigations", 
                "Compliance Analysis", "Risk Assessment", "Data Analytics",
                "Cybersecurity", "Internal Auditing", "Anti-Money Laundering"
              ].map((skill) => (
                <Badge 
                  key={skill}
                  variant="outline" 
                  className="bg-slate-800/50 border-emerald-500/30 text-emerald-300 px-4 py-2 text-sm font-medium hover:bg-emerald-500/10 transition-colors"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Founder's Note */}
          <div className="my-20 max-w-4xl mx-auto">
            <Card className="glass-card border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
              <div className="p-8">
                <div className="uppercase tracking-wide text-sm text-emerald-400 font-semibold">A Note from Our Founder</div>
                <p className="mt-4 text-xl text-slate-200 italic leading-relaxed">
                  "I created this platform because it's not always about the degree—some people just have better skills. Traditional hiring overlooks incredible talent by focusing on the wrong credentials. ProofAndFit was built to prove that demonstrated ability is what truly matters."
                </p>
                <p className="mt-6 font-bold text-white">
                  Amanda Wilson
                  <span className="font-medium text-slate-400">, Founder of ProofAndFit</span>
                </p>
              </div>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="glass-card border-slate-700/50 p-8 rounded-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h3>
              <p className="text-slate-300 mb-6 text-lg">
                Join the future of skill-verified hiring. Whether you're looking to hire or get hired, we'll match you based on proven abilities.
              </p>
              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
              >
                Sign Up Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}