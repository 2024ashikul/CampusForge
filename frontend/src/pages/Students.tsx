import React, { useState, useMemo } from 'react';

// --- Architectural Domain Interfaces ---
import { type Student,type SkillLevel,type Skill } from '../interfaces/student.type';

// --- Comprehensive Mock Roster Mapped to Student Specs ---
const DUMMY_PROFILES: Student[] = [
  {
    studentId: 'STU-2026-9912',
    name: 'Sarah Chen',
    email: 's.chen@campus.edu',
    department: 'Computer Science & Engineering',
    bio: 'Specializing in concurrent network models and high-throughput execution engines. Actively looking for distributed systems research partners.',
    socials: {
      github: 'https://github.com/schen-dev',
      linkedin: 'https://linkedin.com/in/sarahchen',
      twitter: 'https://twitter.com/schen_codes',
      website: 'https://sarahchen.dev'
    },
    skills: [
      { name: 'Rust', level: 'Advanced' },
      { name: 'Go', level: 'Advanced' },
      { name: 'Docker', level: 'Intermediate' },
      { name: 'Kubernetes', level: 'Beginner' }
    ],
    posts: [{ id: 'p-1', title: 'Optimizing Mutex Allocation in Go', excerpt: 'Deep dive into concurrent scheduling channels...', date: '2026-04-12', category: 'Backend' }],
    achievements: [{ id: 'ac-1', title: 'Dean\'s List for Academic Excellence', issuer: 'School of Engineering', date: '2025', description: 'Maintained a flawless terminal score.' }],
    projects: [{ id: 'proj-1', title: 'Distributed Memory Engine', description: 'An in-memory P2P log cache.', tech: ['Rust', 'gRPC'], link: '#' }],
    enrolledClubs: [{ id: 'c-1', name: 'Open Source Hardware Lab', role: 'Lead Infrastructure Engineer', logo: '⚙️' }],
    enrolledEvents: [{ id: 'e-1', title: 'Global Hackathon 2026', clubName: 'AI Guild', date: '2026-06-01', location: 'Hall C' }]
  },
  {
    studentId: 'STU-2026-0841',
    name: 'Marcus Vance',
    email: 'm.vance@campus.edu',
    department: 'Robotics Engineering',
    bio: 'Embedded software engineer focused on deterministic scheduling and flight-controller array optimization. Let\'s wire custom nodes.',
    socials: {
      github: 'https://github.com/mvance-embedded',
      linkedin: 'https://linkedin.com/in/marcusvance',
      twitter: '',
      website: ''
    },
    skills: [
      { name: 'C++', level: 'Advanced' },
      { name: 'RTOS', level: 'Advanced' },
      { name: 'Python', level: 'Intermediate' },
      { name: 'Rust', level: 'Beginner' }
    ],
    posts: [],
    achievements: [],
    projects: [{ id: 'proj-2', title: 'Solar Powered Autonomous Drone', description: 'Firmware array execution loop.', tech: ['C++', 'FreeRTOS'], link: '#' }],
    enrolledClubs: [{ id: 'c-2', name: 'Robotics & Automation Society', role: 'Core Hardware Track', logo: '🤖' }],
    enrolledEvents: []
  },
  {
    studentId: 'STU-2026-7734',
    name: 'Elena Rostova',
    email: 'e.rostova@campus.edu',
    department: 'Data Science & Analytics',
    bio: 'Building statistical matrix operations and high-scale neural execution pipelines. Interested in deep learning at the edge.',
    socials: {
      github: 'https://github.com/elena-r',
      linkedin: '',
      twitter: '',
      website: 'https://rostova.io'
    },
    skills: [
      { name: 'Python', level: 'Advanced' },
      { name: 'PyTorch', level: 'Advanced' },
      { name: 'Docker', level: 'Intermediate' },
      { name: 'Go', level: 'Beginner' }
    ],
    posts: [],
    achievements: [],
    projects: [],
    enrolledClubs: [],
    enrolledEvents: []
  }
];

