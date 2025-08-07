import React, { useState, useEffect } from 'react';
import { User, JobPost, SkillTag } from '@/api/entities';
import { useLocation, useNavigate } from 'react-router-dom';
import StatCard from '../components/admin/StatCard';
import UserManagement from '../components/admin/UserManagement';
import JobManagement from '../components/admin/JobManagement';
import SkillManagement from '../components/admin/SkillManagement';
import FormFieldManager from '../components/admin/FormFieldManager';
import AIChallengeManager from '../components/admin/AIChallengeManager';
import { Users, Briefcase, UserCheck, BarChart2, Settings, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User as UserEntity } from '@/api/entities';
import { createPageUrl } from '@/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, companies: 0, jobseekers: 0, activeJobs: 0 });
  const [loading, setLoading] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const urlParams = new URLSearchParams(location.search);
  const activeTab = urlParams.get('tab') || 'overview';

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const currentUser = await UserEntity.me();
        if (!isMounted) return;

        if (currentUser.role !== 'admin') {
          navigate(createPageUrl('Home'));
          return;
        }

        setLoading(true);
        const usersPromise = User.list();
        const jobsPromise = JobPost.list();
        const [users, jobs] = await Promise.all([usersPromise, jobsPromise]);

        if (isMounted) {
          setStats({
            totalUsers: users.length,
            companies: users.filter(u => u.role === 'company').length,
            jobseekers: users.filter(u => u.role === 'jobseeker').length,
            activeJobs: jobs.filter(j => j.status === 'active').length,
          });
        }
      } catch (e) {
        if (isMounted) {
          console.error("Failed to load admin data", e);
          if (e.message.includes('Unauthorized')) {
            navigate(createPageUrl('Home'));
          }
        }
      } finally {
        if (isMounted) {
            setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleTabChange = (value) => {
    navigate(`${location.pathname}?tab=${value}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Platform overview and management tools.</p>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="forms">
              <Settings className="w-4 h-4 mr-1" />
              Forms
            </TabsTrigger>
            <TabsTrigger value="challenges">
              <Sparkles className="w-4 h-4 mr-1" />
              AI Challenges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Users" value={stats.totalUsers} icon={Users} loading={loading} />
              <StatCard title="Companies" value={stats.companies} icon={Briefcase} loading={loading} />
              <StatCard title="Job Seekers" value={stats.jobseekers} icon={UserCheck} loading={loading} />
              <StatCard title="Active Jobs" value={stats.activeJobs} icon={BarChart2} loading={loading} />
            </div>
          </TabsContent>
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          <TabsContent value="jobs">
            <JobManagement />
          </TabsContent>
          <TabsContent value="skills">
            <SkillManagement />
          </TabsContent>
          <TabsContent value="forms">
            <FormFieldManager />
          </TabsContent>
          <TabsContent value="challenges">
            <AIChallengeManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}