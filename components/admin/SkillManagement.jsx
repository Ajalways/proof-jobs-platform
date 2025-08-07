import React, { useState, useEffect } from 'react';
import { SkillTag } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

export default function SkillManagement() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSkillName, setNewSkillName] = useState('');

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    const skillList = await SkillTag.list();
    setSkills(skillList);
    setLoading(false);
  };

  const handleAddSkill = async () => {
    if (!newSkillName) return;
    await SkillTag.create({ name: newSkillName, category: 'technical' }); // Default category
    setNewSkillName('');
    fetchSkills();
  };

  const handleDeleteSkill = async (id) => {
    await SkillTag.delete(id);
    fetchSkills();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill Tags Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="New skill name..."
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
          />
          <Button onClick={handleAddSkill}><Plus className="w-4 h-4 mr-2" /> Add Skill</Button>
        </div>
        <ul className="space-y-2">
          {skills.map(skill => (
            <li key={skill.id} className="flex justify-between items-center p-2 border rounded-md">
              <span>{skill.name} ({skill.category})</span>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteSkill(skill.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}