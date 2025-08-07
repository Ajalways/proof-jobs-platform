import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, JobPost, Challenge, AIChallengeAnswerKey, SkillTag } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Briefcase, ArrowLeft, Loader2, Save, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function PostJob() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobDetails, setJobDetails] = useState({
    title: '',
    description: '',
    job_type: 'full_time',
    work_location: 'remote',
    location: '',
    salary_range_min: '',
    salary_range_max: '',
    experience_level: 'mid',
    industry: '',
    required_skills: [],
    status: 'active'
  });
  const [newSkill, setNewSkill] = useState('');
  const [challenges, setChallenges] = useState([]);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  useEffect(() => {
    User.me().then(setUser);
  }, []);

  const handleJobInputChange = (field, value) => {
    setJobDetails(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (newSkill && !jobDetails.required_skills.includes(newSkill)) {
      setJobDetails(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, newSkill]
      }));
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove) => {
    setJobDetails(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(s => s !== skillToRemove)
    }));
  };

  const addChallenge = (challenge) => {
    setChallenges(prev => [...prev, challenge]);
    setShowAIGenerator(false);
    setShowCustomModal(false);
  };
  
  const removeChallenge = (index) => {
    setChallenges(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostJob = async () => {
    if (!user) {
      alert("You must be logged in to post a job.");
      return;
    }
    setLoading(true);
    try {
      const jobData = {
          ...jobDetails,
          company_user_id: user.id,
          salary_range_min: parseInt(jobDetails.salary_range_min, 10) || 0,
          salary_range_max: parseInt(jobDetails.salary_range_max, 10) || 0,
      };
      const newJobPost = await JobPost.create(jobData);

      if (challenges.length > 0) {
        const challengePromises = challenges.map(challenge => {
            const { correct_answer, answer_explanation, ...challengeDetails } = challenge;
            const challengeData = {
                ...challengeDetails,
                job_post_id: newJobPost.id,
            };
            
            const newChallengePromise = Challenge.create(challengeData);

            if (challenge.challenge_type === 'ai_generated' && correct_answer) {
                return newChallengePromise.then(newChallenge => 
                    AIChallengeAnswerKey.create({
                        challenge_id: newChallenge.id,
                        correct_answer: correct_answer,
                        answer_explanation: answer_explanation
                    })
                );
            }
            return newChallengePromise;
        });
        await Promise.all(challengePromises);
      }
      navigate(createPageUrl("CompanyDashboard"));
    } catch (error) {
      console.error("Failed to post job:", error);
      alert("There was an error posting your job. Please check all fields and try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return jobDetails.title && jobDetails.description && jobDetails.salary_range_min && jobDetails.salary_range_max;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 text-slate-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Briefcase /> Create a New Job Posting
          </h1>
          <p className="text-slate-500 mt-1">Fill out the details below to find your next top performer.</p>
        </header>

        <div className="space-y-8">
          <Card>
            <CardHeader><CardTitle>1. Job Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title" className="font-semibold">Job Title *</Label>
                <Input id="title" value={jobDetails.title} onChange={e => handleJobInputChange('title', e.target.value)} placeholder="e.g., Senior Fraud Analyst"/>
              </div>
              <div>
                <Label htmlFor="description" className="font-semibold">Job Description *</Label>
                <Textarea id="description" value={jobDetails.description} onChange={e => handleJobInputChange('description', e.target.value)} placeholder="Describe the role, responsibilities, and qualifications..." className="h-32"/>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="industry" className="font-semibold">Industry</Label>
                  <Input id="industry" value={jobDetails.industry} onChange={e => handleJobInputChange('industry', e.target.value)} placeholder="e.g., Financial Technology"/>
                </div>
                <div>
                  <Label htmlFor="experience_level" className="font-semibold">Experience Level</Label>
                   <Select value={jobDetails.experience_level} onValueChange={(value) => handleJobInputChange('experience_level', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="junior">Junior (2-5 years)</SelectItem>
                      <SelectItem value="mid">Mid-Level (5-8 years)</SelectItem>
                      <SelectItem value="senior">Senior (8-15 years)</SelectItem>
                      <SelectItem value="expert">Expert (15+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Required Skills</Label>
                 <div className="flex gap-2 mt-2">
                  <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="e.g., SQL, Python, Excel"/>
                  <Button onClick={addSkill} variant="outline">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {jobDetails.required_skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 text-sm py-1">
                      {skill}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeSkill(skill)}/>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>2. Employment Terms</CardTitle></CardHeader>
            <CardContent className="space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                 <div>
                  <Label className="font-semibold">Job Type</Label>
                   <Select value={jobDetails.job_type} onValueChange={(value) => handleJobInputChange('job_type', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-time</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div>
                  <Label className="font-semibold">Work Location</Label>
                  <Select value={jobDetails.work_location} onValueChange={(value) => handleJobInputChange('work_location', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {jobDetails.work_location !== 'remote' && (
                <div>
                  <Label htmlFor="location" className="font-semibold">Location</Label>
                  <Input id="location" value={jobDetails.location} onChange={e => handleJobInputChange('location', e.target.value)} placeholder="e.g., New York, NY"/>
                </div>
              )}

              <div>
                <Label className="font-semibold">Annual Salary Range ($) *</Label>
                <div className="flex items-center gap-4">
                  <Input type="number" value={jobDetails.salary_range_min} onChange={e => handleJobInputChange('salary_range_min', e.target.value)} placeholder="Minimum"/>
                  <span className="text-slate-500">-</span>
                  <Input type="number" value={jobDetails.salary_range_max} onChange={e => handleJobInputChange('salary_range_max', e.target.value)} placeholder="Maximum"/>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>3. Hiring Challenges ({challenges.length}/5)</CardTitle>
                  <CardDescription>Add challenges to test your candidates' skills.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCustomModal(true)}><Plus className="w-4 h-4 mr-2" /> Add Custom</Button>
                  <Button onClick={() => setShowAIGenerator(!showAIGenerator)}><Wand2 className="w-4 h-4 mr-2" /> Generate with AI</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showAIGenerator && <AIChallengeGenerator onChallengeGenerated={addChallenge} />}
              {showCustomModal && <CustomChallengeModal onAddChallenge={addChallenge} onClose={() => setShowCustomModal(false)} />}

              <div className="space-y-4 mt-4">
                {challenges.length === 0 && !showAIGenerator && !showCustomModal && (
                  <p className="text-center text-slate-500 py-4">No challenges added yet.</p>
                )}
                {challenges.map((challenge, index) => (
                  <div key={index} className="border p-4 rounded-md bg-slate-50/80">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-slate-800">{challenge.title}</h4>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{challenge.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{challenge.difficulty}</Badge>
                          <Badge variant="outline">{challenge.category?.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeChallenge(index)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 border-t">
            <Button size="lg" onClick={handlePostJob} disabled={loading || !isFormValid()}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Publish Job Post</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}