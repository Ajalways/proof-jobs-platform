import React, { useState, useEffect } from 'react';
import { FormFieldConfig } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export default function DynamicForm({ formType, onSubmit, initialData = {}, title }) {
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFormConfiguration();
  }, [formType]);

  const loadFormConfiguration = async () => {
    try {
      // Load form field configuration from database
      // For now, we'll use default configurations based on form type
      let defaultFields = [];

      if (formType === 'jobseeker') {
        defaultFields = [
          { id: 1, name: 'full_name', label: 'Full Name', type: 'text', required: true, visible: true, order: 1 },
          { id: 2, name: 'email', label: 'Email Address', type: 'email', required: true, visible: true, order: 2 },
          { id: 3, name: 'phone', label: 'Phone Number', type: 'text', required: true, visible: true, order: 3 },
          { id: 4, name: 'experience_level', label: 'Experience Level', type: 'select', required: true, visible: true, order: 4, options: ['Entry Level', 'Mid Level', 'Senior Level', 'Expert'] },
          { id: 5, name: 'specialization', label: 'Specialization Area', type: 'select', required: false, visible: true, order: 5, options: ['Fraud Detection', 'Financial Investigation', 'Litigation Support', 'Compliance', 'Risk Assessment'] },
          { id: 6, name: 'certifications', label: 'Professional Certifications', type: 'textarea', required: false, visible: true, order: 6 },
          { id: 7, name: 'salary_expectation', label: 'Salary Expectation ($)', type: 'number', required: false, visible: true, order: 7 },
          { id: 8, name: 'availability', label: 'Availability', type: 'select', required: false, visible: true, order: 8, options: ['Immediate', 'Within 2 weeks', 'Within 1 month', 'Within 3 months'] },
          { id: 9, name: 'work_preference', label: 'Work Preference', type: 'radio', required: false, visible: true, order: 9, options: ['Remote', 'Hybrid', 'On-site', 'Flexible'] },
          { id: 10, name: 'portfolio_url', label: 'Portfolio/LinkedIn URL', type: 'url', required: false, visible: true, order: 10 },
        ];
      } else if (formType === 'company') {
        defaultFields = [
          { id: 1, name: 'company_name', label: 'Company Name', type: 'text', required: true, visible: true, order: 1 },
          { id: 2, name: 'contact_email', label: 'Contact Email', type: 'email', required: true, visible: true, order: 2 },
          { id: 3, name: 'contact_phone', label: 'Contact Phone', type: 'text', required: true, visible: true, order: 3 },
          { id: 4, name: 'company_size', label: 'Company Size', type: 'select', required: true, visible: true, order: 4, options: ['1-10', '11-50', '51-200', '201-500', '500+'] },
          { id: 5, name: 'industry', label: 'Industry', type: 'select', required: true, visible: true, order: 5, options: ['Accounting Firm', 'Law Firm', 'Insurance', 'Banking', 'Government', 'Corporate', 'Consulting'] },
          { id: 6, name: 'location', label: 'Company Location', type: 'text', required: false, visible: true, order: 6 },
          { id: 7, name: 'website', label: 'Company Website', type: 'url', required: false, visible: true, order: 7 },
          { id: 8, name: 'description', label: 'Company Description', type: 'textarea', required: false, visible: true, order: 8 },
          { id: 9, name: 'hiring_volume', label: 'Expected Hiring Volume', type: 'select', required: false, visible: true, order: 9, options: ['1-5 per year', '6-15 per year', '16-30 per year', '30+ per year'] },
          { id: 10, name: 'budget_range', label: 'Budget Range for Hires', type: 'select', required: false, visible: true, order: 10, options: ['$50k-75k', '$75k-100k', '$100k-150k', '$150k-200k', '$200k+'] },
        ];
      }

      // Filter only visible fields and sort by order
      const visibleFields = defaultFields
        .filter(field => field.visible)
        .sort((a, b) => a.order - b.order);

      setFields(visibleFields);
      setLoading(false);
    } catch (error) {
      console.error('Error loading form configuration:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    fields.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name].toString().trim() === '')) {
        newErrors[field.name] = `${field.label} is required`;
      }
      
      // Email validation
      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Please enter a valid email address';
        }
      }
      
      // URL validation
      if (field.type === 'url' && formData[field.name]) {
        try {
          new URL(formData[field.name]);
        } catch {
          newErrors[field.name] = 'Please enter a valid URL';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      key: field.id,
      value: formData[field.name] || '',
      onChange: (value) => handleInputChange(field.name, value)
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              placeholder={`Enter your ${field.label.toLowerCase()}`}
              value={commonProps.value}
              onChange={(e) => commonProps.onChange(e.target.value)}
              className={errors[field.name] ? 'border-red-500' : ''}
            />
            {errors[field.name] && (
              <p className="text-sm text-red-500">{errors[field.name]}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              placeholder={`Enter your ${field.label.toLowerCase()}`}
              value={commonProps.value}
              onChange={(e) => commonProps.onChange(e.target.value)}
              className={errors[field.name] ? 'border-red-500' : ''}
              rows={3}
            />
            {errors[field.name] && (
              <p className="text-sm text-red-500">{errors[field.name]}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select 
              value={commonProps.value} 
              onValueChange={commonProps.onChange}
            >
              <SelectTrigger className={errors[field.name] ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[field.name] && (
              <p className="text-sm text-red-500">{errors[field.name]}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup 
              value={commonProps.value} 
              onValueChange={commonProps.onChange}
              className={errors[field.name] ? 'border border-red-500 rounded p-2' : ''}
            >
              {field.options?.map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.name}-${option}`} />
                  <Label htmlFor={`${field.name}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors[field.name] && (
              <p className="text-sm text-red-500">{errors[field.name]}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={!!commonProps.value}
                onCheckedChange={commonProps.onChange}
              />
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {errors[field.name] && (
              <p className="text-sm text-red-500">{errors[field.name]}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading form...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || `${formType} Registration`}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(field => (
              <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                {renderField(field)}
              </div>
            ))}
          </div>

          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix the errors above before submitting.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={submitting}
            className="w-full md:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
