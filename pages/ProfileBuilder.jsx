import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { JobseekerBio } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProfileBuilder() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    bio_text: '',
    skills: [],
    desired_job_types: [],
    experience_level: '',
    salary_range_min: '',
    salary_range_max: '',
    availability: '',
    work_preference: '',
    certifications: []
  });
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const commonSkills = [
    'Fraud Detection', 'Forensic Accounting', 'Financial Analysis', 'Data Analytics',
    'Compliance', 'Risk Assessment', 'Investigation', 'Anti-Money Laundering',
    'Excel', 'SQL', 'Python', 'Internal Auditing', 'Cybersecurity'
  ];

  const jobTypes = [
    'Full-time', 'Part-time', 'Contract', 'Consulting', 'Remote Work', 
    'Project-based', 'Temporary', 'Freelance'
  ];

  useEffect(() => {
    let isMounted = true;
    
    const loadProfile = async () => {
      try {
        const currentUser = await User.me();
        if (!isMounted) return;
        setUser(currentUser);

        const profiles = await JobseekerBio.filter({ user_id: currentUser.id });
        if (!isMounted) return;
        
        if (profiles.length > 0) {
          setProfile(profiles[0]);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = (skill) => {
    if (skill && !profile.skills.includes(skill)) {
      setProfile(prev => ({ 
        ...prev, 
        skills: [...prev.skills, skill] 
      }));
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const toggleJobType = (jobType) => {
    setProfile(prev => ({
      ...prev,
      desired_job_types: prev.desired_job_types.includes(jobType)
        ? prev.desired_job_types.filter(type => type !== jobType)
        : [...prev.desired_job_types, jobType]
    }));
  };

  const addCertification = () => {
    if (newCertification && !profile.certifications.includes(newCertification)) {
      setProfile(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (certToRemove) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert !== certToRemove)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const profileData = {
        ...profile,
        user_id: user.id,
        salary_range_min: profile.salary_range_min ? parseInt(profile.salary_range_min) : null,
        salary_range_max: profile.salary_range_max ? parseInt(profile.salary_range_max) : null
      };

      const existingProfiles = await JobseekerBio.filter({ user_id: user.id });
      
      if (existingProfiles.length > 0) {
        await JobseekerBio.update(existingProfiles[0].id, profileData);
      } else {
        await JobseekerBio.create(profileData);
      }

      // Redirect back to dashboard
      window.location.href = createPageUrl("JobseekerDashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl("JobseekerDashboard")}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Build Your Profile</h1>
          <p className="text-slate-600 mt-1">Create a comprehensive profile to showcase your expertise</p>
        </div>

        <div className="space-y-8">
          {/* Professional Bio */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Bio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio_text">Tell us about your professional background and expertise</Label>
                <Textarea
                  id="bio_text"
                  value={profile.bio_text}
                  onChange={(e) => handleInputChange('bio_text', e.target.value)}
                  placeholder="I am a forensic accountant with 5+ years of experience in fraud detection and financial investigations..."
                  className="h-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Quick Add Common Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonSkills.map((skill) => (
                    <Button
                      key={skill}
                      variant="outline"
                      size="sm"
                      onClick={() => addSkill(skill)}
                      disabled={profile.skills.includes(skill)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {skill}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Add Custom Skill</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Enter a skill..."
                  />
                  <Button onClick={() => addSkill(newSkill)}>Add</Button>
                </div>
              </div>

              {profile.skills.length > 0 && (
                <div>
                  <Label>Your Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-red-500" 
                          onClick={() => removeSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experience & Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Experience & Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Experience Level</Label>
                  <Select value={profile.experience_level} onValueChange={(value) => handleInputChange('experience_level', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="junior">Junior (2-5 years)</SelectItem>
                      <SelectItem value="mid">Mid-Level (5-8 years)</SelectItem>
                      <SelectItem value="senior">Senior (8-15 years)</SelectItem>
                      <SelectItem value="expert">Expert (15+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Work Preference</Label>
                  <Select value={profile.work_preference} onValueChange={(value) => handleInputChange('work_preference', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Availability</Label>
                <Select value={profile.availability} onValueChange={(value) => handleInputChange('availability', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="When can you start?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="2weeks">2 weeks</SelectItem>
                    <SelectItem value="1month">1 month</SelectItem>
                    <SelectItem value="3months">3 months</SelectItem>
                    <SelectItem value="not_looking">Not actively looking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Job Types */}
          <Card>
            <CardHeader>
              <CardTitle>Desired Job Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {jobTypes.map((jobType) => (
                  <div key={jobType} className="flex items-center space-x-2">
                    <Checkbox
                      id={jobType}
                      checked={profile.desired_job_types.includes(jobType)}
                      onCheckedChange={() => toggleJobType(jobType)}
                    />
                    <Label htmlFor={jobType} className="text-sm">{jobType}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Salary Expectations */}
          <Card>
            <CardHeader>
              <CardTitle>Salary Expectations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Salary ($)</Label>
                  <Input
                    type="number"
                    value={profile.salary_range_min}
                    onChange={(e) => handleInputChange('salary_range_min', e.target.value)}
                    placeholder="60000"
                  />
                </div>
                <div>
                  <Label>Maximum Salary ($)</Label>
                  <Input
                    type="number"
                    value={profile.salary_range_max}
                    onChange={(e) => handleInputChange('salary_range_max', e.target.value)}
                    placeholder="90000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Add Certification</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="e.g., CPA, CFE, CISA..."
                  />
                  <Button onClick={addCertification}>Add</Button>
                </div>
              </div>

              {profile.certifications.length > 0 && (
                <div>
                  <Label>Your Certifications</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {cert}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-red-500" 
                          onClick={() => removeCertification(cert)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              size="lg" 
              onClick={handleSave} 
              disabled={saving || !profile.bio_text || profile.skills.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}