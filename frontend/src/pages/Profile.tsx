import React, { useState } from 'react';
import {
  User,
  Mail,
  Globe,
  Edit3,
  Check,
  FileText,
  Award,
  Briefcase,
  Layers,
  Calendar,
  ArrowUpRight,
  ExternalLink,
  Code,
  Plus,
  Trash2,
  UserCheck,
  Eye,
  AwardIcon
} from 'lucide-react';

// --- TYPE DEFINITIONS ---
import { type Student,type SkillLevel,type Skill } from '../interfaces/student.type';




import {type TabOption, Tabs } from '../components/Tabs';


type tabkeys = 'posts' | 'projects' | 'achievements' | 'events';
// --- HELPER FUNCTION FOR VISUAL METER WIDTHS ---
const getLevelPercentage = (level: SkillLevel): string => {
  switch (level) {
    case 'Beginner': return '33%';
    case 'Intermediate': return '66%';
    case 'Advanced': return '100%';
    default: return '0%';
  }
};

const initialStudent: Student = {
  studentId: "STU-2024-8941",
  name: "Alex Rivera",
  email: "a.rivera@campusforge.edu",
  department: "Computer Science & Engineering",
  bio: "Full Stack Engineer specializing in reactive architecture and distributed systems. Lead contributor to the Campus UI Kit initiative.",
  socials: {
    github: "github.com/alexrivera",
    linkedin: "linkedin.com/in/alex-rivera",
    twitter: "twitter.com/rivera_dev",
    website: "alexrivera.dev"
  },
  skills: [
    { name: "React / Next.js", level: "Advanced" },
    { name: "TypeScript", level: "Advanced" },
    { name: "Tailwind CSS", level: "Advanced" },
    { name: "Node.js & Go", level: "Intermediate" },
    { name: "GraphQL", level: "Beginner" }
  ],
  posts: [
    { id: 'p1', title: 'Optimizing Global State in Monorepos', excerpt: 'Architectural breakdown of context splitting, state machines, and micro-frontend communication strategies.', date: 'May 14, 2026', category: 'Engineering' },
    { id: 'p2', title: 'Why We Switched to Tailwind v4.0 Semantic Layers', excerpt: 'An analytical review of token compilation efficiencies and runtime theme shifting mechanics.', date: 'April 28, 2026', category: 'UI/UX' }
  ],
  achievements: [
    { id: 'a1', title: '1st Place Winner - Spring Hackathon', issuer: 'CampusForge AI Org', date: 'March 2026', description: 'Developed an AI-driven accessibility micro-agent parse system.' }
  ],
  projects: [
    { id: 'pr1', title: 'ForgeLint Engine', description: 'Automated abstract structural rule validator configured specifically for dynamic utility projects.', tech: ['Rust', 'TypeScript'], link: '#' }
  ],
  enrolledClubs: [
    { id: 'c1', name: "CampusForge AI & Dev Club", role: "Technical Project Director", logo: "⚙️" },
    { id: 'c2', name: "Open Source Guild", role: "Core Maintainer", logo: "🌐" }
  ],
  enrolledEvents: [
    { id: 'e1', title: "AI Agent Workshop: Building with Gemini API", clubName: "CampusForge AI & Dev Club", date: "May 25, 2026", location: "Lab 3B" }
  ]
};

