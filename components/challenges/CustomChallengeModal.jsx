import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload, File, Trash2 } from 'lucide-react';
import { UploadFile } from '@/api/integrations';

export default function CustomChallengeModal({ onAddChallenge, onClose }) {
  const [challenge, setChallenge] = useState({
    title: '',
    description: '',
    challenge_type: 'custom',
    difficulty: 'medium',
    category: 'problem_solving',
    file_attachments: [],
    time_limit_minutes: 60,
    answer_format: 'text'
  });
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (field, value) => {
    setChallenge(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { data } = await UploadFile({ file });
        return {
          url: data.file_url,
          name: file.name,
          size: file.size,
          type: file.type
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setChallenge(prev => ({
        ...prev,
        file_attachments: [...prev.file_attachments, ...uploadedFiles]
      }));
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setChallenge(prev => ({
      ...prev,
      file_attachments: prev.file_attachments.filter((_, i) => i !== index)
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const handleAdd = () => {
    if (challenge.title && challenge.description) {
      const challengeToAdd = {
        ...challenge,
        file_attachments: challenge.file_attachments.map(f => f.url) // Only store URLs in the entity
      };
      onAddChallenge(challengeToAdd);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-white relative max-h-[90vh] overflow-y-auto">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-10" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
        <CardHeader>
          <CardTitle>Create a Custom Challenge</CardTitle>
          <p className="text-sm text-slate-600">Design a challenge with supporting documents for realistic skill assessment.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="custom-title">Challenge Title *</Label>
              <Input 
                id="custom-title" 
                value={challenge.title} 
                onChange={e => handleInputChange('title', e.target.value)}
                placeholder="e.g., Analyze Suspicious Transactions"
              />
            </div>
            <div>
              <Label>Time Limit (minutes)</Label>
              <Input 
                type="number" 
                value={challenge.time_limit_minutes} 
                onChange={e => handleInputChange('time_limit_minutes', parseInt(e.target.value))}
                placeholder="60"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="custom-desc">Challenge Description *</Label>
            <Textarea 
              id="custom-desc" 
              value={challenge.description} 
              onChange={e => handleInputChange('description', e.target.value)}
              className="h-32"
              placeholder="Provide detailed instructions for the candidate. Explain what they need to analyze, what format you expect their response in, and any specific requirements..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Difficulty</Label>
              <Select value={challenge.difficulty} onValueChange={value => handleInputChange('difficulty', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={challenge.category} onValueChange={value => handleInputChange('category', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fraud_detection">Fraud Detection</SelectItem>
                  <SelectItem value="forensic_accounting">Forensic Accounting</SelectItem>
                  <SelectItem value="investigation">Investigation</SelectItem>
                  <SelectItem value="data_analysis">Data Analysis</SelectItem>
                  <SelectItem value="problem_solving">Problem Solving</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expected Answer Format</Label>
              <Select value={challenge.answer_format} onValueChange={value => handleInputChange('answer_format', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Written Response</SelectItem>
                  <SelectItem value="file_upload">File Upload</SelectItem>
                  <SelectItem value="mixed">Text + Files</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
            <div className="text-center mb-4">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-slate-700">Upload Challenge Documents</h3>
              <p className="text-sm text-slate-500 mb-4">
                Upload case files, transaction data, financial statements, or any documents candidates need to analyze
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.docx,.doc,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('file-upload').click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Select Files'}
              </Button>
              <p className="text-xs text-slate-400 mt-2">
                Supported: PDF, Excel, CSV, Images, Word documents (Max 10MB each)
              </p>
            </div>

            {/* Uploaded Files List */}
            {challenge.file_attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-slate-700">Uploaded Files ({challenge.file_attachments.length})</h4>
                {challenge.file_attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="font-medium text-slate-700 text-sm">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Challenge Preview */}
          {challenge.title && challenge.description && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold text-slate-700 mb-2">Challenge Preview</h4>
              <div className="space-y-2">
                <h5 className="font-medium">{challenge.title}</h5>
                <p className="text-sm text-slate-600">{challenge.description}</p>
                <div className="flex gap-2">
                  <Badge variant="outline">{challenge.difficulty}</Badge>
                  <Badge variant="outline">{challenge.category?.replace('_', ' ')}</Badge>
                  <Badge variant="outline">{challenge.time_limit_minutes} min</Badge>
                  {challenge.file_attachments.length > 0 && (
                    <Badge variant="outline">{challenge file_attachments.length} files</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleAdd} 
              disabled={!challenge.title || !challenge.description || uploading}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Challenge
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}