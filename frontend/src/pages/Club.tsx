import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar,
  Users,
  FileText,
  MapPin,
  ArrowUpRight,
  Sparkles,
  Crown,
  Settings,
  Plus,
  CheckCircle,
  UserPlus,
  Loader2,
  Megaphone,
  Check,
  X
} from 'lucide-react';
import Tabs, { type TabOption } from '../components/Tabs';
import TopPortion from '../components/TopPortion';
import {
  getClubByIdApi,
  getPostsApi,
  getEventsApi,
  getClubMembersApi,
  updateClubApi,
  updateClubMemberApi,
  createPostApi,
  createEventApi,
  joinClubApi,
  type BackendClub,
  type BackendPost,
  type BackendEvent
} from '../services/api';
import { PaymentModal } from '../components/PaymentModal';

type TabKey = 'posts' | 'events' | 'members' | 'announcements' | 'settings';

interface ClubMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  department: string;
  profile_pic?: string;
  role: string;
  status: string;
  joined_at: string;
}

export const Club: React.FC = () => {
  const { clubid } = useParams<{ clubid: string }>();
  const numericId = clubid ? parseInt(clubid, 10) : 1;

  const [club, setClub] = useState<BackendClub | null>(null);
  const [posts, setPosts] = useState<BackendPost[]>([]);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal States
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventFee, setNewEventFee] = useState('free');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // New Announcement Form State
  const [newAnnounceTitle, setNewAnnounceTitle] = useState('');
  const [newAnnounceDesc, setNewAnnounceDesc] = useState('');
  const [isSubmittingAnnounce, setIsSubmittingAnnounce] = useState(false);

  // Settings Tab Form State
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('technical');
  const [editDept, setEditDept] = useState('');
  const [editFee, setEditFee] = useState('free');
  const [editJoinFormat, setEditJoinFormat] = useState('open');
  const [editIsRecruiting, setEditIsRecruiting] = useState<number>(1);
  const [editLeadName, setEditLeadName] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const userRole = club?.user_role || (club?.is_joined ? 'ENROLLED' : 'EXTERNAL');
  const isAdmin = userRole === 'ADMIN';
  const isEnrolled = userRole === 'ENROLLED' || isAdmin;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadAllClubData = async () => {
    if (isNaN(numericId)) return;
    setIsLoading(true);
    try {
      const [clubData, allPosts, allEvents] = await Promise.all([
        getClubByIdApi(numericId),
        getPostsApi({ club_id: numericId }).catch(() => []),
        getEventsApi().catch(() => []),
      ]);

      setClub(clubData);
      setEditTitle(clubData.title);
      setEditDesc(clubData.description);
      setEditCategory(clubData.category || 'technical');
      setEditDept(clubData.base_department || 'Engineering');
      setEditFee(clubData.membership_fee || 'free');
      setEditJoinFormat(clubData.join_format || 'open');
      setEditIsRecruiting(clubData.is_recruiting ?? 1);
      setEditLeadName(clubData.lead_name || 'Club Lead');

      setPosts(allPosts);
      setEvents(allEvents.filter((e) => e.club_id === numericId));

      if (clubData.user_role === 'ADMIN' || clubData.is_joined) {
        getClubMembersApi(numericId)
          .then(setMembers)
          .catch(() => []);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllClubData();
  }, [clubid]);

  // Tab Options Logic
  const tabOptions: TabOption<TabKey>[] = [
    { key: 'posts', label: `Posts (${posts.length})` },
    { key: 'events', label: `Events (${events.length})` },
    { key: 'members', label: `Members (${members.length || club?.member_count || 1})` },
  ];

  if (isEnrolled) {
    tabOptions.push({ key: 'announcements', label: 'Announcements' });
  }

  if (isAdmin) {
    tabOptions.push({ key: 'settings', label: '⚙️ Club Settings' });
  }

  // Handlers
  const handleJoin = async () => {
    try {
      const res = await joinClubApi(numericId);
      showNotification(res.detail);
      loadAllClubData();
    } catch (e: any) {
      showNotification(e.message || 'Failed to join club');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSavingSettings(true);
    try {
      const updated = await updateClubApi(numericId, {
        title: editTitle,
        description: editDesc,
        category: editCategory,
        base_department: editDept,
        membership_fee: editFee,
        join_format: editJoinFormat,
        is_recruiting: editIsRecruiting,
        lead_name: editLeadName,
      });
      setClub(updated);
      showNotification('Club settings updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update club settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePromoteToAdmin = async (memberId: number, currentRole: string) => {
    if (!isAdmin) return;
    const newRole = currentRole === 'Admin' ? 'Member' : 'Admin';
    try {
      await updateClubMemberApi(numericId, memberId, { role: newRole });
      showNotification(`Updated role to ${newRole}`);
      const updatedMembers = await getClubMembersApi(numericId);
      setMembers(updatedMembers);
    } catch (err: any) {
      showNotification(err.message || 'Failed to update member role');
    }
  };

  const handleApproveMember = async (memberId: number) => {
    if (!isAdmin) return;
    try {
      await updateClubMemberApi(numericId, memberId, { status: 'approved' });
      showNotification('Member approved successfully!');
      const updatedMembers = await getClubMembersApi(numericId);
      setMembers(updatedMembers);
    } catch (err: any) {
      showNotification(err.message || 'Failed to approve member');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSubmittingEvent(true);
    try {
      await createEventApi({
        title: newEventTitle,
        short_description: newEventDesc,
        description_markdown: newEventDesc,
        event_type: 'workshop',
        status: 'upcoming',
        participation_type: 'individual',
        entrance_fee: newEventFee,
        date: newEventDate || 'TBD',
        time: newEventTime || '18:00',
        location: newEventLocation || 'Campus Hub',
        club_id: numericId,
      });
      showNotification('Event created successfully!');
      setIsCreateEventOpen(false);
      setNewEventTitle('');
      setNewEventDesc('');
      loadAllClubData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to create event');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSubmittingAnnounce(true);
    try {
      await createPostApi({
        title: newAnnounceTitle,
        description: newAnnounceDesc,
        post_type: 'announcement',
        club_id: numericId,
      });
      showNotification('Announcement posted successfully!');
      setIsCreateAnnouncementOpen(false);
      setNewAnnounceTitle('');
      setNewAnnounceDesc('');
      loadAllClubData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to post announcement');
    } finally {
      setIsSubmittingAnnounce(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-subText text-xs font-mono">Loading club permissions & workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-mainText font-sans pb-16 transition-colors duration-300">
      
      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-accent text-primary px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" /> {notification}
        </div>
      )}

      {/* Top Banner & Header */}
      <TopPortion
        bannerUrl={club?.image_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"}
        logoUrl="🏛️"
        name={club?.title || "Campus Organization"}
        tagline={`Lead: ${club?.lead_name || 'Club Lead'} • ${club?.base_department || 'Engineering'}`}
        location={club?.base_department || "Main Campus"}
        founded={new Date(club?.created_at || Date.now()).getFullYear().toString()}
        memberType={club?.is_joined ? 'member' : 'non_member'}
        isJoined={club?.is_joined}
        onJoin={handleJoin}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-6">

        {/* Navigation Tabs + Admin Quick Actions */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Tabs options={tabOptions} activeTab={activeTab} onChange={(k) => setActiveTab(k)} />
          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setIsCreateAnnouncementOpen(true)}
                className="px-3.5 py-2 bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold rounded-xl text-xs hover:bg-purple-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Megaphone className="w-3.5 h-3.5" /> + Announcement
              </button>
              <button
                onClick={() => setIsCreateEventOpen(true)}
                className="px-3.5 py-2 bg-accent text-primary font-bold rounded-xl text-xs hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" /> + Create Event
              </button>
            </div>
          )}
        </div>

        {/* TAB CONTENTS */}
        <div className="space-y-6">

          {/* 1. CLUB POSTS TAB */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="glass-panel text-center py-12 rounded-2xl border border-customBorder">
                  <p className="text-subText text-xs font-mono">No club posts published yet.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="glass-panel rounded-2xl p-5 hover:border-accent/40 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                        post.post_type === 'announcement'
                          ? 'bg-purple-950/40 text-purple-300 border-purple-500/30'
                          : 'bg-accent/10 text-accent border-accent/30'
                      }`}>
                        {post.post_type}
                      </span>
                      <span className="text-xs text-subText font-mono">
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-mainText mt-1 group-hover:text-accent transition-colors flex items-center gap-1.5">
                      {post.title} <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                    </h4>
                    <p className="text-xs text-subText/80 mt-1.5 line-clamp-3 leading-relaxed">
                      {post.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. CLUB EVENTS TAB */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              {isAdmin && (
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setIsCreateEventOpen(true)}
                    className="px-4 py-2 bg-accent text-primary font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:brightness-110"
                  >
                    <Plus className="w-4 h-4" /> Add Club Event
                  </button>
                </div>
              )}

              {events.length === 0 ? (
                <div className="glass-panel text-center py-12 rounded-2xl border border-customBorder">
                  <p className="text-subText text-xs font-mono">No events scheduled for this club yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((ev) => (
                    <div key={ev.id} className="glass-panel rounded-2xl p-5 space-y-3 hover:border-accent/40 transition-all">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent uppercase">
                          {ev.event_type}
                        </span>
                        <span className="text-xs font-semibold text-emerald-400">{ev.entrance_fee}</span>
                      </div>
                      <h4 className="text-base font-bold text-mainText">{ev.title}</h4>
                      <p className="text-xs text-subText line-clamp-2 leading-relaxed">{ev.short_description}</p>
                      <div className="border-t border-customBorder/50 pt-3 flex justify-between items-center text-xs text-subText font-mono">
                        <span>📅 {ev.date} at {ev.time}</span>
                        <a href={`/event/${ev.id}`} className="text-accent font-bold hover:underline">
                          View Event →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. MEMBERS & APPROVALS TAB */}
          {activeTab === 'members' && (
            <div className="glass-panel rounded-2xl p-6 border border-customBorder space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-subText flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" /> Club Roster & Member Approvals
                </h3>
                <span className="text-xs font-mono text-accent">{members.length} Members</span>
              </div>

              {members.length === 0 ? (
                <p className="text-xs text-subText italic">No registered member records available.</p>
              ) : (
                <div className="divide-y divide-customBorder/40">
                  {members.map((m) => (
                    <div key={m.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-purple-600/30 border border-customBorder flex items-center justify-center font-bold text-accent text-sm">
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-mainText">{m.name}</h4>
                            {m.role === 'Admin' || m.role === 'Lead' ? (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                👑 {m.role}
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-footer border border-customBorder text-subText">
                                {m.role}
                              </span>
                            )}
                            {m.status === 'pending' && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                ⏳ Pending Approval
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-subText font-mono">{m.email} • {m.department}</span>
                        </div>
                      </div>

                      {/* Admin Controls for Members */}
                      {isAdmin && (
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {m.status === 'pending' && (
                            <button
                              onClick={() => handleApproveMember(m.id)}
                              className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg hover:bg-emerald-500/30 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}
                          <button
                            onClick={() => handlePromoteToAdmin(m.id, m.role)}
                            className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-lg hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            {m.role === 'Admin' ? 'Demote to Member' : 'Make Admin'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              {isAdmin && (
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setIsCreateAnnouncementOpen(true)}
                    className="px-4 py-2 bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:bg-purple-600/40"
                  >
                    <Megaphone className="w-4 h-4" /> Post Club Announcement
                  </button>
                </div>
              )}

              {posts.filter((p) => p.post_type === 'announcement').length === 0 ? (
                <div className="glass-panel text-center py-12 rounded-2xl border border-customBorder">
                  <p className="text-subText text-xs font-mono">No official announcements posted yet.</p>
                </div>
              ) : (
                posts
                  .filter((p) => p.post_type === 'announcement')
                  .map((ann) => (
                    <div key={ann.id} className="glass-panel rounded-2xl p-5 border-l-4 border-l-purple-500 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 bg-purple-950/50 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                          📢 Official Announcement
                        </span>
                        <span className="text-xs text-subText font-mono">
                          {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-mainText">{ann.title}</h4>
                      <p className="text-xs text-mainText/90 leading-relaxed">{ann.description}</p>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* 5. ⚙️ ADMIN CLUB SETTINGS TAB */}
          {activeTab === 'settings' && isAdmin && (
            <form onSubmit={handleUpdateSettings} className="glass-panel rounded-2xl p-6 border border-customBorder space-y-6">
              <div className="border-b border-customBorder pb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-mainText flex items-center gap-2">
                  <Settings className="w-4 h-4 text-accent" /> Manage Club Configurations
                </h3>
                <p className="text-xs text-subText mt-1">Update membership requirements, recruiting status, and club metadata.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Club Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Lead Name / Admin Contact</label>
                  <input
                    type="text"
                    value={editLeadName}
                    onChange={(e) => setEditLeadName(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Base Department</label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Membership Fee</label>
                  <input
                    type="text"
                    value={editFee}
                    onChange={(e) => setEditFee(e.target.value)}
                    placeholder="free or $10"
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Join Format Workflow</label>
                  <select
                    value={editJoinFormat}
                    onChange={(e) => setEditJoinFormat(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    <option value="open">Open (Instant Admission)</option>
                    <option value="interview">Interview & Screening Required</option>
                    <option value="portfolio-review">Portfolio Review Required</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Recruitment Status</label>
                  <select
                    value={editIsRecruiting}
                    onChange={(e) => setEditIsRecruiting(Number(e.target.value))}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    <option value={1}>Actively Recruiting Members</option>
                    <option value={0}>Recruitment Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-subText uppercase text-xs mb-1">Detailed Overview</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-customBorder">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 bg-gradient-to-r from-accent to-cyan-500 text-primary text-xs font-black rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-lg disabled:opacity-60 flex items-center gap-2"
                >
                  {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {isSavingSettings ? 'Saving Settings...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* CREATE EVENT MODAL FOR ADMIN */}
      {isCreateEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCreateEventOpen(false)} />
          <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-accent/30 shadow-2xl z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-customBorder pb-3">
              <h3 className="text-sm font-bold text-mainText flex items-center gap-2 glow-text">
                <Plus className="w-4 h-4 text-accent" /> Create New Club Event
              </h3>
              <button onClick={() => setIsCreateEventOpen(false)} className="text-subText hover:text-mainText text-sm">✕</button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. AI Hack Night 2026"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-subText mb-1 uppercase">Date</label>
                  <input
                    type="text"
                    placeholder="June 15, 2026"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-subText mb-1 uppercase">Time</label>
                  <input
                    type="text"
                    placeholder="18:00 PM"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Location / Link</label>
                <input
                  type="text"
                  placeholder="Room 402 or Virtual Link"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Short Description</label>
                <textarea
                  placeholder="Overview of the event..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-accent"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-customBorder">
                <button type="button" onClick={() => setIsCreateEventOpen(false)} className="px-4 py-2 bg-footer text-mainText rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingEvent} className="px-5 py-2 bg-accent text-primary rounded-xl font-bold shadow-md">
                  {isSubmittingEvent ? 'Publishing...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST ANNOUNCEMENT MODAL FOR ADMIN */}
      {isCreateAnnouncementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCreateAnnouncementOpen(false)} />
          <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-purple-500/30 shadow-2xl z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-customBorder pb-3">
              <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-purple-400" /> Post Official Club Announcement
              </h3>
              <button onClick={() => setIsCreateAnnouncementOpen(false)} className="text-subText hover:text-mainText text-sm">✕</button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Announcement Header</label>
                <input
                  type="text"
                  placeholder="e.g. Hackathon Winners Announced!"
                  value={newAnnounceTitle}
                  onChange={(e) => setNewAnnounceTitle(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Announcement Message</label>
                <textarea
                  placeholder="Write official announcement details..."
                  value={newAnnounceDesc}
                  onChange={(e) => setNewAnnounceDesc(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-customBorder">
                <button type="button" onClick={() => setIsCreateAnnouncementOpen(false)} className="px-4 py-2 bg-footer text-mainText rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingAnnounce} className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold shadow-md">
                  {isSubmittingAnnounce ? 'Posting...' : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Club;