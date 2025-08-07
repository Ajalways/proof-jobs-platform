import React, { useState, useEffect } from 'react';
import { User, JobseekerBio, DemoJobseeker } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, MapPin, Star, Briefcase } from 'lucide-react';

export default function FindTalent() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCandidates = async () => {
      try {
        const currentUser = await User.me();
        if (!isMounted) return;
        setUser(currentUser);

        // Load demo candidates for trial users, real candidates for paid users
        if (currentUser.subscription_tier === 'trial' || !currentUser.subscription_tier) {
          const demoCandidates = await DemoJobseeker.list();
          if (isMounted) {
            setCandidates(demoCandidates.slice(0, 10)); // Limit demo results
          }
        } else {
          // For paid users, load real verified candidates
          const realCandidates = await JobseekerBio.list();
          if (isMounted) {
            setCandidates(realCandidates.filter(candidate => 
              candidate.user_id && candidate.bio_text
            ));
          }
        }
      } catch (error) {
        console.error('Error loading candidates:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCandidates();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCandidates = candidates.filter(candidate =>
    searchTerm === '' || 
    candidate.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.bio_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.skills?.some(skill => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8" />
            Find Talent
          </h1>
          <p className="text-slate-600 mt-1">
            {user?.subscription_tier === 'trial' ? 
              'Browse our demo profiles. Upgrade to access verified candidates.' :
              'Browse verified forensic accounting professionals.'
            }
          </p>
        </header>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search by name, skills, or experience..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCandidates.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800">No Candidates Found</h3>
                  <p className="text-slate-500 mt-2">
                    {searchTerm ? 'Try adjusting your search terms.' : 'No candidates available at this time.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredCandidates.map((candidate, index) => (
              <Card key={candidate.id || index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{candidate.full_name || candidate.name || 'Professional'}</CardTitle>
                      <p className="text-sm text-slate-600">{candidate.specialization || 'Forensic Accounting'}</p>
                    </div>
                    {user?.subscription_tier === 'trial' && (
                      <Badge variant="secondary">Demo</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                    {candidate.bio_text || candidate.description || 'Experienced forensic accounting professional with proven track record.'}
                  </p>
                  
                  {/* Skills */}
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 3).map((skill, skillIndex) => (
                          <Badge key={skillIndex} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {candidate.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{candidate.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Experience Level */}
                  {candidate.experience_level && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
                      <Briefcase className="w-4 h-4" />
                      <span className="capitalize">{candidate.experience_level.replace('_', ' ')}</span>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    disabled={user?.subscription_tier === 'trial'}
                  >
                    {user?.subscription_tier === 'trial' ? 'Upgrade to Contact' : 'View Profile'}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Upgrade prompt for trial users */}
        {user?.subscription_tier === 'trial' && (
          <Card className="mt-8 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 mx-auto text-emerald-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Ready to Access Real Candidates?</h3>
              <p className="text-slate-600 mb-4">
                Upgrade your account to browse verified forensic accounting professionals and contact them directly.
              </p>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}