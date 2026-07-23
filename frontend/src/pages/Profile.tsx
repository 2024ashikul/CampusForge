import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Trash2
} from 'lucide-react';

import {
  getUserByIdApi,
  getPostsApi,
  updateUserApi,
  type BackendUser,
  type BackendPost,
  type Skill,
  type SkillLevel
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { type TabOption, Tabs } from '../components/Tabs';

type TabKey = 'posts';

// Helper to get initials
function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const UserProfileView: React.FC = () => {
  const { profileid } = useParams<{ profileid: string }>();
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState<BackendUser | null>(null);
  const [posts, setPosts] = useState<BackendPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const [isEditing, setIsEditing] = useState(false);

  // Edit states
  const [bioInput, setBioInput] = useState('');
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Intermediate');
  const [isSaving, setIsSaving] = useState(false);

  const userId = Number(profileid) || authUser?.id;
  const isOwnProfile = authUser?.id === userId;

  useEffect(() => {
    if (!userId) return;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [userData, userPosts] = await Promise.all([
          getUserByIdApi(userId!),
          getPostsApi({ user_id: userId }).catch(() => []),
        ]);
        if (!userData) throw new Error('User not found');
        setProfile(userData);
        setBioInput(userData.bio || '');
        setSkillsList(userData.skills || []);
        setPosts(userPosts);
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [userId]);

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
    const updated = await updateUserApi(profile.id, {
      bio: bioInput,
      skills: skillsList,
    });
    if (updated) {
      setProfile(updated);
      setBioInput(updated.bio || '');
      setSkillsList(updated.skills || []);
    }
    setIsSaving(false);
    setIsEditing(false);
  };

  const tabOptions: TabOption<TabKey>[] = [
    { key: 'posts', label: `Posts (${posts.length})` },
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

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-subText text-xs font-mono">Syncing futuristic profile matrix...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="flex items-center justify-center gap-3 px-4 py-3 bg-red-900/20 border border-red-500/40 rounded-xl text-sm">
            <WifiOff size={16} className="text-red-400 shrink-0" />
            <span className="text-red-300">{error || 'Profile not found'}</span>
          </div>
          <a href="/students" className="text-accent text-sm hover:underline">← Back to Students</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-mainText font-sans pb-16 transition-colors duration-300">

      {/* Cyber Glow Hero Banner */}
      <div className="h-48 w-full bg-gradient-to-r from-accent/20 via-purple-600/10 to-cyan-500/20 border-b border-customBorder relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">

        {/* Identity Panel */}
        <div className="glass-panel rounded-2xl p-6 shadow-2xl mb-8 border border-customBorder">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Avatar */}
              {profile.profile_pic ? (
                <img
                  src={profile.profile_pic}
                  alt={profile.name}
                  className="w-28 h-28 rounded-2xl border-4 border-primary object-cover shadow-2xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-accent via-cyan-500 to-purple-600 border-4 border-primary flex items-center justify-center text-4xl font-black text-primary shadow-2xl">
                  {getInitials(profile.name)}
                </div>
              )}

              <div className="mb-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-black tracking-tight glow-text">{profile.name}</h1>
                  {isOwnProfile && (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 bg-accent/10 text-accent rounded-full border border-accent/40 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> You
                    </span>
                  )}
                </div>
                <p className="text-accent font-semibold text-sm mt-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> {profile.department}
                </p>
                <div className="flex items-center gap-2 text-xs text-subText mt-2 font-mono">
                  <Mail className="w-3.5 h-3.5 text-accent/70" />
                  <span>{profile.email}</span>
                </div>
              </div>
            </div>

            {/* Edit controls */}
            {isOwnProfile && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setBioInput(profile.bio || '');
                        setSkillsList(profile.skills || []);
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

        {/* Two-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Sidebar: Bio + Skills Matrix */}
          <div className="lg:col-span-4 space-y-6">

            {/* Bio Card */}
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-subText flex items-center gap-2">
                <User className="w-4 h-4 text-accent" /> Developer Overview
              </h3>
              {isEditing ? (
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="w-full bg-footer text-mainText border border-customBorder rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
                  rows={4}
                  placeholder="Write a short bio about yourself..."
                />
              ) : (
                <p className="text-xs text-mainText/90 leading-relaxed">
                  {profile.bio || (
                    <span className="text-subText/50 italic">No bio specified yet.{isOwnProfile && ' Click Edit to add one.'}</span>
                  )}
                </p>
              )}
            </div>

            {/* Skills & Capability Matrix (Multivalued Attribute) */}
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-subText flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" /> Skills & Level Matrix
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-accent/10 text-accent rounded-full border border-accent/20">
                  {skillsList.length} Skills
                </span>
              </div>

              {/* Edit skills control */}
              {isEditing && (
                <div className="space-y-2 pt-2 border-t border-customBorder/50">
                  <span className="text-[11px] font-bold text-subText uppercase">Add New Skill</span>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Skill name (e.g. React, Python)"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="w-full bg-primary border border-customBorder text-mainText text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                    />
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

              {/* Skills List Rendering */}
              <div className="flex flex-wrap gap-2 pt-1">
                {skillsList.length === 0 ? (
                  <p className="text-xs text-subText/50 italic">No skills listed yet.</p>
                ) : (
                  skillsList.map((skill) => (
                    <div
                      key={skill.name}
                      className={`skill-badge ${getSkillBadgeClass(skill.level)} group relative cursor-default`}
                    >
                      <span className="font-semibold">{skill.name}</span>
                      <span className="text-[9px] opacity-75 uppercase tracking-wider font-mono">
                        ({skill.level})
                      </span>
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveSkill(skill.name)}
                          className="ml-1 text-red-400 hover:text-red-300 p-0.5 rounded transition-colors cursor-pointer"
                          title="Remove skill"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Account Metadata Card */}
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-subText flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" /> System Metadata
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-customBorder/40">
                  <span className="text-subText">Member Since</span>
                  <span className="text-mainText font-mono">
                    {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-customBorder/40">
                  <span className="text-subText">Account Status</span>
                  <span className={`font-mono px-2 py-0.5 rounded-full text-[10px] ${profile.is_active ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30' : 'text-red-400 bg-red-950/40 border border-red-500/30'}`}>
                    {profile.is_active ? '● Active' : '○ Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-subText">Total Posts</span>
                  <span className="text-mainText font-mono">{posts.length}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Main Content Column */}
          <div className="lg:col-span-8 space-y-6">
            <Tabs options={tabOptions} activeTab={activeTab} onChange={(k) => setActiveTab(k)} />

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
                  <div
                    key={post.id}
                    className="glass-panel rounded-2xl p-5 hover:border-accent/40 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                        post.post_type === 'project'
                          ? 'bg-accent/10 text-accent border-accent/30'
                          : post.post_type === 'announcement'
                          ? 'bg-purple-950/40 text-purple-300 border-purple-500/30'
                          : 'bg-footer text-subText border-customBorder'
                      }`}>
                        {post.post_type}
                      </span>
                      <span className="text-xs text-subText font-mono">
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-mainText mt-2 group-hover:text-accent transition-colors flex items-center gap-1.5">
                      {post.title} <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                    </h4>
                    <p className="text-xs text-subText/80 mt-1.5 line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;