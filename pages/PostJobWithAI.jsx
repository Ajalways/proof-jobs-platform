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
import { Progress } from '@/components/ui/progress';
import { Briefcase, ArrowLeft, Loader2, Save, Sparkles, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function PostJobWithAI() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingChallenges, setGeneratingChallenges] = useState(false);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [skillTags, setSkillTags] = useState([]);
  const [existingChallengeHashes, setExistingChallengeHashes] = useState(new Set());
  
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

  const [challengeSettings, setChallengeSettings] = useState({
    auto_generate: true,
    difficulty_level: 'intermediate',
    challenge_types: ['scenario', 'analytical'],
    number_of_challenges: 3,
    skills_focus: []
  });

  const [generatedChallenges, setGeneratedChallenges] = useState([]);
  const [previewChallenge, setPreviewChallenge] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [currentUser, skills, existingChallenges] = await Promise.all([
        User.me(),
        SkillTag.list(),
        Challenge.list()
      ]);

      setUser(currentUser);
      setSkillTags(skills);

      // Create hash set for duplicate prevention
      const hashes = new Set();
      existingChallenges.forEach(challenge => {
        if (challenge.content_hash) {
          hashes.add(challenge.content_hash);
        }
      });
      setExistingChallengeHashes(hashes);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleJobInputChange = (field, value) => {
    setJobDetails(prev => ({ ...prev, [field]: value }));
    
    // Auto-update challenge settings based on job details
    if (field === 'required_skills' || field === 'experience_level') {
      setChallengeSettings(prev => ({
        ...prev,
        skills_focus: field === 'required_skills' ? value : prev.skills_focus,
        difficulty_level: field === 'experience_level' ? mapExperienceToDifficulty(value) : prev.difficulty_level
      }));
    }
  };

  const mapExperienceToDifficulty = (experience) => {
    const mapping = {
      'entry': 'beginner',
      'mid': 'intermediate',
      'senior': 'advanced',
      'executive': 'expert'
    };
    return mapping[experience] || 'intermediate';
  };

  const addSkill = (skill) => {
    if (skill && !jobDetails.required_skills.includes(skill)) {
      const updatedSkills = [...jobDetails.required_skills, skill];
      handleJobInputChange('required_skills', updatedSkills);
    }
  };

  const removeSkill = (skillToRemove) => {
    const updatedSkills = jobDetails.required_skills.filter(s => s !== skillToRemove);
    handleJobInputChange('required_skills', updatedSkills);
  };

  // Generate content hash for duplicate detection
  const generateContentHash = (title, description, correctAnswer) => {
    const content = `${title.toLowerCase().trim()}${description.toLowerCase().trim()}${correctAnswer.toLowerCase().trim()}`;
    return btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  };

  const generateAIPrompt = (jobTitle, jobDescription, skills, difficulty, challengeType) => {
    return `You are creating a unique forensic accounting assessment challenge for this specific job posting:

JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}
REQUIRED SKILLS: ${skills.join(', ')}
DIFFICULTY LEVEL: ${difficulty}
CHALLENGE TYPE: ${challengeType}

Create a UNIQUE challenge that:
1. Directly relates to the specific job requirements
2. Tests the exact skills needed for this position
3. Reflects the company's industry and context
4. Is appropriate for the ${difficulty} difficulty level
5. Has never been generated before

IMPORTANT: Make this challenge specific to this job posting. Use the job title, description, and context to create relevant scenarios.

Generate a JSON object with this structure:
{
  "title": "Challenge title specific to this job",
  "description": "Detailed scenario that relates to the job posting (300-500 words)",
  "correct_answer": "Comprehensive solution methodology (200-400 words)",
  "difficulty": "${difficulty}",
  "skills": ${JSON.stringify(skills.slice(0, 3))},
  "challenge_type": "${challengeType}",
  "estimated_time_minutes": ${difficulty === 'beginner' ? 20 : difficulty === 'intermediate' ? 30 : difficulty === 'advanced' ? 45 : 60},
  "evaluation_criteria": ["accuracy", "methodology", "reasoning", "industry_knowledge"]
}`;
  };

  const generateChallengesForJob = async () => {
    if (!jobDetails.title || !jobDetails.description || jobDetails.required_skills.length === 0) {
      alert('Please fill in job title, description, and required skills before generating challenges');
      return;
    }

    setGeneratingChallenges(true);
    setChallengeProgress(0);
    setGeneratedChallenges([]);

    const challengeTypes = challengeSettings.challenge_types;
    const skillsToUse = challengeSettings.skills_focus.length > 0 ? challengeSettings.skills_focus : jobDetails.required_skills;
    const progressStep = 100 / challengeSettings.number_of_challenges;

    const newChallenges = [];

    for (let i = 0; i < challengeSettings.number_of_challenges; i++) {
      try {
        const challengeType = challengeTypes[i % challengeTypes.length];
        let attempts = 0;
        let challenge = null;
        let isUnique = false;

        while (!isUnique && attempts < 3) {
          attempts++;

          const prompt = generateAIPrompt(
            jobDetails.title,
            jobDetails.description,
            skillsToUse,
            challengeSettings.difficulty_level,
            challengeType
          );

          const response = await InvokeLLM({
            prompt,
            model: "gpt-4",
            max_tokens: 1500,
            temperature: 0.7 + (attempts * 0.1),
          });

          try {
            challenge = JSON.parse(response);
            const contentHash = generateContentHash(
              challenge.title,
              challenge.description,
              challenge.correct_answer
            );

            if (!existingChallengeHashes.has(contentHash)) {
              challenge.content_hash = contentHash;
              challenge.job_specific = true;
              challenge.generated_for_job = jobDetails.title;
              existingChallengeHashes.add(contentHash);
              isUnique = true;
            }
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
          }
        }

        if (isUnique && challenge) {
          newChallenges.push(challenge);
        }

        setChallengeProgress((i + 1) * progressStep);
      } catch (error) {
        console.error(`Error generating challenge ${i + 1}:`, error);
      }
    }

    setGeneratedChallenges(newChallenges);
    setGeneratingChallenges(false);
  };

  const handlePostJob = async () => {
    if (!user) {
      alert("You must be logged in to post a job.");
      return;
    }

    if (!jobDetails.title || !jobDetails.description) {
      alert("Please fill in job title and description.");
      return;
    }

    setLoading(true);
    try {
      // Create the job post
      const jobData = {
        ...jobDetails,
        company_user_id: user.id,
        salary_range_min: parseInt(jobDetails.salary_range_min, 10) || 0,
        salary_range_max: parseInt(jobDetails.salary_range_max, 10) || 0,
      };

      const newJobPost = await JobPost.create(jobData);

      // Save generated challenges if any
      if (generatedChallenges.length > 0) {
        for (const challenge of generatedChallenges) {
          const { correct_answer, ...challengeData } = challenge;
          
          const savedChallenge = await Challenge.create({
            ...challengeData,
            job_post_id: newJobPost.id,
            is_ai_generated: true,
            created_by_admin: false
          });

          // Save answer key
          await AIChallengeAnswerKey.create({
            challenge_id: savedChallenge.id,
            correct_answer: challenge.correct_answer,
            explanation: challenge.correct_answer,
            evaluation_rubric: challenge.evaluation_criteria
          });
        }
      }

      alert(`Job posted successfully with ${generatedChallenges.length} AI-generated challenges!`);
      navigate(createPageUrl("CompanyDashboard"));
    } catch (error) {
      console.error("Error posting job:", error);
      alert("Error posting job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const ChallengePreview = ({ challenge }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{challenge.title}</CardTitle>
            <div className="flex space-x-2 mt-2">
              <Badge variant="secondary">{challenge.difficulty}</Badge>
              <Badge variant="outline">{challenge.challenge_type}</Badge>
              <Badge variant="default">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Generated
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPreviewChallenge(challenge)}>
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">
          {challenge.description.substring(0, 200)}...
        </p>
        <div className="flex flex-wrap gap-1">
          {challenge.skills?.map((skill, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" onClick={() => navigate(createPageUrl("CompanyDashboard"))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Post New Job</h1>
            <p className="text-gray-600">Create a job posting with AI-generated challenges</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Details Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Job Title</Label>
                    <Input
                      value={jobDetails.title}
                      onChange={(e) => handleJobInputChange('title', e.target.value)}
                      placeholder="Senior Forensic Accountant"
                    />
                  </div>
                  <div>
                    <Label>Experience Level</Label>
                    <Select 
                      value={jobDetails.experience_level} 
                      onValueChange={(value) => handleJobInputChange('experience_level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="executive">Executive Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Job Description</Label>
                  <Textarea
                    value={jobDetails.description}
                    onChange={(e) => handleJobInputChange('description', e.target.value)}
                    rows={6}
                    placeholder="Detailed job description including responsibilities, requirements, and company information..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Job Type</Label>
                    <Select 
                      value={jobDetails.job_type} 
                      onValueChange={(value) => handleJobInputChange('job_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Work Location</Label>
                    <Select 
                      value={jobDetails.work_location} 
                      onValueChange={(value) => handleJobInputChange('work_location', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="on_site">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Required Skills</Label>
                  <div className="flex space-x-2 mb-2">
                    <Select onValueChange={addSkill}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select skills from our database" />
                      </SelectTrigger>
                      <SelectContent>
                        {skillTags.map(skill => (
                          <SelectItem key={skill.id} value={skill.name}>
                            {skill.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {jobDetails.required_skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Challenge Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI Challenge Settings
                </CardTitle>
                <CardDescription>
                  Configure automatic challenge generation for this job
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={challengeSettings.auto_generate}
                    onCheckedChange={(checked) => 
                      setChallengeSettings(prev => ({ ...prev, auto_generate: checked }))
                    }
                  />
                  <Label>Automatically generate AI challenges for this job</Label>
                </div>

                {challengeSettings.auto_generate && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Number of Challenges</Label>
                        <Select 
                          value={challengeSettings.number_of_challenges.toString()} 
                          onValueChange={(value) => 
                            setChallengeSettings(prev => ({ 
                              ...prev, 
                              number_of_challenges: parseInt(value) 
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(num => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} challenge{num > 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Difficulty Level</Label>
                        <Select 
                          value={challengeSettings.difficulty_level} 
                          onValueChange={(value) => 
                            setChallengeSettings(prev => ({ ...prev, difficulty_level: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Challenge Types</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          { value: 'scenario', label: 'Scenario-Based' },
                          { value: 'analytical', label: 'Analytical' },
                          { value: 'technical', label: 'Technical' },
                          { value: 'case_study', label: 'Case Study' }
                        ].map(type => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Checkbox
                              checked={challengeSettings.challenge_types.includes(type.value)}
                              onCheckedChange={(checked) => {
                                setChallengeSettings(prev => ({
                                  ...prev,
                                  challenge_types: checked
                                    ? [...prev.challenge_types, type.value]
                                    : prev.challenge_types.filter(t => t !== type.value)
                                }));
                              }}
                            />
                            <Label className="text-sm">{type.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={generateChallengesForJob}
                      disabled={generatingChallenges || !jobDetails.title || !jobDetails.description}
                      className="w-full"
                    >
                      {generatingChallenges ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Challenges...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate {challengeSettings.number_of_challenges} AI Challenge{challengeSettings.number_of_challenges > 1 ? 's' : ''}
                        </>
                      )}
                    </Button>

                    {generatingChallenges && (
                      <Progress value={challengeProgress} className="w-full" />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Generated Challenges Preview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Generated Challenges ({generatedChallenges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedChallenges.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No challenges generated yet</p>
                    <p className="text-sm">Fill in job details and generate challenges</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {generatedChallenges.map((challenge, index) => (
                      <ChallengePreview key={index} challenge={challenge} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Post Job Button */}
            <Button 
              onClick={handlePostJob}
              disabled={loading || !jobDetails.title || !jobDetails.description}
              className="w-full mt-4"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting Job...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Post Job with {generatedChallenges.length} Challenge{generatedChallenges.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
