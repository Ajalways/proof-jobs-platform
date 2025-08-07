
import React, { useState, useEffect } from "react";
import { User, JobPost, DemoJobseeker } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, TrendingUp, Plus, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SubscriptionLimits from "../components/company/SubscriptionLimits";

export default function CompanyDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    demoCandidates: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New error state

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const currentUser = await User.me();
        if (!isMounted) return;
        setUser(currentUser);

        // Load data with error handling for each request
        const loadJobsWithFallback = async () => {
          try {
            return await JobPost.filter({ company_user_id: currentUser.id });
          } catch (error) {
            console.error("Error loading jobs:", error);
            // Return empty array to allow Promise.all to succeed even if this fails
            return [];
          }
        };

        const loadDemoCandidatesWithFallback = async () => {
          try {
            return await DemoJobseeker.list();
          } catch (error) {
            console.error("Error loading demo candidates:", error);
            // Return empty array to allow Promise.all to succeed even if this fails
            return [];
          }
        };

        const [jobs, demoCandidates] = await Promise.all([
          loadJobsWithFallback(),
          loadDemoCandidatesWithFallback()
        ]);
        
        if (!isMounted) return;
        
        setStats({
          activeJobs: jobs.filter(j => j.status === 'active').length,
          totalApplications: jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0),
          demoCandidates: demoCandidates.length
        });
      } catch (error) {
        console.error("Error loading dashboard:", error);
        if (isMounted) {
          setError("Failed to load dashboard data. Please refresh the page.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user?.company_name || user?.full_name || 'Company'}
          </h1>
          <p className="text-slate-600 mt-1 text-lg">
            Manage your hiring process and find the best talent
          </p>
        </div>

        {/* Subscription Status */}
        <SubscriptionLimits companyUserId={user?.id} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.activeJobs}</div>
              <p className="text-xs text-slate-500">Job postings currently open</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.totalApplications}</div>
              <p className="text-xs text-slate-500">Applications received</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Available Candidates</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.demoCandidates}</div>
              <p className="text-xs text-slate-500">
                {user?.role === 'trial' ? 'Demo profiles to explore' : 'Verified candidates'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-slate-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to={createPageUrl("PostJob")}>
                <Button className="w-full justify-start bg-emerald-600 hover:bg-emerald-700" size="lg">
                  <Plus className="w-5 h-5 mr-3" />
                  Post a New Job
                </Button>
              </Link>
              
              <Link to={createPageUrl("FindTalent")}>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Eye className="w-5 h-5 mr-3" />
                  Browse Candidates
                </Button>
              </Link>

              <Link to={createPageUrl("Applications")}>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Users className="w-5 h-5 mr-3" />
                  Review Applications
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-slate-900">Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-600 text-white">1</Badge>
                  <span className="text-sm font-medium text-slate-700">Explore our demo candidates</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-slate-200 text-slate-600">2</Badge>
                  <span className="text-sm text-slate-600">Create your first job posting</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-slate-200 text-slate-600">3</Badge>
                  <span className="text-sm text-slate-600">Set up AI-generated challenges</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-slate-200 text-slate-600">4</Badge>
                  <span className="text-sm text-slate-600">Upgrade to access real candidates</span>
                </div>
              </div>

              <Link to={createPageUrl("Pricing")}>
                <Button variant="outline" className="w-full mt-4">
                  View Pricing Plans
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
