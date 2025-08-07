import React, { useState, useEffect } from 'react';
import { User, JobPost, JobApplication } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FolderOpen } from 'lucide-react';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchApplications = async () => {
      try {
        const currentUser = await User.me();
        if (!isMounted) return;

        // 1. Get all jobs posted by the current company
        const companyJobs = await JobPost.filter({ company_user_id: currentUser.id });
        const jobIds = companyJobs.map(job => job.id);
        const jobMap = new Map(companyJobs.map(job => [job.id, job.title]));

        if (jobIds.length === 0) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // 2. Fetch all applications and filter them client-side
        // Note: In a large-scale app, this would be a single backend query
        const allApplications = await JobApplication.list();
        const companyApplications = allApplications.filter(app => jobIds.includes(app.job_post_id));

        if (companyApplications.length === 0) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // 3. Get unique applicant IDs and fetch their user data
        const applicantIds = [...new Set(companyApplications.map(app => app.jobseeker_user_id))];
        const allUsers = await User.list(); // Again, not ideal, but works for this scale
        const userMap = new Map(allUsers.map(u => [u.id, u.full_name || u.email]));
        
        // 4. Enrich application data with job title and applicant name
        const enrichedApplications = companyApplications.map(app => ({
          ...app,
          job_title: jobMap.get(app.job_post_id) || 'Unknown Job',
          applicant_name: userMap.get(app.jobseeker_user_id) || 'Unknown Applicant',
        })).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        if (isMounted) {
          setApplications(enrichedApplications);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchApplications();

    return () => { isMounted = false; };
  }, []);
  
  const statusColors = {
    submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    challenges_pending: 'bg-purple-100 text-purple-800',
    challenges_completed: 'bg-indigo-100 text-indigo-800',
    shortlisted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    hired: 'bg-emerald-100 text-emerald-800',
    draft: 'bg-slate-100 text-slate-800'
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users /> Candidate Applications
          </h1>
          <p className="text-slate-600 mt-1">Review and manage all applications for your job postings.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>All Received Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-800">No Applications Yet</h3>
                <p className="text-slate-500 mt-2">When candidates apply to your jobs, you'll see them here.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Job Posting</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map(app => (
                    <TableRow key={app.id} className="hover:bg-slate-50 cursor-pointer">
                      <TableCell className="font-medium text-slate-800">{app.applicant_name}</TableCell>
                      <TableCell>{app.job_title}</TableCell>
                      <TableCell>
                        <Badge className={`capitalize ${statusColors[app.status] || statusColors.draft}`}>
                          {app.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(app.created_date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}