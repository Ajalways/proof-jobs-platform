import React, { useState, useEffect } from 'react';
import { User, JobPost, JobApplication } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadApplications = async () => {
      try {
        const currentUser = await User.me();
        if (!isMounted) return;

        // Get all applications for this user
        const userApplications = await JobApplication.filter({ 
          jobseeker_user_id: currentUser.id 
        });

        if (userApplications.length === 0) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // Get job details for each application
        const jobIds = [...new Set(userApplications.map(app => app.job_post_id))];
        const allJobs = await JobPost.list();
        const jobMap = new Map(allJobs.map(job => [job.id, job]));

        // Combine application data with job data
        const enrichedApplications = userApplications.map(app => ({
          ...app,
          job: jobMap.get(app.job_post_id)
        })).filter(app => app.job); // Only include applications with valid jobs

        if (isMounted) {
          setApplications(enrichedApplications);
        }
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadApplications();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'reviewed':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Applications</h1>
          <p className="text-slate-600 mt-1">Track the status of your job applications.</p>
        </header>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-800">No Applications Yet</h3>
              <p className="text-slate-500 mt-2">You haven't applied to any jobs. Start browsing to find your perfect match!</p>
              <Button className="mt-4">
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{application.job?.title}</CardTitle>
                      <p className="text-sm text-slate-600">{application.job?.company_name || 'Company'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(application.status)}
                      <Badge className={getStatusColor(application.status)}>
                        {application.status?.charAt(0).toUpperCase() + application.status?.slice(1) || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-medium">Applied:</span> {' '}
                        {application.created_at ? 
                          new Date(application.created_at).toLocaleDateString() :
                          'Recently'
                        }
                      </p>
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-medium">Location:</span> {application.job?.location || application.job?.work_location || 'Remote'}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Type:</span> {application.job?.job_type?.replace('_', ' ') || 'Full-time'}
                      </p>
                    </div>
                    <div>
                      {application.job?.salary_range_min && application.job?.salary_range_max && (
                        <p className="text-sm text-slate-600 mb-2">
                          <span className="font-medium">Salary:</span> ${application.job.salary_range_min.toLocaleString()} - ${application.job.salary_range_max.toLocaleString()}
                        </p>
                      )}
                      {application.cover_letter && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Cover Letter:</span> Submitted
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {application.job?.description && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {application.job.description}
                      </p>
                    </div>
                  )}

                  {application.notes && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 mb-1">Application Notes:</p>
                      <p className="text-sm text-slate-600">{application.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}