type SortOption = 'alphabetical' | 'id-asc' | 'id-desc';

export const Students: React.FC = () => {
  // --- Core State Machine Pipelines ---
  const [profiles] = useState<Student[]>(DUMMY_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<Student | null>(null);

  // --- Workspace Query Filter Parameters ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedSkillTag, setSelectedSkillTag] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');

  // --- Dynamic Meta Taxonomy Extraction Engines ---
  const allDepartments = useMemo(() => {
    const departmentSet = new Set<string>();
    profiles.forEach((p) => {
      if (p.department) departmentSet.add(p.department);
    });
    return ['All', ...Array.from(departmentSet)];
  }, [profiles]);

  const allUniqueSkills = useMemo(() => {
    const skillSet = new Set<string>();
    profiles.forEach((p) => {
      p.skills.forEach((s) => skillSet.add(s.name));
    });
    return ['All', ...Array.from(skillSet)];
  }, [profiles]);

  // --- Filter Skill Badges by Dynamic Character Entry Matcher ---
  const filteredSkillTags = useMemo(() => {
    if (!skillSearchQuery.trim()) return allUniqueSkills;
    const target = skillSearchQuery.toLowerCase();
    return ['All', ...allUniqueSkills.filter(skill => 
      skill !== 'All' && skill.toLowerCase().includes(target)
    )];
  }, [allUniqueSkills, skillSearchQuery]);

  // --- Data Transformation & Verification Pipeline (Filter & Sort) ---
  const filteredAndSortedProfiles = useMemo(() => {
    let output = [...profiles];

    // 1. Text Query Matrix Matching (Applies across Student Name and Student ID)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      output = output.filter(
        (p) => p.name.toLowerCase().includes(q) || p.studentId.toLowerCase().includes(q)
      );
    }

    // 2. Structural Department Separation
    if (selectedDepartment !== 'All') {
      output = output.filter((p) => p.department === selectedDepartment);
    }

    // 3. Skill Badge Array Intersection Filter
    if (selectedSkillTag !== 'All') {
      output = output.filter((p) => 
        p.skills.some((s) => s.name === selectedSkillTag)
      );
    }

    // 4. Chronological & String Collator Sorting Logic
    output.sort((a, b) => {
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      if (sortBy === 'id-asc') return a.studentId.localeCompare(b.studentId);
      if (sortBy === 'id-desc') return b.studentId.localeCompare(a.studentId);
      return 0;
    });

    return output;
  }, [profiles, searchQuery, selectedDepartment, selectedSkillTag, sortBy]);

  // --- Skill Level Component Style Resolver Utility ---
  const getLevelStyles = (level: SkillLevel) => {
    switch (level) {
      case 'Advanced':
        return 'bg-accent/10 border-accent text-accent';
      case 'Intermediate':
        return 'bg-card border-customBorder text-mainText';
      case 'Beginner':
      default:
        return 'bg-footer border-customBorder text-subText';
    }
  };

  return (
    <div className="min-h-screen bg-primary text-mainText px-4 py-8 md:px-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        
        {/* --- Header Section Block --- */}
        <header className="border-b border-customBorder pb-6 mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-1">Student Registry Matrix</h1>
          <p className="text-subText text-sm">Query foundational index frameworks to locate developers, skillsets, and code system collaborators.</p>
        </header>

        {/* --- Unified Search, Department and Skill Array Control Deck --- */}
        <section className="bg-footer border border-customBorder rounded-xl p-5 mb-8 space-y-4">
          
          {/* Base Row: Search Parameter Controls */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search index via student name details or institutional hash ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-primary border border-customBorder text-mainText rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-subText/50 font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-primary border border-customBorder text-mainText rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer h-full"
              >
                <option value="alphabetical">Sort Node: Alphabetical (A-Z)</option>
                <option value="id-asc">Index Ordering: ID Ascending</option>
                <option value="id-desc">Index Ordering: ID Descent</option>
              </select>
            </div>
          </div>

          {/* Department Taxonomy Divider Strip */}
          <div className="border-t border-customBorder/50 pt-3">
            <span className="block text-subText text-[11px] font-bold uppercase tracking-wider mb-2">
              Filter by Academic Branch Separation
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allDepartments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                    selectedDepartment === dept
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'bg-card border-customBorder text-subText hover:text-mainText'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Core Skill Set Discovery System */}
          <div className="border-t border-customBorder/50 pt-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="block text-subText text-[11px] font-bold uppercase tracking-wider">
                Filter by Engineering Skill Matrix
              </span>
              <input
                type="text"
                placeholder="Narrow down stack keys (e.g. Rust, Go)..."
                value={skillSearchQuery}
                onChange={(e) => setSkillSearchQuery(e.target.value)}
                className="bg-primary border border-customBorder text-mainText rounded-md px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-subText/40 w-full sm:w-56 font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {filteredSkillTags.map((skill) => (
                <button
                  key={skill}
                  onClick={() => setSelectedSkillTag(skill)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-all cursor-pointer ${
                    selectedSkillTag === skill
                      ? 'bg-accent border-accent text-primary font-bold'
                      : 'bg-card border-customBorder text-subText hover:text-mainText'
                  }`}
                >
                  {skill === 'All' ? skill : `#${skill}`}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* --- Main Centered Content Grid Framework Pipeline --- */}
        <main className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-bold text-subText uppercase tracking-[0.2em]">
              Rendered Registry Output ({filteredAndSortedProfiles.length})
            </h2>
          </div>

          {filteredAndSortedProfiles.length === 0 ? (
            <div className="text-center py-16 bg-card border border-customBorder rounded-xl">
              <p className="text-subText text-sm font-mono">No student data configurations match your query vectors.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAndSortedProfiles.map((profile) => (
                <div 
                  key={profile.studentId}
                  onClick={() => setSelectedProfile(profile)}
                  className="bg-card border border-customBorder rounded-xl p-5 flex flex-col justify-between hover:border-accent/40 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div>
                    {/* Header Block Inside Individual Student Nodes */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-base font-bold text-mainText tracking-tight group-hover:text-accent transition-colors">
                          {profile.name}
                        </h3>
                        <span className="text-xs font-mono text-accent block mt-0.5">
                          {profile.studentId}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-footer border border-customBorder text-subText rounded h-fit whitespace-nowrap">
                        {profile.department.split(' & ')[0]}
                      </span>
                    </div>

                    {/* Standard Abstract Summary Block */}
                    <p className="text-xs text-subText line-clamp-3 mb-5 leading-relaxed min-h-[3.75rem]">
                      {profile.bio}
                    </p>
                  </div>

                  {/* Skills Display block inside the card footprint */}
                  <div className="border-t border-customBorder/60 pt-4">
                    <div className="space-y-1.5">
                      <span className="block text-[10px] text-subText/70 font-bold uppercase tracking-wider">Skillset Parameters</span>
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.map((skill) => (
                          <div
                            key={skill.name}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${getLevelStyles(skill.level)}`}
                          >
                            <span>{skill.name}</span>
                            <span className="opacity-40 text-[8px] uppercase font-sans">({skill.level[0]})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* --- Profile Full Detail Modal Layer Viewport Workbench --- */}
        {selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop Layer Blur Overlay */}
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedProfile(null)}
            />
            
            {/* Active Modal Form Payload System Workspace */}
            <div className="relative w-full max-w-2xl bg-card border border-customBorder rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col transform transition-all">
              
              {/* Modal Custom Control Header */}
              <div className="px-6 py-4 bg-footer border-b border-customBorder flex justify-between items-center">
                <div>
                  <h3 className="text-md font-bold text-mainText">System Profile Payload</h3>
                  <p className="text-xs text-subText font-mono">Index Reference: {selectedProfile.studentId}</p>
                </div>
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="p-1.5 rounded-lg text-subText hover:text-mainText hover:bg-primary border border-transparent hover:border-customBorder transition-all cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Scrolling Detailed Space Content Area */}
              <div className="p-6 overflow-y-auto bg-primary/20 space-y-6">
                
                {/* Meta Matrix Layer Row */}
                <div>
                  <h2 className="text-xl font-black tracking-tight text-mainText">{selectedProfile.name}</h2>
                  <p className="text-xs text-accent font-semibold mt-0.5">{selectedProfile.department} • {selectedProfile.email}</p>
                  <p className="text-xs text-subText mt-3 bg-footer p-3 rounded-xl border border-customBorder leading-relaxed">
                    {selectedProfile.bio}
                  </p>
                </div>

                {/* Explicit Skill Mapping Framework Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-subText uppercase tracking-wider">Complete Skill Competency Matrix</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedProfile.skills.map((skill) => (
                      <div 
                        key={skill.name} 
                        className={`p-2 rounded-lg border flex flex-col justify-between ${getLevelStyles(skill.level)}`}
                      >
                        <span className="text-xs font-mono font-bold">{skill.name}</span>
                        <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70 mt-1">{skill.level} Tier</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relational Arrays Viewport Grid (Projects, Clubs) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-customBorder/40 pt-4">
                  
                  {/* Active Infrastructure Systems */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-subText uppercase tracking-wider">Active Deployments ({selectedProfile.projects.length})</h4>
                    {selectedProfile.projects.length === 0 ? (
                      <p className="text-[11px] text-subText italic font-mono">No active project vectors compiled.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedProfile.projects.map(proj => (
                          <div key={proj.id} className="p-2.5 bg-footer border border-customBorder rounded-lg text-xs">
                            <span className="font-bold text-mainText block">{proj.title}</span>
                            <span className="text-subText text-[11px] line-clamp-1 mt-0.5">{proj.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Registered Campus Associations */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-subText uppercase tracking-wider">Club Networks ({selectedProfile.enrolledClubs.length})</h4>
                    {selectedProfile.enrolledClubs.length === 0 ? (
                      <p className="text-[11px] text-subText italic font-mono">No verified club alignments found.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedProfile.enrolledClubs.map(club => (
                          <div key={club.id} className="p-2.5 bg-footer border border-customBorder rounded-lg text-xs flex items-center gap-2">
                            <span className="text-sm">{club.logo}</span>
                            <div>
                              <span className="font-bold text-mainText block leading-none">{club.name}</span>
                              <span className="text-subText text-[10px] tracking-tight">{club.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* External Social Navigation Cluster */}
                <div className="border-t border-customBorder/40 pt-4 flex flex-wrap gap-2">
                  {Object.entries(selectedProfile.socials).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <a
                        key={key}
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-footer border border-customBorder text-subText hover:text-accent hover:border-accent font-mono text-xs capitalize rounded-md transition-colors"
                      >
                        {key} ↗
                      </a>
                    );
                  })}
                </div>

              </div>

              {/* --- Modal Action Control Footer with explicit Profile link target --- */}
              <div className="bg-footer border-t border-customBorder px-6 py-4 flex justify-between items-center">
                <span className="text-[11px] text-subText font-mono">
                  Node Hash: {selectedProfile.studentId}
                </span>
                {/* Router-ready design link utilizing your abstract semantic styling rules */}
                <a
                  href={`/profile/${selectedProfile.studentId}`}
                  className="px-4 py-2 bg-accent text-primary text-xs font-black rounded-lg hover:opacity-90 active:scale-[0.98] transition-all tracking-wide flex items-center gap-1.5"
                >
                  <span>👤</span> View Full Profile System
                </a>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Students;