// --- MAIN WORKBENCH VIEW ---
export const StudentView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'self' | 'other'>('self');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [profile, setProfile] = useState<Student>(initialStudent);
  const [activeTab, setActiveTab] = useState<tabkeys>('posts');

  const tabOptions: TabOption<tabkeys>[] = [
    { key: 'posts', label: 'Some Posts' },
    { key: 'projects', label: 'Active Projects' },
    { key: 'achievements', label: 'Achievements' },
    { key: 'events', label: 'Enrolled Events' }
  ];

  const [bioInput, setBioInput] = useState(profile.bio);
  const [socialsInput, setSocialsInput] = useState({ ...profile.socials });
  const [skillsInput, setSkillsInput] = useState<Skill[]>([...profile.skills]);

  // New Skill Entry States
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Intermediate');

  const handleSave = () => {
    setProfile(prev => ({
      ...prev,
      bio: bioInput,
      socials: socialsInput,
      skills: skillsInput
    }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setBioInput(profile.bio);
    setSocialsInput({ ...profile.socials });
    setSkillsInput([...profile.skills]);
    setIsEditing(false);
  };

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    const cleanSkill: Skill = {
      name: newSkillName.trim(),
      level: newSkillLevel
    };
    setSkillsInput([...skillsInput, cleanSkill]);
    setNewSkillName('');
    setNewSkillLevel('Intermediate');
  };

  const removeSkill = (indexToRemove: number) => {
    setSkillsInput(skillsInput.filter((_, idx) => idx !== indexToRemove));
  };

  const canEdit = viewMode === 'self';

  return (
    <div className="min-h-screen bg-primary text-mainText font-sans pb-16 transition-colors duration-200">

      {/* SIMULATION BAR */}
      <div className="bg-footer border-b border-customBorder px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-subText">
          <span>Simulation Viewport Hierarchy:</span>
          <strong className="text-mainText uppercase font-mono bg-primary px-2 py-0.5 border border-customBorder rounded">
            {viewMode} Mode
          </strong>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setViewMode('self'); handleCancel(); }}
            className={`px-3 py-1 rounded transition-all cursor-pointer font-medium flex items-center gap-1 ${viewMode === 'self' ? 'bg-accent text-primary' : 'bg-card border border-customBorder text-subText'}`}
          >
            <UserCheck className="w-3 h-3" /> View as Myself
          </button>
          <button
            onClick={() => { setViewMode('other'); handleCancel(); }}
            className={`px-3 py-1 rounded transition-all cursor-pointer font-medium flex items-center gap-1 ${viewMode === 'other' ? 'bg-accent text-primary' : 'bg-card border border-customBorder text-subText'}`}
          >
            <Eye className="w-3 h-3" /> View as Visitor
          </button>
        </div>
      </div>

      {/* HEADER BANNER COVER */}
      <div className="h-44 w-full bg-gradient-to-r from-accent/20 via-card to-accent/10 border-b border-customBorder relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent" />
      </div>

      {/* CORE WRAPPER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">

        {/* CORE IDENTITY HEADER PANEL */}
        <div className="bg-card border border-customBorder rounded-2xl p-6 shadow-xl mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="w-24 h-24 rounded-2xl bg-footer border-4 border-primary flex items-center justify-center text-4xl shadow-md font-bold text-accent">
                {profile.name.split(' ').map(n => n[0]).join('')}
              </div>

              <div className="mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">{profile.name}</h1>
                  <span className="text-xs font-mono px-2 py-0.5 bg-footer text-subText rounded-md border border-customBorder">
                    {profile.studentId}
                  </span>
                </div>
                <p className="text-accent font-medium text-sm mt-1">{profile.department}</p>
                <div className="flex items-center gap-2 text-xs text-subText mt-2">
                  <Mail className="w-3.5 h-3.5 text-subText/70" />
                  <span>{profile.email}</span>
                  <span className="text-subText/40">•</span>
                  <span className="text-subText/70 font-mono italic">School Record (Immutable)</span>
                </div>
              </div>
            </div>

            {/* CONDITIONAL ADMINISTRATION ACTION CONTROLS */}
            {canEdit && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-footer border border-customBorder text-mainText font-bold rounded-lg text-sm transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-5 py-2 bg-accent text-primary font-bold rounded-lg text-sm transition-all cursor-pointer shadow-lg shadow-accent/10"
                    >
                      <Check className="w-4 h-4" /> Save Setup
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setBioInput(profile.bio); setSocialsInput({ ...profile.socials }); setSkillsInput([...profile.skills]); setIsEditing(true); }}
                    className="flex items-center gap-2 px-5 py-2 bg-footer border border-customBorder hover:border-accent/40 text-mainText font-bold rounded-lg text-sm transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-accent" /> Edit Profile Configurations
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* DUAL COLUMN DATA MATRICES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ================= LEFT ASIDE MATRICES ================= */}
          <div className="lg:col-span-4 space-y-8">

            {/* PROFILE BIO AND SOCIAL MEDIA LAYERS */}
            <div className="bg-card border border-customBorder rounded-xl p-5 space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-subText mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-accent" /> User Bio
                </h3>
                {isEditing && canEdit ? (
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="w-full bg-footer text-mainText border border-customBorder rounded-lg p-3 text-sm focus:outline-none focus:border-accent"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-mainText/90 leading-relaxed">{profile.bio}</p>
                )}
              </div>

              <div className="border-t border-customBorder pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-subText mb-3">Portfolios</h3>
                <div className="space-y-2.5">
                  {(['github', 'linkedin', 'twitter', 'website'] as const).map((network) => {
                    const Icon = network === 'github' ? AwardIcon : network === 'linkedin' ? AwardIcon : network === 'twitter' ? AwardIcon : Globe;
                    return (
                      <div key={network} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-subText capitalize"><Icon className="w-4 h-4" /> {network}</span>
                        {isEditing && canEdit ? (
                          <input
                            type="text"
                            value={socialsInput[network]}
                            onChange={(e) => setSocialsInput({ ...socialsInput, [network]: e.target.value })}
                            className="bg-footer border border-customBorder rounded px-2 py-1 text-xs text-mainText font-mono w-48 text-right focus:border-accent focus:outline-none"
                          />
                        ) : (
                          <a href={`https://${profile.socials[network]}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-accent hover:underline flex items-center gap-1">
                            {profile.socials[network]} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DYNAMIC SKILLS MATRIX (WITH DESCRIPTIVE TIERS & MANAGEMENT) */}
            <div className="bg-card border border-customBorder rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-subText mb-4 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-accent" /> Skills & Proficiency
              </h3>

              {/* Active Skill List */}
              <div className="space-y-4 mb-4">
                {(isEditing && canEdit ? skillsInput : profile.skills).map((skill, index) => (
                  <div key={index} className="space-y-1.5 group relative">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-mainText">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-accent text-[11px] font-semibold tracking-wide bg-footer px-2 py-0.5 border border-customBorder rounded-md">
                          {skill.level}
                        </span>
                        {isEditing && canEdit && (
                          <button
                            onClick={() => removeSkill(index)}
                            className="text-subText hover:text-accent p-0.5 rounded transition-colors cursor-pointer"
                            title="Remove Skill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Progress Bar reflecting categorical bounds */}
                    <div className="w-full h-1.5 bg-footer border border-customBorder rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: getLevelPercentage(skill.level) }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Insertion Row */}
              {isEditing && canEdit && (
                <div className="border-t border-customBorder pt-4 space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-subText">Add New Skill Node</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="e.g. Go, Kubernetes, Figma"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="w-full bg-footer border border-customBorder rounded-lg px-3 py-1.5 text-xs text-mainText focus:outline-none focus:border-accent"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={newSkillLevel}
                        onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                        className="flex-1 bg-footer text-mainText text-xs border border-customBorder rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <button
                        onClick={addSkill}
                        className="bg-accent text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ENROLLED CLUBS ECOSYSTEM FRAME */}
            <div className="bg-card border border-customBorder rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-subText mb-4 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent" /> Enrolled Clubs ({profile.enrolledClubs.length})
              </h3>
              <div className="space-y-3">
                {profile.enrolledClubs.map((club) => (
                  <div key={club.id} className="flex items-center gap-3 p-2.5 bg-footer rounded-lg border border-customBorder">
                    <div className="w-8 h-8 rounded-md bg-card flex items-center justify-center text-md border border-customBorder">{club.logo}</div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-mainText truncate">{club.name}</h4>
                      <p className="text-[10px] text-subText truncate">{club.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ================= RIGHT MAIN DISPLAY PANEL ================= */}
          <div className="lg:col-span-8 space-y-6">

            <Tabs
              options={tabOptions}
              activeTab={activeTab}
              onChange={(key) => setActiveTab(key)}
            />

            {/* CONTENT ROUTER */}
            <div className="space-y-4">

              {activeTab === 'posts' && profile.posts.map((post) => (
                <div key={post.id} className="bg-card border border-customBorder hover:border-accent/30 rounded-xl p-5 transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-accent px-2 py-0.5 rounded">{post.category}</span>
                    <span className="text-xs text-subText">{post.date}</span>
                  </div>
                  <h4 className="text-base font-bold text-mainText mt-2 group-hover:text-accent transition-colors flex items-center gap-1 cursor-pointer">
                    {post.title} <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                  </h4>
                  <p className="text-xs text-subText/80 mt-1.5 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                </div>
              ))}

              {activeTab === 'projects' && profile.projects.map((project) => (
                <div key={project.id} className="bg-card border border-customBorder rounded-xl p-5 space-y-3 transition-all hover:border-accent/20">
                  <div>
                    <h4 className="text-base font-bold text-mainText flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-accent" /> {project.title}
                    </h4>
                    <p className="text-xs text-subText/90 mt-1 leading-relaxed">{project.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-customBorder">
                    <div className="flex flex-wrap gap-1.5">
                      {project.tech.map((t, idx) => (
                        <span key={idx} className="text-[10px] bg-footer text-subText px-2 py-0.5 rounded border border-customBorder font-mono">{t}</span>
                      ))}
                    </div>
                    <a href={project.link} className="text-xs text-accent font-medium hover:underline inline-flex items-center gap-1">
                      Repository <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}

              {activeTab === 'achievements' && profile.achievements.map((achievement) => (
                <div key={achievement.id} className="bg-card border border-customBorder rounded-xl p-5 flex gap-4 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-footer border border-customBorder flex items-center justify-center text-accent flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-x-4 gap-y-1">
                      <h4 className="text-base font-bold text-mainText">{achievement.title}</h4>
                      <span className="text-xs text-subText font-medium font-mono">{achievement.date}</span>
                    </div>
                    <p className="text-xs text-accent font-medium">{achievement.issuer}</p>
                    <p className="text-xs text-subText/80 leading-relaxed pt-1">{achievement.description}</p>
                  </div>
                </div>
              ))}

              {activeTab === 'events' && profile.enrolledEvents.map((event) => (
                <div key={event.id} className="bg-card border border-customBorder rounded-xl p-5 flex items-start justify-between gap-4 transition-colors">
                  <div className="space-y-1.5">
                    <h4 className="text-base font-bold text-mainText">{event.title}</h4>
                    <p className="text-xs text-accent font-medium">{event.clubName}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subText pt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-subText/60" /> {event.date}</span>
                      <span>•</span>
                      <span>Location: <strong className="text-mainText/80">{event.location}</strong></span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-accent/10 border border-accent/20 text-accent font-bold px-2.5 py-1 rounded-md uppercase font-mono tracking-wider">Confirmed</span>
                </div>
              ))}

            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default StudentView;