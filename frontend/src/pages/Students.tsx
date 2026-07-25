import React, { useState, useMemo, useEffect } from 'react';
import { Search, Loader2, WifiOff, Users, Sparkles, Filter } from 'lucide-react';
import { getUsersApi, type BackendUser, type SkillLevel } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../components/ui/UserAvatar';

type SortOption = 'alphabetical' | 'id-asc';

export const Students: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<BackendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const users = await getUsersApi();
        setProfiles(users);
      } catch (e: any) {
        setError(e.message || 'Failed to load students');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const allDepartments = useMemo(() => {
    const deptSet = new Set<string>();
    profiles.forEach((p) => { if (p.department) deptSet.add(p.department); });
    return ['All', ...Array.from(deptSet)];
  }, [profiles]);

  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    profiles.forEach((p) => {
      (p.skills || []).forEach((s) => skillSet.add(s.name));
    });
    return ['All', ...Array.from(skillSet)];
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    let out = [...profiles];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      out = out.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.skills || []).some((s) => s.name.toLowerCase().includes(q))
      );
    }
    if (selectedDepartment !== 'All') {
      out = out.filter((p) => p.department === selectedDepartment);
    }
    if (selectedSkillFilter !== 'All') {
      out = out.filter((p) =>
        (p.skills || []).some((s) => s.name === selectedSkillFilter)
      );
    }
    out.sort((a, b) =>
      sortBy === 'alphabetical'
        ? a.name.localeCompare(b.name)
        : a.student_id.localeCompare(b.student_id)
    );
    return out;
  }, [profiles, searchQuery, selectedDepartment, selectedSkillFilter, sortBy]);

  const getSkillBadgeClass = (level: SkillLevel) => {
    switch (level) {
      case 'Advanced':
        return 'skill-badge-advanced';
      case 'Intermediate':
        return 'skill-badge-intermediate';
      case 'Beginner':
      default:
        return 'skill-badge-beginner';
    }
  };

  return (
    <div className="min-h-screen bg-primary text-mainText px-4 py-8 md:px-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="border-b border-customBorder pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3 glow-text">
              <Users className="w-8 h-8 text-accent" /> Student & Skill Directory
            </h1>
            <p className="text-subText text-xs font-mono">
              Explore peer skill matrix, filter by proficiency level, and connect with technical collaborators.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-accent/10 border border-accent/30 text-accent rounded-full self-start md:self-auto">
            {profiles.length} Total Registered Members
          </span>
        </header>

        {/* Futuristic Search & Filters Panel */}
        <section className="glass-panel rounded-2xl p-5 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-accent/70">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by student name, email, or skill (e.g. Python, React)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-primary/70 border border-customBorder text-mainText rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-subText/50 shadow-inner"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-primary/70 border border-customBorder text-mainText rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              <option value="alphabetical">Sort: Alphabetical (A → Z)</option>
              <option value="id-asc">Sort: Registration ID</option>
            </select>
          </div>

          {/* Department filter */}
          <div className="border-t border-customBorder/40 pt-3">
            <span className="block text-subText text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-accent" /> Filter by Department
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allDepartments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-3 py-1 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                    selectedDepartment === dept
                      ? 'bg-accent/15 border-accent text-accent shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                      : 'bg-primary/40 border-customBorder text-subText hover:text-mainText hover:border-accent/40'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Filter Bar */}
          {allSkills.length > 1 && (
            <div className="border-t border-customBorder/40 pt-3">
              <span className="block text-subText text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-accent" /> Filter by Specific Skill
              </span>
              <div className="flex flex-wrap gap-1.5">
                {allSkills.map((sk) => (
                  <button
                    key={sk}
                    onClick={() => setSelectedSkillFilter(sk)}
                    className={`px-3 py-1 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                      selectedSkillFilter === sk
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                        : 'bg-primary/40 border-customBorder text-subText hover:text-mainText hover:border-cyan-500/40'
                    }`}
                  >
                    {sk}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Result Count */}
        <div className="flex justify-between items-center px-1 mb-5">
          <h2 className="text-xs font-bold text-subText uppercase tracking-widest font-mono">
            Showing {filteredProfiles.length} Student{filteredProfiles.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="glass-panel flex flex-col items-center justify-center py-20 rounded-2xl gap-3">
            <Loader2 size={32} className="text-accent animate-spin" />
            <p className="text-subText text-xs font-mono">Querying student registry & skills matrix...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-950/30 border border-red-500/40 rounded-xl text-xs mb-6">
            <WifiOff size={16} className="text-red-400 shrink-0" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {!isLoading && !error && filteredProfiles.length === 0 && (
          <div className="glass-panel text-center py-16 rounded-2xl">
            <p className="text-subText text-xs font-mono">No students match your query criteria.</p>
          </div>
        )}

        {/* Student Cards Grid */}
        {!isLoading && !error && filteredProfiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.student_id}
                onClick={() => navigate(`/profile/${profile.student_id}`)}
                className="glass-panel rounded-2xl p-5 flex flex-col justify-between hover:border-accent/50 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    <UserAvatar name={profile.name} src={profile.profile_pic} className="h-12 w-12 rounded-2xl border border-customBorder font-black text-base group-hover:scale-105 transition-transform" textClassName="text-base" />
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-mainText tracking-tight group-hover:text-accent transition-colors truncate">
                        {profile.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-mono text-subText/80 truncate">
                          {profile.department}
                        </span>
                        {profile.student_id && (
                          <span className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded-md border border-accent/30 shrink-0">
                            {profile.student_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {profile.bio ? (
                    <p className="text-xs text-subText line-clamp-2 mb-4 leading-relaxed min-h-[2.5rem]">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-xs text-subText/40 italic mb-4 min-h-[2.5rem]">No bio provided.</p>
                  )}

                  {/* Skills Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(!profile.skills || profile.skills.length === 0) ? (
                      <span className="text-[10px] text-subText/40 italic font-mono">No skills listed</span>
                    ) : (
                      profile.skills.slice(0, 3).map((sk) => (
                        <span key={sk.name} className={`skill-badge text-[10px] py-0.5 px-2 ${getSkillBadgeClass(sk.level)}`}>
                          {sk.name} <span className="opacity-70 font-mono">({sk.level[0]})</span>
                        </span>
                      ))
                    )}
                    {profile.skills && profile.skills.length > 3 && (
                      <span className="text-[10px] font-mono text-subText px-1.5 py-0.5 rounded bg-footer border border-customBorder">
                        +{profile.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-customBorder/50 pt-3 flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 bg-footer border border-customBorder text-subText rounded-full">
                    {profile.department}
                  </span>
                  <span className="text-[10px] text-accent font-bold group-hover:translate-x-1 transition-transform">
                    View Profile →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Students;
