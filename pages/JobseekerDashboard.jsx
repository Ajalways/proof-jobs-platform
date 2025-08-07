
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { JobseekerBio } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User as UserIcon, FileText, Phone, CheckCircle, Plus, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function JobseekerDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const loadDashboard = async () => {
      try {
        const currentUser = await User.me();
        if (!isMounted) return;
        setUser(currentUser);

        // Try to load existing profile with error handling
        try {
          const profiles = await JobseekerBio.filter({ user_id: currentUser.id });
          if (!isMounted) return;
          
          if (profiles.length > 0) {
            setProfile(profiles[0]);
          }

          // Calculate profile completion - profiles[0] will be undefined if no profiles found, which is handled by optional chaining
          calculateProfileCompletion(currentUser, profiles[0]);
        } catch (profileError) {
          // If loading bio fails (e.g., network error or API returns an error),
          // log it but continue to display the dashboard without profile data.
          // This assumes that a missing profile is a valid state for a new user.
          console.log("No profile found or error loading profile, showing empty state:", profileError);
          calculateProfileCompletion(currentUser, null); // Calculate completion assuming no profile
        }
      } catch (err) { // Changed 'error' to 'err' to avoid conflict with state variable
        console.error("Error loading dashboard:", err);
        if (isMounted) {
          setError("Failed to load your dashboard. Please refresh the page.");
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

  const calculateProfileCompletion = (user, profile) => {
    let completed = 0;
    let total = 7;

    if (user?.phone_verified) completed++; // Added optional chaining for user
    if (profile?.bio_text) completed++;
    if (profile?.skills?.length > 0) completed++;
    if (profile?.experience_level) completed++;
    if (profile?.desired_job_types?.length > 0) completed++;
    if (profile?.salary_range_min && profile?.salary_range_max) completed++;
    if (profile?.work_preference) completed++;

    setProfileCompletion(Math.round((completed / total) * 100));
  };

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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome, {user?.full_name || 'Job Seeker'}
          </h1>
          <p className="text-slate-600 mt-1 text-lg">
            Build your profile and start applying to skill-verified positions
          </p>
        </div>

        {/* Profile Completion */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Profile Completion</CardTitle>
              <Badge variant={profileCompletion === 100 ? "default" : "secondary"}>
                {profileCompletion}% Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={profileCompletion} className="mb-4" />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {user?.phone_verified ? 
                    <CheckCircle className="w-5 h-5 text-green-500" /> : 
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                  }
                  <span className={user?.phone_verified ? 'text-slate-900' : 'text-slate-500'}>
                    Phone Verification
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {profile?.bio_text ? 
                    <CheckCircle className="w-5 h-5 text-green-500" /> : 
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                  }
                  <span className={profile?.bio_text ? 'text-slate-900' : 'text-slate-500'}>
                    Professional Bio
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {profile?.skills?.length > 0 ? 
                    <CheckCircle className="w-5 h-5 text-green-500" /> : 
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                  }
                  <span className={profile?.skills?.length > 0 ? 'text-slate-900' : 'text-slate-500'}>
                    Skills & Expertise
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {profile?.experience_level ? 
                    <CheckCircle className="w-5 h-5 text-green-500" /> : 
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                  }
                  <span className={profile?.experience_level ? 'text-slate-900' : 'text-slate-500'}>
                    Experience Level
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {profile?.desired_job_types?.length > 0 ? 
                    <CheckCircle className="w-5 h-5 text-green-500" /> : 
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                  }
                  <span className={profile?.desired_job_types?.length > 0 ? 'text-slate-900' : 'text-slate-500'}>
                    Job Preferences
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {profile?.salary_range_min && profile?.salary_range_max ? 
                    <CheckCircle className="w-5 h-5 text-green-500" /> : 
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                  }
                  <span className={profile?.salary_range_min && profile?.salary_range_max ? 'text-slate-900' : 'text-slate-500'}>
                    Salary Expectations
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {profile?.work_preference ? 
                    <CheckCircle className="w-5 h-5 text-green-500" /> : 
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                  }
                  <span className={profile?.work_preference ? 'text-slate-900' : 'text-slate-500'}>
                    Work Preferences
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Profile Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to={createPageUrl("ProfileBuilder")}>
                <Button className="w-full justify-start" size="lg">
                  {profile ? <Edit className="w-5 h-5 mr-3" /> : <Plus className="w-5 h-5 mr-3" />}
                  {profile ? 'Edit Profile' : 'Build Your Profile'}
                </Button>
              </Link>
              
              {!user?.phone_verified && (
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Phone className="w-5 h-5 mr-3" />
                  Verify Phone Number
                </Button>
              )}
              
              <Button variant="outline" className="w-full justify-start" size="lg">
                <FileText className="w-5 h-5 mr-3" />
                Upload Resume/CV
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vetting Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Status:</span>
                  <Badge variant={user?.vetting_status === 'approved' ? 'default' : 'secondary'}>
                    {user?.vetting_status?.replace('_', ' ') || 'Pending'}
                  </Badge>
                </div>
                
                {user?.vetting_status !== 'approved' && (
                  <div className="text-sm text-slate-600">
                    <p className="mb-2">Complete these steps to get approved:</p>
                    <ul className="space-y-1 text-xs">
                      <li>✓ Build your professional profile</li>
                      <li>✓ Verify your phone number</li>
                      <li>• Complete a skills assessment</li>
                      <li>• Get background check (optional)</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Profile Summary */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle>Your Profile Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.bio_text && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Professional Bio</h4>
                    <p className="text-slate-600">{profile.bio_text}</p>
                  </div>
                )}
                
                {profile.skills && profile.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {profile.experience_level && (
                    <div>
                      <span className="font-semibold">Experience:</span> {profile.experience_level}
                    </div>
                  )}
                  {profile.work_preference && (
                    <div>
                      <span className="font-semibold">Work Style:</span> {profile.work_preference}
                    </div>
                  )}
                  {profile.salary_range_min && profile.salary_range_max && (
                    <div>
                      <span className="font-semibold">Salary Range:</span> ${profile.salary_range_min?.toLocaleString()} - ${profile.salary_range_max?.toLocaleString()}
                    </div>
                  )}
                  {profile.availability && (
                    <div>
                      <span className="font-semibold">Availability:</span> {profile.availability.replace('_', ' ')}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
