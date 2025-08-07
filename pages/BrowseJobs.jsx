import React, { useState, useEffect } from 'react';
import { JobPost } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, DollarSign, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const activeJobs = await JobPost.filter({ status: 'active' });
        setJobs(activeJobs);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Browse Open Positions</h1>
          <p className="text-slate-600 mt-1">Find your next career opportunity.</p>
        </header>
        
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search by job title or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-6"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><div className="h-6 bg-slate-200 rounded w-3/4"></div></CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-800">No Jobs Found</h3>
              <p className="text-slate-500 mt-2">There are currently no open positions matching your search. Please check back later.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-slate-800">{job.title}</CardTitle>
                      <p className="text-sm text-slate-500 font-medium">{job.company_name || 'A ProofAndFit Company'}</p>
                    </div>
                    <Button>Apply Now</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline" className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {job.location || job.work_location}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1"><DollarSign className="w-3 h-3"/> ${job.salary_range_min.toLocaleString()} - ${job.salary_range_max.toLocaleString()}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1"><Briefcase className="w-3 h-3"/> {job.job_type.replace('_', ' ')}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}