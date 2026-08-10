import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Edit3,
  Check,
  Briefcase,
  Layers,
  ArrowUpRight,
  Plus,
  Loader2,
  WifiOff,
  Sparkles,
  Zap,
  Trash2,
  FolderGit2,
  Calendar,
  Building2,
  Link2,
  Globe2
} from 'lucide-react';

import {
  getUserByIdApi,
  getPostsApi,
  getUserClubsApi,
  getUserEventsApi,
  updateUserApi,
  uploadFileApi,
  getSkillsApi,
  mapBackendPostToPostData,
  type BackendUser,
  type BackendPost,
  type BackendClub,
  type BackendEvent,
  type Skill,
  type SkillLevel
} from '../services/api';
import type { Socials } from '../interfaces/student.type';
import { useAuth } from '../context/AuthContext';
import { type TabOption, Tabs } from '../components/Tabs';
import { PostCard } from '../components/Posts/PostCard';

type TabKey = 'posts' | 'projects' | 'clubs' | 'events';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export const UserProfileView: React.FC = () => {
  const { profileid } = useParams<{ profileid: string }>();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<BackendUser | null>(null);
  const [posts, setPosts] = useState<BackendPost[]>([]);
  const [projects, setProjects] = useState<BackendPost[]>([]);
  const [clubs, setClubs] = useState<BackendClub[]>([]);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const [isEditing, setIsEditing] = useState(false);

  
  const [bioInput, setBioInput] = useState('');
  const [socialsInput, setSocialsInput] = useState({ github: '', linkedin: '', twitter: '', website: '' });
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Intermediate');
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [socialsState, setSocialsState] = useState<Socials>({});
  const [isSaving, setIsSaving] = useState(false);

  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const profilePicRef = useRef<HTMLInputElement>(null);

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setIsUploadingPic(true);
    try {
      const res = await uploadFileApi(file);
      const updated = await updateUserApi(profile.student_id, { profile_pic: res.url });
      if (updated) setProfile(updated);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploadingPic(false);
      if (profilePicRef.current) profilePicRef.current.value = '';
    }
  };

  const userId = profileid || authUser?.student_id;
  const isOwnProfile = !profileid || authUser?.student_id === profileid || (profile && authUser?.student_id === profile.student_id);

  useEffect(() => {
    if (!userId) return;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [userData, userPosts, userClubsData, userEventsData] = await Promise.all([
          getUserByIdApi(userId!),
          getPostsApi({ user_id: userId }).catch(() => []),
          getUserClubsApi(userId!).catch(() => []),
          getUserEventsApi(userId!).catch(() => []),
        ]);
        if (!userData) throw new Error('User not found');
        setProfile(userData);
        setBioInput(userData.bio || '');
        setSocialsInput({
          github: userData.socials?.github || '', linkedin: userData.socials?.linkedin || '',
          twitter: userData.socials?.twitter || '', website: userData.socials?.website || '',
        });
        setSkillsList(userData.skills || []);
        setSocialsState(userData.socials || {});

        
        const projList = userPosts.filter((p) => p.post_type === 'project');
        const generalPosts = userPosts.filter((p) => p.post_type !== 'project');

        setPosts(generalPosts.length > 0 ? generalPosts : userPosts);
        setProjects(projList);
        setClubs(userClubsData);
        setEvents(userEventsData);
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [userId]);

  useEffect(() => {
    getSkillsApi().then((skills) => setSkillSuggestions(skills.map((skill) => skill.skill)));
  }, []);

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const exists = skillsList.some(
      (s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase()
    );
    if (exists) return;
    setSkillsList([...skillsList, { name: newSkillName.trim(), level: newSkillLevel }]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkillsList(skillsList.filter((s) => s.name !== skillName));
  };

  const handleSave = async () => {
    if (!profile || !isOwnProfile) return;
    setIsSaving(true);
    const updated = await updateUserApi(profile.student_id, {
      bio: bioInput,
      skills: skillsList,
      socials: Object.fromEntries(Object.entries(socialsInput).filter(([, value]) => value.trim())),
    });
    if (updated) {
      setProfile(updated);
      setBioInput(updated.bio || '');
      setSkillsList(updated.skills || []);
      setSocialsState(updated.socials || {});
    }
    setIsSaving(false);
    setIsEditing(false);
  };

  const tabOptions: TabOption<TabKey>[] = [
    { key: 'posts', label: `Posts (${posts.length})` },
    { key: 'projects', label: `🚀 Projects (${projects.length})` },
    { key: 'clubs', label: `🏛️ Joined Clubs (${clubs.length})` },
    { key: 'events', label: `🗓️ Registered Events (${events.length})` },
  ];

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

  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-subText text-xs font-mono">Loading student profile matrix...</p>
        </div>
      </div>
    );
  }

  
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="flex items-center justify-center gap-3 px-4 py-3 bg-red-900/20 border border-red-500/40 rounded-xl text-sm">
            <WifiOff size={16} className="text-red-400 shrink-0" />
            <span className="text-red-300">{error || 'Profile not found'}</span>
          </div>
          <Link to="/students" className="text-accent text-sm hover:underline">← Back to Students</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-mainText font-sans pb-16">

      {}
      <div className="h-32 w-full bg-footer border-b border-customBorder" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">

        {}
        <div className="bg-card border border-customBorder rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {}
              <div className="relative">
                {profile.profile_pic ? (
                  <img
                    src={profile.profile_pic}
                    alt={profile.name}
                    className="w-28 h-28 rounded-2xl border-4 border-primary object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-accent to-cyan-500 border-4 border-primary flex items-center justify-center text-4xl font-black text-white shadow-lg">
                    {getInitials(profile.name)}
                  </div>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => profilePicRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent text-white rounded-lg flex items-center justify-center shadow-md hover:brightness-110 cursor-pointer border-2 border-primary"
                    title="Upload profile picture"
                  >
                    {isUploadingPic ? <Loader2 className="w-3 h-3 animate-spin" /> : '📷'}
                  </button>
                )}
                <input
                  ref={profilePicRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                  className="hidden"
                />
              </div>

              <div className="mb-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-black tracking-tight glow-text">{profile.name}</h1>
                  {isOwnProfile && (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 bg-accent/10 text-accent rounded-full border border-accent/40 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> You
                    </span>
                  )}
                </div>
                <p className="text-accent font-semibold text-sm mt-1 flex items-center gap-1.5 flex-wrap">
                  <Zap className="w-4 h-4" /> {profile.department}
                  {profile.student_id && (
                    <span className="text-xs font-mono text-subText bg-footer px-2 py-0.5 rounded-md border border-customBorder">
                      ID: {profile.student_id}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-3 text-xs text-subText mt-2 font-mono flex-wrap">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-accent/70" />
                    <span>{profile.email}</span>
                  </div>
                  {profile.socials && (
                    <div className="flex items-center gap-2 pl-2 border-l border-customBorder/60">
                      {profile.socials.github && (
                        <a href={profile.socials.github} target="_blank" rel="noreferrer" className="hover:text-accent text-[11px]">
                          GitHub ↗
                        </a>
                      )}
                      {profile.socials.linkedin && (
                        <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" className="hover:text-accent text-[11px]">
                          LinkedIn ↗
                        </a>
                      )}
                      {profile.socials.twitter && (
                        <a href={profile.socials.twitter} target="_blank" rel="noreferrer" className="hover:text-accent text-[11px]">
                          Twitter ↗
                        </a>
                      )}
                      {profile.socials.website && (
                        <a href={profile.socials.website} target="_blank" rel="noreferrer" className="hover:text-accent text-[11px]">
                          Website ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {}
            {isOwnProfile && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setBioInput(profile.bio || '');
                        setSkillsList(profile.skills || []);
                        setSocialsInput({ github: profile.socials?.github || '', linkedin: profile.socials?.linkedin || '', twitter: profile.socials?.twitter || '', website: profile.socials?.website || '' });
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 bg-footer border border-customBorder text-mainText font-bold rounded-xl text-xs transition-all cursor-pointer hover:bg-primary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-accent to-cyan-500 text-primary font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-accent/20 disabled:opacity-60 hover:brightness-110"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {isSaving ? 'Saving...' : 'Save Matrix'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setBioInput(profile.bio || '');
                      setSkillsList(profile.skills || []);
                      setSocialsInput({ github: profile.socials?.github || '', linkedin: profile.socials?.linkedin || '', twitter: profile.socials?.twitter || '', website: profile.socials?.website || '' });
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2 bg-footer border border-customBorder hover:border-accent/40 text-mainText font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <Edit3 className="w-4 h-4 text-accent" /> Edit Profile & Skills
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {}
          <div className="lg:col-span-4 space-y-6">

            {}
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-subText flex items-center gap-2">
                <User className="w-4 h-4 text-accent" /> Student Overview
              </h3>
              {isEditing ? (
                <>
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="w-full bg-footer text-mainText border border-customBorder rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
                    rows={4}
                    placeholder="Write a short bio about yourself..."
                  />
                  <div className="space-y-2 pt-2 border-t border-customBorder/50">
                    <span className="text-[11px] font-bold text-subText uppercase">Social Links</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="url"
                        placeholder="GitHub URL"
                        value={socialsState.github || ''}
                        onChange={(e) => setSocialsState({ ...socialsState, github: e.target.value })}
                        className="w-full bg-primary border border-customBorder text-mainText text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <input
                        type="url"
                        placeholder="LinkedIn URL"
                        value={socialsState.linkedin || ''}
                        onChange={(e) => setSocialsState({ ...socialsState, linkedin: e.target.value })}
                        className="w-full bg-primary border border-customBorder text-mainText text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <input
                        type="url"
                        placeholder="Twitter URL"
                        value={socialsState.twitter || ''}
                        onChange={(e) => setSocialsState({ ...socialsState, twitter: e.target.value })}
                        className="w-full bg-primary border border-customBorder text-mainText text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <input
                        type="url"
                        placeholder="Website URL"
                        value={socialsState.website || ''}
                        onChange={(e) => setSocialsState({ ...socialsState, website: e.target.value })}
                        className="w-full bg-primary border border-customBorder text-mainText text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-mainText/90 leading-relaxed">
                  {profile.bio || (
                    <span className="text-subText/50 italic">No bio specified yet.{isOwnProfile && ' Click Edit to add one.'}</span>
                  )}
                </p>
              )}
            </div>

            <div className="bg-card border border-customBorder rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-subText flex items-center gap-2"><Globe2 className="w-4 h-4 text-accent" /> Social links</h3>
              {isEditing ? (
                <div className="space-y-2">
                  {([
                    ['github', 'GitHub', Link2, 'https://github.com/your-name'],
                    ['linkedin', 'LinkedIn', Link2, 'https://linkedin.com/in/your-name'],
                    ['twitter', 'X / Twitter', Link2, 'https://x.com/your-name'],
                    ['website', 'Website', Globe2, 'https://your-site.com'],
                  ] as const).map(([key, label, Icon, placeholder]) => <label key={key} className="block"><span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-subText"><Icon className="w-3.5 h-3.5" /> {label}</span><input type="url" value={socialsInput[key]} onChange={(event) => setSocialsInput((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} className="w-full bg-primary border border-customBorder text-mainText text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent" /></label>)}
                </div>
              ) : profile.socials && Object.values(profile.socials).some(Boolean) ? (
                <div className="flex flex-wrap gap-2">{profile.socials.github && <a href={profile.socials.github} target="_blank" rel="noreferrer" className="btn-ghost text-xs"><Link2 className="w-3.5 h-3.5" /> GitHub</a>}{profile.socials.linkedin && <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" className="btn-ghost text-xs"><Link2 className="w-3.5 h-3.5" /> LinkedIn</a>}{profile.socials.twitter && <a href={profile.socials.twitter} target="_blank" rel="noreferrer" className="btn-ghost text-xs"><Link2 className="w-3.5 h-3.5" /> X</a>}{profile.socials.website && <a href={profile.socials.website} target="_blank" rel="noreferrer" className="btn-ghost text-xs"><Globe2 className="w-3.5 h-3.5" /> Website</a>}</div>
              ) : <p className="text-xs text-subText italic">{isOwnProfile ? 'Add your links with Edit Profile & Skills.' : 'No social links shared yet.'}</p>}
            </div>

            {}
            <div className="bg-card border border-customBorder rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-subText flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" /> Skills & proficiency
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-accent/10 text-accent rounded-full border border-accent/20">
                  {skillsList.length} Skills
                </span>
              </div>

              {}
              {isEditing && (
                <div className="space-y-2 pt-2 border-t border-customBorder/50">
                  <span className="text-[11px] font-bold text-subText uppercase">Add New Skill</span>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      list="skill-suggestions"
                      placeholder="Skill name (e.g. React, Python)"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="w-full bg-primary border border-customBorder text-mainText text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <datalist id="skill-suggestions">
                      {skillSuggestions.map((skill) => <option key={skill} value={skill} />)}
                    </datalist>
                    <div className="flex gap-2">
                      <select
                        value={newSkillLevel}
                        onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                        className="flex-1 bg-primary border border-customBorder text-mainText text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                      >
                        <option value="Beginner">Beginner Level</option>
                        <option value="Intermediate">Intermediate Level</option>
                        <option value="Advanced">Advanced Level</option>
                      </select>
                      <button
                        onClick={handleAddSkill}
                        className="px-3 py-2 bg-accent text-primary rounded-xl text-xs font-bold hover:brightness-110 cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-subText leading-relaxed">
                Levels show current confidence: <span className="text-sky-400">Beginner</span> is learning,
                <span className="text-amber-400"> Intermediate</span> can work independently, and
                <span className="text-emerald-400"> Advanced</span> can lead or mentor.
              </p>

              {}
              {skillsList.length === 0 ? (
                <p className="text-xs text-subText/50 italic">No skills listed yet.</p>
              ) : (
                <div className="space-y-2">
                  {skillsList.map((skill) => (
                    <div
                      key={skill.name}
                      className="bg-primary/50 border border-customBorder rounded-xl px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Link to={`/skills/${encodeURIComponent(skill.name)}`} className="text-xs font-bold text-mainText hover:text-accent transition-colors">{skill.name}</Link>
                        <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          skill.level === 'Advanced' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          skill.level === 'Intermediate' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                          'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        }`}>
                          {skill.level}
                        </span>
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveSkill(skill.name)}
                            className="text-red-400 hover:text-red-300 p-0.5 rounded transition-colors cursor-pointer"
                            title="Remove skill"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-footer overflow-hidden" aria-label={`${skill.level} proficiency`}>
                        <div className={`h-full rounded-full ${skill.level === 'Advanced' ? 'w-full bg-emerald-400' : skill.level === 'Intermediate' ? 'w-2/3 bg-amber-400' : 'w-1/3 bg-sky-400'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {}
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-subText flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" /> Activity Overview
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-primary/50 p-3 rounded-xl border border-customBorder text-center">
                  <span className="text-lg font-black text-accent block">{posts.length}</span>
                  <span className="text-[10px] text-subText uppercase font-bold">Posts</span>
                </div>
                <div className="bg-primary/50 p-3 rounded-xl border border-customBorder text-center">
                  <span className="text-lg font-black text-emerald-400 block">{projects.length}</span>
                  <span className="text-[10px] text-subText uppercase font-bold">Projects</span>
                </div>
                <div className="bg-primary/50 p-3 rounded-xl border border-customBorder text-center">
                  <span className="text-lg font-black text-purple-400 block">{clubs.length}</span>
                  <span className="text-[10px] text-subText uppercase font-bold">Clubs</span>
                </div>
                <div className="bg-primary/50 p-3 rounded-xl border border-customBorder text-center">
                  <span className="text-lg font-black text-cyan-400 block">{events.length}</span>
                  <span className="text-[10px] text-subText uppercase font-bold">Events</span>
                </div>
              </div>
            </div>

          </div>

          {}
          <div className="lg:col-span-8 space-y-6">
            <Tabs options={tabOptions} activeTab={activeTab} onChange={(k) => setActiveTab(k)} />

            {}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="glass-panel text-center py-14 rounded-2xl border border-customBorder">
                    <Briefcase className="mx-auto text-subText/30 mb-2" size={32} />
                    <p className="text-subText text-xs font-mono">
                      {isOwnProfile ? "You haven't posted any updates yet." : `${profile.name} hasn't posted any updates.`}
                    </p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} postData={mapBackendPostToPostData(post)} />
                  ))
                )}
              </div>
            )}

            {}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <div className="glass-panel text-center py-14 rounded-2xl border border-customBorder">
                    <FolderGit2 className="mx-auto text-subText/30 mb-2" size={32} />
                    <p className="text-subText text-xs font-mono">
                      {isOwnProfile ? "You haven't created any projects yet." : `${profile.name} hasn't showcased any projects yet.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {projects.map((proj) => (
                      <PostCard key={proj.id} postData={mapBackendPostToPostData(proj)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {}
            {activeTab === 'clubs' && (
              <div className="space-y-4">
                {clubs.length === 0 ? (
                  <div className="glass-panel text-center py-14 rounded-2xl border border-customBorder">
                    <Building2 className="mx-auto text-subText/30 mb-2" size={32} />
                    <p className="text-subText text-xs font-mono">
                      {isOwnProfile ? "You haven't joined any campus clubs yet." : `${profile.name} is not a member of any clubs yet.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {clubs.map((c) => (
                      <Link
                        key={c.id}
                        to={`/club/${c.id}`}
                        className="glass-panel rounded-2xl overflow-hidden border border-customBorder hover:border-accent/40 transition-all duration-300 group flex flex-col justify-between"
                      >
                         {c.details?.banner_url && (
                           <div className="h-28 w-full overflow-hidden relative bg-slate-950 flex items-center justify-center">
                             <img src={c.details.banner_url} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-40 scale-110 pointer-events-none" />
                             <img src={c.details.banner_url} alt={c.title} className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-[9px] font-bold text-white uppercase">
                              {c.details?.category || 'club'}
                            </div>
                          </div>
                        )}
                        <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-mainText group-hover:text-accent transition-colors flex items-center gap-1">
                                {c.title}
                              </h4>
                              {c.user_role && (
                                <span className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
                                  {c.user_role}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-subText line-clamp-2 mt-1 leading-relaxed">
                              {c.description}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-customBorder/40 flex items-center justify-between text-[11px] text-subText font-mono">
                            <span>👥 {c.member_count} Members</span>
                            <span className="text-accent font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                              View <ArrowUpRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {}
            {activeTab === 'events' && (
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="glass-panel text-center py-14 rounded-2xl border border-customBorder">
                    <Calendar className="mx-auto text-subText/30 mb-2" size={32} />
                    <p className="text-subText text-xs font-mono">
                      {isOwnProfile ? "You haven't registered for any events yet." : `${profile.name} is not attending any events yet.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {events.map((ev) => (
                      <Link
                        key={ev.id}
                        to={`/event/${ev.id}`}
                        className="glass-panel rounded-2xl overflow-hidden border border-customBorder hover:border-accent/40 transition-all duration-300 group flex flex-col justify-between"
                      >
                         {ev.details?.banner_url && (
                           <div className="h-28 w-full overflow-hidden relative bg-slate-950 flex items-center justify-center">
                             <img src={ev.details?.banner_url} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-40 scale-110 pointer-events-none" />
                             <img src={ev.details?.banner_url} alt={ev.title} className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-[9px] font-bold text-white uppercase">
                              {ev.event_type}
                            </div>
                          </div>
                        )}
                        <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-mainText group-hover:text-accent transition-colors">
                                {ev.title}
                              </h4>
                              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                {ev.status}
                              </span>
                            </div>
                            <p className="text-xs text-subText line-clamp-2 mt-1 leading-relaxed">
                              {ev.description}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-customBorder/40 flex items-center justify-between text-[11px] text-subText font-mono">
                            <span>📅 {new Date(ev.start_time).toLocaleString()}</span>
                            <span className="text-accent font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                              Details <ArrowUpRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
