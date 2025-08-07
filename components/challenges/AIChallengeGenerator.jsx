
import React, { useState } from 'react';
import { InvokeLLM } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Check, InfoIcon, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const challengeSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "A concise title for the challenge." },
    description: { type: "string", description: "A detailed description of the task, including context and what is expected from the user." },
    correct_answer: { type: "string", description: "A detailed correct answer or an ideal solution." },
    answer_explanation: { type: "string", description: "A step-by-step explanation of how to arrive at the correct answer." }
  },
  required: ["title", "description", "correct_answer", "answer_explanation"]
};

export default function AIChallengeGenerator({ onChallengeGenerated }) {
  const [loading, setLoading] = useState(false);
  const [generatedChallenge, setGeneratedChallenge] = useState(null);
  const [error, setError] = useState(null); // Added error state
  const [options, setOptions] = useState({
    category: 'fraud_detection',
    difficulty: 'medium',
    prompt: '',
    time_limit_minutes: 60
  });

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedChallenge(null);
    setError(null); // Clear any previous errors
    
    const categoryPrompts = {
      fraud_detection: "fraud detection, suspicious transactions, risk assessment, and financial crime investigation",
      forensic_accounting: "forensic accounting, financial statement analysis, asset tracing, and evidence gathering",
      investigation: "investigation techniques, evidence analysis, interview strategies, and case building",
      data_analysis: "data analysis, statistical methods, data interpretation, and pattern recognition" // Added data_analysis
    };

    const difficultyLevels = {
      simple: "entry-level with clear indicators and straightforward analysis",
      medium: "mid-level requiring analytical thinking and pattern recognition",
      complex: "advanced level requiring deep expertise and multi-layered analysis"
    };

    const fullPrompt = `
      Act as an expert in ${categoryPrompts[options.category] || options.category.replace('_', ' ')}.
      Generate a ${difficultyLevels[options.difficulty]} hiring challenge scenario for a job application.
      The scenario should be realistic and test practical skills that would be used in a professional setting.
      
      Challenge Topic: "${options.prompt}"
      
      Create a scenario that:
      - Is based on realistic business situations
      - Tests practical problem-solving skills
      - Can be completed in approximately ${options.time_limit_minutes} minutes
      - Includes specific details that make the scenario credible
      - Provides clear success criteria
      
      Format the output as a JSON object with title, detailed description, correct answer, and explanation.
    `;
    
    try {
      const result = await InvokeLLM({
        prompt: fullPrompt,
        response_json_schema: challengeSchema
      });
      
      // Validate the structure of the AI's response
      if (!result || !result.title || !result.description || !result.correct_answer || !result.answer_explanation) {
        throw new Error("AI generated an incomplete or malformed challenge. Please try again or refine your prompt.");
      }
      
      setGeneratedChallenge(result);
    } catch (err) {
      console.error("AI Challenge Generation Failed:", err);
      // Set a user-friendly error message
      if (err.message.includes("incomplete or malformed")) {
          setError(err.message);
      } else {
          setError("Failed to generate challenge. Please check your internet connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setOptions(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error when user changes input
  };
  
  const handleAddChallenge = () => {
    try {
      // Ensure generatedChallenge exists before trying to add it
      if (!generatedChallenge) {
        setError("No challenge to add. Please generate one first.");
        return;
      }

      onChallengeGenerated({
          ...generatedChallenge,
          challenge_type: 'ai_generated',
          difficulty: options.difficulty,
          category: options.category,
          time_limit_minutes: options.time_limit_minutes,
          answer_format: 'text',
          file_attachments: []
      });
      setGeneratedChallenge(null);
      setOptions(prev => ({ ...prev, prompt: '' }));
      setError(null); // Clear error on successful add
    } catch (err) {
      console.error("Error adding challenge:", err);
      setError("Failed to add challenge. Please try again.");
    }
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200 mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-emerald-500" /> 
          AI Challenge Generator
        </CardTitle>
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            AI will create realistic scenarios based on your requirements. Perfect for testing analytical and problem-solving skills.
          </AlertDescription>
        </Alert>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display error message */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Challenge Category</Label>
            <Select value={options.category} onValueChange={value => handleInputChange('category', value)}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fraud_detection">Fraud Detection</SelectItem>
                <SelectItem value="forensic_accounting">Forensic Accounting</SelectItem>
                <SelectItem value="investigation">Investigation</SelectItem>
                <SelectItem value="data_analysis">Data Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Difficulty Level</Label>
            <Select value={options.difficulty} onValueChange={value => handleInputChange('difficulty', value)}>
              <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="complex">Complex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Time Limit (minutes)</Label>
            <Input 
              type="number" 
              value={options.time_limit_minutes} 
              onChange={e => handleInputChange('time_limit_minutes', parseInt(e.target.value) || 60)}
              placeholder="60"
            />
          </div>
        </div>
        
        <div>
          <Label>Challenge Description</Label>
          <Textarea 
            placeholder="Describe the specific scenario you want to test... e.g., 'Analyze a series of credit card transactions to identify potential fraud patterns' or 'Review financial statements to identify signs of embezzlement'"
            value={options.prompt}
            onChange={e => handleInputChange('prompt', e.target.value)}
            className="h-24"
          />
        </div>
        
        <Button 
          onClick={handleGenerate} 
          disabled={loading || !options.prompt.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Challenge...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate AI Challenge
            </>
          )}
        </Button>

        {generatedChallenge && (
          <div className="border-t pt-4 mt-4 space-y-4">
            <h3 className="font-bold text-lg text-slate-800">Generated Challenge Preview:</h3>
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-800">{generatedChallenge.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-1">Challenge Description:</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{generatedChallenge.description}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 p-3 rounded">
                      <h5 className="font-semibold text-slate-700 mb-1">Expected Answer:</h5>
                      <p className="text-slate-600 text-xs">{generatedChallenge.correct_answer.substring(0, 150)}...</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded">
                      <h5 className="font-semibold text-slate-700 mb-1">Evaluation Criteria:</h5>
                      <p className="text-slate-600 text-xs">{generatedChallenge.answer_explanation.substring(0, 150)}...</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button onClick={handleAddChallenge} className="w-full bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-2" /> Add This Challenge to Job
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
