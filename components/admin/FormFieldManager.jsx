import React, { useState, useEffect } from 'react';
import { User, SkillTag } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Settings, Users, Briefcase, Award, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function FormFieldManager() {
  const [jobseekerFields, setJobseekerFields] = useState([]);
  const [companyFields, setCompanyFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [activeTab, setActiveTab] = useState('jobseeker');

  // Default field types available
  const fieldTypes = [
    'text', 'email', 'number', 'select', 'textarea', 'checkbox', 'radio', 'date', 'phone', 'url'
  ];

  useEffect(() => {
    loadFormFields();
  }, []);

  const loadFormFields = async () => {
    try {
      // Load existing form configurations from your entities
      // For now, we'll start with default configurations
      const defaultJobseekerFields = [
        { id: 1, name: 'full_name', label: 'Full Name', type: 'text', required: true, visible: true, order: 1 },
        { id: 2, name: 'email', label: 'Email Address', type: 'email', required: true, visible: true, order: 2 },
        { id: 3, name: 'phone', label: 'Phone Number', type: 'phone', required: true, visible: true, order: 3 },
        { id: 4, name: 'experience_level', label: 'Experience Level', type: 'select', required: true, visible: true, order: 4, options: ['Entry Level', 'Mid Level', 'Senior Level', 'Expert'] },
        { id: 5, name: 'specialization', label: 'Specialization Area', type: 'select', required: false, visible: true, order: 5, options: ['Fraud Detection', 'Financial Investigation', 'Litigation Support', 'Compliance', 'Risk Assessment'] },
        { id: 6, name: 'certifications', label: 'Professional Certifications', type: 'textarea', required: false, visible: true, order: 6 },
        { id: 7, name: 'salary_expectation', label: 'Salary Expectation', type: 'number', required: false, visible: true, order: 7 },
        { id: 8, name: 'availability', label: 'Availability', type: 'select', required: false, visible: true, order: 8, options: ['Immediate', 'Within 2 weeks', 'Within 1 month', 'Within 3 months'] },
        { id: 9, name: 'work_preference', label: 'Work Preference', type: 'radio', required: false, visible: true, order: 9, options: ['Remote', 'Hybrid', 'On-site', 'Flexible'] },
        { id: 10, name: 'portfolio_url', label: 'Portfolio/LinkedIn URL', type: 'url', required: false, visible: true, order: 10 },
      ];

      const defaultCompanyFields = [
        { id: 1, name: 'company_name', label: 'Company Name', type: 'text', required: true, visible: true, order: 1 },
        { id: 2, name: 'contact_email', label: 'Contact Email', type: 'email', required: true, visible: true, order: 2 },
        { id: 3, name: 'contact_phone', label: 'Contact Phone', type: 'phone', required: true, visible: true, order: 3 },
        { id: 4, name: 'company_size', label: 'Company Size', type: 'select', required: true, visible: true, order: 4, options: ['1-10', '11-50', '51-200', '201-500', '500+'] },
        { id: 5, name: 'industry', label: 'Industry', type: 'select', required: true, visible: true, order: 5, options: ['Accounting Firm', 'Law Firm', 'Insurance', 'Banking', 'Government', 'Corporate', 'Consulting'] },
        { id: 6, name: 'location', label: 'Company Location', type: 'text', required: false, visible: true, order: 6 },
        { id: 7, name: 'website', label: 'Company Website', type: 'url', required: false, visible: true, order: 7 },
        { id: 8, name: 'description', label: 'Company Description', type: 'textarea', required: false, visible: true, order: 8 },
        { id: 9, name: 'hiring_volume', label: 'Expected Hiring Volume', type: 'select', required: false, visible: true, order: 9, options: ['1-5 per year', '6-15 per year', '16-30 per year', '30+ per year'] },
        { id: 10, name: 'budget_range', label: 'Budget Range for Hires', type: 'select', required: false, visible: true, order: 10, options: ['$50k-75k', '$75k-100k', '$100k-150k', '$150k-200k', '$200k+'] },
      ];

      setJobseekerFields(defaultJobseekerFields);
      setCompanyFields(defaultCompanyFields);
      setLoading(false);
    } catch (error) {
      console.error('Error loading form fields:', error);
      setLoading(false);
    }
  };

  const addField = (formType) => {
    const newField = {
      id: Date.now(),
      name: '',
      label: '',
      type: 'text',
      required: false,
      visible: true,
      order: formType === 'jobseeker' ? jobseekerFields.length + 1 : companyFields.length + 1,
      options: []
    };

    if (formType === 'jobseeker') {
      setJobseekerFields([...jobseekerFields, newField]);
    } else {
      setCompanyFields([...companyFields, newField]);
    }
    
    setSelectedField(newField);
    setIsAddingField(true);
  };

  const updateField = (fieldId, updates, formType) => {
    if (formType === 'jobseeker') {
      setJobseekerFields(prev => prev.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      ));
    } else {
      setCompanyFields(prev => prev.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      ));
    }
  };

  const deleteField = (fieldId, formType) => {
    if (formType === 'jobseeker') {
      setJobseekerFields(prev => prev.filter(field => field.id !== fieldId));
    } else {
      setCompanyFields(prev => prev.filter(field => field.id !== fieldId));
    }
  };

  const moveField = (fieldId, direction, formType) => {
    const fields = formType === 'jobseeker' ? jobseekerFields : companyFields;
    const fieldIndex = fields.findIndex(f => f.id === fieldId);
    
    if ((direction === 'up' && fieldIndex > 0) || (direction === 'down' && fieldIndex < fields.length - 1)) {
      const newFields = [...fields];
      const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
      
      [newFields[fieldIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[fieldIndex]];
      
      // Update order numbers
      newFields.forEach((field, index) => {
        field.order = index + 1;
      });

      if (formType === 'jobseeker') {
        setJobseekerFields(newFields);
      } else {
        setCompanyFields(newFields);
      }
    }
  };

  const saveFormConfiguration = async () => {
    try {
      // Here you would save the configuration to your database
      // For now, we'll just show a success message
      alert('Form configuration saved successfully!');
    } catch (error) {
      console.error('Error saving form configuration:', error);
      alert('Error saving configuration. Please try again.');
    }
  };

  const FieldEditor = ({ field, formType, onUpdate, onDelete }) => {
    const [editingField, setEditingField] = useState(field);
    const [newOption, setNewOption] = useState('');

    const addOption = () => {
      if (newOption.trim()) {
        const updatedOptions = [...(editingField.options || []), newOption.trim()];
        setEditingField({ ...editingField, options: updatedOptions });
        setNewOption('');
      }
    };

    const removeOption = (optionIndex) => {
      const updatedOptions = editingField.options.filter((_, index) => index !== optionIndex);
      setEditingField({ ...editingField, options: updatedOptions });
    };

    const saveField = () => {
      onUpdate(field.id, editingField, formType);
      setSelectedField(null);
      setIsAddingField(false);
    };

    return (
      <Dialog open={selectedField?.id === field.id} onOpenChange={() => setSelectedField(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isAddingField ? 'Add New Field' : 'Edit Field'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Field Name (Internal)</Label>
                <Input
                  value={editingField.name}
                  onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                  placeholder="e.g., full_name"
                />
              </div>
              <div>
                <Label>Display Label</Label>
                <Input
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                  placeholder="e.g., Full Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Field Type</Label>
                <Select value={editingField.type} onValueChange={(value) => setEditingField({ ...editingField, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={editingField.required}
                    onCheckedChange={(checked) => setEditingField({ ...editingField, required: checked })}
                  />
                  <Label>Required</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={editingField.visible}
                    onCheckedChange={(checked) => setEditingField({ ...editingField, visible: checked })}
                  />
                  <Label>Visible</Label>
                </div>
              </div>
            </div>

            {(editingField.type === 'select' || editingField.type === 'radio') && (
              <div>
                <Label>Options</Label>
                <div className="space-y-2">
                  {editingField.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input value={option} readOnly />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Add new option"
                      onKeyPress={(e) => e.key === 'Enter' && addOption()}
                    />
                    <Button type="button" onClick={addOption}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="destructive" onClick={() => onDelete(field.id, formType)}>
                Delete Field
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setSelectedField(null)}>
                  Cancel
                </Button>
                <Button onClick={saveField}>
                  Save Field
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const FieldList = ({ fields, formType }) => (
    <div className="space-y-3">
      {fields
        .sort((a, b) => a.order - b.order)
        .map((field) => (
          <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col">
                <span className="font-medium">{field.label}</span>
                <span className="text-sm text-gray-500">
                  {field.name} ({field.type})
                </span>
              </div>
              <div className="flex space-x-1">
                {field.required && <Badge variant="destructive">Required</Badge>}
                {field.visible ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveField(field.id, 'up', formType)}
                disabled={field.order === 1}
              >
                ↑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveField(field.id, 'down', formType)}
                disabled={field.order === fields.length}
              >
                ↓
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedField(field)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
    </div>
  );

  if (loading) {
    return <div>Loading form fields...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Form Field Manager</h2>
        <Button onClick={saveFormConfiguration}>
          <Settings className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jobseeker">
            <Users className="w-4 h-4 mr-2" />
            Jobseeker Form ({jobseekerFields.length} fields)
          </TabsTrigger>
          <TabsTrigger value="company">
            <Briefcase className="w-4 h-4 mr-2" />
            Company Form ({companyFields.length} fields)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobseeker">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Jobseeker Registration Fields</CardTitle>
                <Button onClick={() => addField('jobseeker')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <FieldList fields={jobseekerFields} formType="jobseeker" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Company Registration Fields</CardTitle>
                <Button onClick={() => addField('company')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <FieldList fields={companyFields} formType="company" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedField && (
        <FieldEditor
          field={selectedField}
          formType={activeTab}
          onUpdate={updateField}
          onDelete={deleteField}
        />
      )}
    </div>
  );
}
