
import React, { useEffect, useState } from "react";
import { User as UserEntity } from "@/api/entities";
import { JobseekerBio } from "@/api/entities";
import DynamicForm from "@/components/forms/DynamicForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Building, User, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function AuthCallback() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: '',
    company_name: '',
    company_size: '',
    industry: '',
    location: '',
    website: ''
  });

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const checkAuthStatus = async () => {
      try {
        const currentUser = await UserEntity.me();
        if (!isMounted) return;

        setUser(currentUser);
        
        // Check for fully onboarded company
        if (currentUser.role === 'company' && currentUser.company_name) {
          window.location.href = createPageUrl("CompanyDashboard");
          return;
        }

        // Check for fully onboarded jobseeker (they have a bio record)
        if (currentUser.role === 'jobseeker') {
            try {
                const bios = await JobseekerBio.filter({ user_id: currentUser.id });
                if (isMounted && bios.length > 0) {
                    window.location.href = createPageUrl("JobseekerDashboard");
                    return;
                }
            } catch (bioError) {
                console.log("Could not load jobseeker bio, continuing with onboarding", bioError);
            }
        }
        
        // If not fully onboarded, show the selection/completion steps.
        if (isMounted) {
            setLoading(false);
        }

      } catch (error) {
        console.error("Auth error:", error);
        
        // Retry logic for network errors
        if (isMounted && retryCount < maxRetries && (error.message?.includes('aborted') || error.message?.includes('network'))) {
          retryCount++;
          console.log(`Retrying auth check (${retryCount}/${maxRetries})...`);
          setTimeout(() => {
            if (isMounted) {
              checkAuthStatus();
            }
          }, 1000 * retryCount); // Exponential backoff
          return;
        }
        
        if (isMounted) {
          setError("Authentication failed. Please try logging in again.");
          setLoading(false);
        }
        
        // Redirect to home after a delay
        setTimeout(() => {
          if (isMounted) {
            window.location.href = createPageUrl("Home");
          }
        }, 3000);
      }
    };

    checkAuthStatus();

    return () => { isMounted = false; };
  }, []);

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
    setStep(2);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedData = {
        role: formData.role,
        ...(formData.role === 'company' ? {
          company_name: formData.company_name,
          company_size: formData.company_size,
          industry: formData.industry,
          location: formData.location,
          website: formData.website
        } : {})
      };
      
      await UserEntity.updateMyUserData(updatedData);

      // If jobseeker, create a bio record
      if (formData.role === 'jobseeker' && user && user.id) {
        try {
          await JobseekerBio.create({ user_id: user.id });
        } catch (bioError) {
          console.log("Bio creation skipped, will be created later:", bioError);
        }
      }
      
      // Redirect based on role
      if (formData.role === 'company') {
        window.location.href = createPageUrl("CompanyDashboard");
      } else {
        window.location.href = createPageUrl("JobseekerDashboard");
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      setError("Failed to update your profile. Please try again.");
      setLoading(false);
    }
  };

  if (loading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
        <Card className="glass-card border-slate-700/50 max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl text-white">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.href = createPageUrl("Home")}
              className="w-full"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to ProofAndFit</h1>
          <p className="text-slate-300">Let's set up your account</p>
          {user && (
            <p className="text-emerald-300 text-sm mt-2">
              Logged in as: {user.email}
            </p>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}>
              1
            </div>
            <div className="w-16 h-1 bg-slate-700"></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}>
              2
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card className="glass-card border-slate-700/50">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-white">Choose Your Role</CardTitle>
              <p className="text-slate-300">Are you hiring talent or looking for work?</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => handleRoleSelect('company')}
                variant="outline"
                className="w-full p-8 h-auto border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white mb-1">I'm a Company</h3>
                    <p className="text-slate-300">I want to hire skilled professionals</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 ml-auto group-hover:text-emerald-400 transition-colors" />
                </div>
              </Button>

              <Button
                onClick={() => handleRoleSelect('jobseeker')}
                variant="outline"
                className="w-full p-8 h-auto border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white mb-1">I'm a Job Seeker</h3>
                    <p className="text-slate-300">I want to find work and showcase my skills</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 ml-auto group-hover:text-emerald-400 transition-colors" />
                </div>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Company details form */}
        {step === 2 && formData.role === 'company' && (
          <Card className="glass-card border-slate-700/50">
            <CardHeader className="text-center pb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Company Information</CardTitle>
              <p className="text-slate-300">Tell us about your company</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-white">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Enter company name"
                    className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_size" className="text-white">Company Size</Label>
                  <Select value={formData.company_size} onValueChange={(value) => handleInputChange('company_size', value)}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-1000">201-1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-white">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder="e.g., Financial Services"
                    className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., New York, NY"
                    className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-white">Website (Optional)</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.company.com"
                  className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleComplete}
                disabled={!formData.company_name || loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold rounded-xl shadow-xl hover:shadow-emerald-500/25 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Job seeker welcome */}
        {step === 2 && formData.role === 'jobseeker' && (
          <Card className="glass-card border-slate-700/50">
            <CardHeader className="text-center pb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Welcome, Job Seeker!</CardTitle>
              <p className="text-slate-300">Let's get your profile started</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Next Steps:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-emerald-100/10 border-emerald-500/30 text-emerald-300">1</Badge>
                    <span className="text-slate-300">Complete your professional bio</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-slate-100/10 border-slate-500/30 text-slate-400">2</Badge>
                    <span className="text-slate-300">Verify your phone number</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-slate-100/10 border-slate-500/30 text-slate-400">3</Badge>
                    <span className="text-slate-300">Get approved and start applying</span>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleComplete}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold rounded-xl shadow-xl hover:shadow-emerald-500/25 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    Continue to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
