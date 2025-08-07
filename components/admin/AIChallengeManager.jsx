import React, { useState, useEffect } from 'react';
import { Challenge, SkillTag, AIChallengeAnswerKey } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, RefreshCw, AlertTriangle, CheckCircle, Eye, Trash2, Plus, Settings } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function AIChallengeManager() {
  const [challenges, setChallenges] = useState([]);
  const [skillTags, setSkillTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [difficultyLevel, setDifficultyLevel] = useState('intermediate');
  const [challengeType, setChallengeType] = useState('scenario');
  const [batchSize, setBatchSize] = useState(5);
  const [existingChallengeHashes, setExistingChallengeHashes] = useState(new Set());
  const [duplicateAttempts, setDuplicateAttempts] = useState(0);
  const [maxDuplicateAttempts] = useState(3);

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner', description: 'Entry-level, basic concepts' },
    { value: 'intermediate', label: 'Intermediate', description: 'Mid-level, practical application' },
    { value: 'advanced', label: 'Advanced', description: 'Senior-level, complex scenarios' },
    { value: 'expert', label: 'Expert', description: 'Expert-level, cutting-edge techniques' }
  ];

  const challengeTypes = [
    { value: 'scenario', label: 'Scenario-Based', description: 'Real-world case studies and situations' },
    { value: 'analytical', label: 'Analytical', description: 'Data analysis and interpretation tasks' },
    { value: 'technical', label: 'Technical', description: 'Technical skills and tool usage' },
    { value: 'case_study', label: 'Case Study', description: 'Comprehensive investigation scenarios' },
    { value: 'problem_solving', label: 'Problem Solving', description: 'Critical thinking and solution development' }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [challengeList, skillList] = await Promise.all([
        Challenge.list(),
        SkillTag.list()
      ]);

      setChallenges(challengeList);
      setSkillTags(skillList);

      // Create hash set of existing challenges to prevent duplicates
      const hashes = new Set();
      challengeList.forEach(challenge => {
        if (challenge.content_hash) {
          hashes.add(challenge.content_hash);
        }
      });
      setExistingChallengeHashes(hashes);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  // Generate a content hash for duplicate detection
  const generateContentHash = (title, description, correctAnswer) => {
    const content = `${title.toLowerCase().trim()}${description.toLowerCase().trim()}${correctAnswer.toLowerCase().trim()}`;
    return btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  };

  // Enhanced AI prompt for generating unique challenges
  const generateAIPrompt = (skills, difficulty, type, existingHashes) => {
    const skillsText = skills.join(', ');
    const hashList = Array.from(existingHashes).slice(-20).join(', '); // Last 20 hashes for context
    
    return `You are an expert forensic accounting professional creating unique assessment challenges. 

CRITICAL REQUIREMENTS:
1. Generate completely UNIQUE content - avoid any similarity to existing challenges
2. Focus on ${skillsText} skills at ${difficulty} difficulty level
3. Create ${type} type challenges
4. Each challenge must be substantively different from others
5. Avoid these content patterns (hashes): ${hashList}

CHALLENGE REQUIREMENTS:
- Title: Concise, professional title (max 100 characters)
- Description: Detailed scenario with specific context, numbers, and realistic details (200-500 words)
- Correct Answer: Comprehensive solution with step-by-step reasoning (150-300 words)
- Difficulty: ${difficulty}
- Skills: ${skillsText}
- Type: ${type}

SCENARIOS TO AVOID:
- Generic fraud detection scenarios
- Basic ratio analysis
- Simple embezzlement cases
- Standard audit procedures

FOCUS ON UNIQUE ELEMENTS:
- Specific industry contexts (healthcare, tech, manufacturing, etc.)
- Modern fraud schemes (cryptocurrency, digital payments, remote work fraud)
- Complex multi-jurisdictional cases
- Emerging forensic technologies
- Industry-specific compliance challenges

Generate a JSON object with this exact structure:
{
  "title": "Specific, unique challenge title",
  "description": "Detailed, realistic scenario with specific context and data",
  "correct_answer": "Comprehensive solution with methodology and reasoning",
  "difficulty": "${difficulty}",
  "skills": ["${skillsText.split(', ')[0]}", "${skillsText.split(', ')[1] || skillsText.split(', ')[0]}"],
  "challenge_type": "${type}",
  "estimated_time_minutes": 30,
  "evaluation_criteria": ["accuracy", "methodology", "reasoning", "completeness"]
}`;
  };

  const generateChallenges = async () => {
    if (selectedSkills.length === 0) {
      alert('Please select at least one skill area');
      return;
    }

    setGenerating(true);
    setGenerationProgress(0);
    setDuplicateAttempts(0);

    const generatedChallenges = [];
    const progressStep = 100 / batchSize;

    for (let i = 0; i < batchSize; i++) {
      try {
        let attempts = 0;
        let challenge = null;
        let isUnique = false;

        // Try to generate unique challenge (max 3 attempts per challenge)
        while (!isUnique && attempts < maxDuplicateAttempts) {
          attempts++;
          
          const prompt = generateAIPrompt(
            selectedSkills, 
            difficultyLevel, 
            challengeType, 
            existingChallengeHashes
          );

          const response = await InvokeLLM({
            prompt,
            model: "gpt-4",
            max_tokens: 1500,
            temperature: 0.8 + (attempts * 0.1), // Increase creativity with each attempt
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
              existingChallengeHashes.add(contentHash);
              isUnique = true;
            } else {
              setDuplicateAttempts(prev => prev + 1);
              console.log(`Duplicate detected for challenge ${i + 1}, attempt ${attempts}`);
            }
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
          }
        }

        if (isUnique && challenge) {
          // Save challenge to database
          const savedChallenge = await Challenge.create({
            title: challenge.title,
            description: challenge.description,
            difficulty: challenge.difficulty,
            challenge_type: challenge.challenge_type,
            skills: challenge.skills,
            estimated_time_minutes: challenge.estimated_time_minutes || 30,
            evaluation_criteria: challenge.evaluation_criteria || ['accuracy', 'methodology'],
            content_hash: challenge.content_hash,
            is_ai_generated: true,
            created_by_admin: true
          });

          // Save answer key separately
          await AIChallengeAnswerKey.create({
            challenge_id: savedChallenge.id,
            correct_answer: challenge.correct_answer,
            explanation: challenge.correct_answer,
            evaluation_rubric: challenge.evaluation_criteria
          });

          generatedChallenges.push(savedChallenge);
        }

        setGenerationProgress((i + 1) * progressStep);
      } catch (error) {
        console.error(`Error generating challenge ${i + 1}:`, error);
      }
    }

    // Refresh challenges list
    await loadInitialData();
    setGenerating(false);
    alert(`Successfully generated ${generatedChallenges.length} unique challenges!`);
  };

  const deleteChallenge = async (challengeId) => {
    if (confirm('Are you sure you want to delete this challenge?')) {
      try {
        await Challenge.delete(challengeId);
        await loadInitialData();
      } catch (error) {
        console.error('Error deleting challenge:', error);
        alert('Error deleting challenge');
      }
    }
  };

  const ChallengeCard = ({ challenge }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{challenge.title}</CardTitle>
            <div className="flex space-x-2 mt-2">
              <Badge variant={challenge.difficulty === 'expert' ? 'destructive' : 'secondary'}>
                {challenge.difficulty}
              </Badge>
              <Badge variant="outline">{challenge.challenge_type}</Badge>
              {challenge.is_ai_generated && (
                <Badge variant="default">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => deleteChallenge(challenge.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">
          {challenge.description.substring(0, 150)}...
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

  if (loading) {
    return <div>Loading challenge manager...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Challenge Manager</h2>
        <div className="flex space-x-2">
          <Badge variant="outline">{challenges.length} Total Challenges</Badge>
          <Badge variant="secondary">{duplicateAttempts} Duplicates Prevented</Badge>
        </div>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Challenges
          </TabsTrigger>
          <TabsTrigger value="manage">
            <Settings className="w-4 h-4 mr-2" />
            Manage Challenges ({challenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate AI Challenges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {duplicateAttempts > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {duplicateAttempts} duplicate challenges were detected and prevented. 
                    Our AI ensures all challenges are unique.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Skill Areas</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {skillTags.map(skill => (
                      <div key={skill.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedSkills.includes(skill.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSkills([...selectedSkills, skill.name]);
                            } else {
                              setSelectedSkills(selectedSkills.filter(s => s !== skill.name));
                            }
                          }}
                        />
                        <Label className="text-sm">{skill.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Difficulty Level</Label>
                    <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {difficultyLevels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label} - {level.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Challenge Type</Label>
                    <Select value={challengeType} onValueChange={setChallengeType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {challengeTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label} - {type.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Batch Size</Label>
                    <Select value={batchSize.toString()} onValueChange={(value) => setBatchSize(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 5, 10].map(size => (
                          <SelectItem key={size} value={size.toString()}>
                            {size} challenge{size > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {generating && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating challenges... {Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={generationProgress} />
                </div>
              )}

              <Button 
                onClick={generateChallenges} 
                disabled={generating || selectedSkills.length === 0}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate {batchSize} Unique Challenge{batchSize > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Challenge Library</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {challenges.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No challenges generated yet</p>
                    <p className="text-sm text-gray-400">Use the Generate tab to create AI-powered challenges</p>
                  </div>
                ) : (
                  challenges.map(challenge => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
