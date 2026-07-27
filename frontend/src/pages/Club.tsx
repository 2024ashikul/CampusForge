import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users,
  FileText,
  ArrowUpRight,
  Sparkles,
  Crown,
  Settings,
  Plus,
  CheckCircle,
  Loader2,
  Megaphone,
  Check,
  Globe,
  Lock,
  Image as ImageIcon,
  Building2,
  UserCheck,
  Tag
  ,Trash2
} from 'lucide-react';
import Tabs, { type TabOption } from '../components/Tabs';
import TopPortion from '../components/TopPortion';
import { PostCard } from '../components/Posts/PostCard';
import { PostForm } from '../components/Posts/PostForm';
import { UserAvatar } from '../components/ui/UserAvatar';
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
  deleteClubApi,
  uploadFileApi,
  mapBackendPostToPostData,
  type BackendClub,
  type BackendPost,
  type BackendEvent
} from '../services/api';

type TabKey = 'public' | 'announcements' | 'events' | 'members' | 'settings';

interface ClubMember {
  id: number;
  user_id: string;
  student_id: string;
  name: string;
  email: string;
  department: string;
  profile_pic?: string;
  role: string;
  status: string;
  joined_at: string;
}

const AnnouncementCard: React.FC<{ announcement: BackendPost }> = ({ announcement }) => (
  <article className="overflow-hidden rounded-xl border border-customBorder bg-card shadow-sm transition-colors hover:border-accent/35">
    <div className="flex items-center gap-2 border-b border-customBorder bg-footer/70 px-4 py-2.5">
      <Megaphone className="h-4 w-4 text-accent" />
      <span className="text-[11px] font-bold uppercase tracking-wider text-mainText">Announcement</span>
      <time className="ml-auto shrink-0 text-[11px] text-subText">
        {new Date(announcement.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
      </time>
    </div>
    <div className="space-y-2 px-4 py-4">
      <h3 className="text-base font-bold text-mainText">{announcement.title}</h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-subText">{announcement.description}</p>
    </div>
  </article>
);

export const Club: React.FC = () => {
  const { clubid } = useParams<{ clubid: string }>();
  const numericId = clubid ? parseInt(clubid, 10) : 1;
  const navigate = useNavigate();

  const [club, setClub] = useState<BackendClub | null>(null);
  const [publicPosts, setPublicPosts] = useState<BackendPost[]>([]);
  const [internalPosts, setInternalPosts] = useState<BackendPost[]>([]);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabKey>('public');
  const [notification, setNotification] = useState<string | null>(null);

  
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);

  
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventFee, setNewEventFee] = useState('free');
  const [newEventImage, setNewEventImage] = useState('');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  
  const [newAnnounceTitle, setNewAnnounceTitle] = useState('');
  const [newAnnounceDesc, setNewAnnounceDesc] = useState('');
  const [isSubmittingAnnounce, setIsSubmittingAnnounce] = useState(false);

  
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('technical');
  const [editDept, setEditDept] = useState('');
  const [editFee, setEditFee] = useState('free');
  const [editJoinFormat, setEditJoinFormat] = useState('open');
  const [editIsRecruiting, setEditIsRecruiting] = useState<boolean>(true);
  const [editIsOpen, setEditIsOpen] = useState<boolean>(true);
  const [editIsResultsPublic, setEditIsResultsPublic] = useState<boolean>(true);
  const [editLeadName, setEditLeadName] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editProfilePictureUrl, setEditProfilePictureUrl] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const clubBannerRef = React.useRef<HTMLInputElement>(null);
  const clubProfilePictureRef = React.useRef<HTMLInputElement>(null);

  const userRole = club?.user_role || (club?.is_joined ? 'ENROLLED' : 'EXTERNAL');
  const isAdmin = userRole === 'ADMIN';
  const isEnrolled = userRole === 'ENROLLED' || isAdmin;
  const isAdminRole = (role: string) => ['admin', 'lead', 'leader', 'president', 'director'].includes(role.toLowerCase());
  const approvedAdminCount = members.filter((member) => member.status === 'approved' && isAdminRole(member.role)).length;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadAllClubData = async () => {
    if (isNaN(numericId)) return;
    setIsLoading(true);
    try {
      const [clubData, pubPosts, privPosts, allEvents] = await Promise.all([
        getClubByIdApi(numericId),
        getPostsApi({ club_id: numericId, post_type: 'post', status: 'published' }).catch(() => []),
        getPostsApi({ club_id: numericId, post_type: 'announcement', status: 'members_only' }).catch(() => []),
        getEventsApi().catch(() => []),
      ]);

      setClub(clubData);
      setEditTitle(clubData.title);
      setEditDesc(clubData.description);
      setEditCategory(clubData.details?.category || 'technical');
      setEditDept(clubData.details?.base_department || 'Engineering');
      setEditFee(clubData.settings?.membership_fee || 'free');
      setEditJoinFormat(clubData.settings?.join_format || 'open');
      setEditIsRecruiting(clubData.settings?.is_recruiting ?? true);
      setEditIsOpen(clubData.settings?.is_open ?? true);
      setEditIsResultsPublic(clubData.settings?.is_results_public ?? true);
      setEditLeadName(clubData.details?.lead_name || 'Club Lead');
      setEditBannerUrl(clubData.details?.banner_url || '');
      setEditProfilePictureUrl(clubData.details?.profile_picture_url || '');

      setPublicPosts(pubPosts);
      setInternalPosts([...privPosts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
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

  const tabOptions: TabOption<TabKey>[] = [
    { key: 'public', label: `Public Feed (${publicPosts.length})` },
  ];

  if (isEnrolled) {
    tabOptions.push({ key: 'announcements', label: `Announcements (${internalPosts.length})` });
  }

  tabOptions.push(
    { key: 'events', label: `Events (${events.length})` },
    { key: 'members', label: `Members (${members.length || club?.member_count || 1})` }
  );

  if (isAdmin) {
    tabOptions.push({ key: 'settings', label: '⚙️ Settings & Banner' });
  }

  
  const handleJoin = async () => {
    try {
      const res = await joinClubApi(numericId);
      showNotification(res.detail);
      loadAllClubData();
    } catch (e: any) {
      showNotification(e.message || 'Failed to join club');
    }
  };

  const handleDeleteClub = async () => {
    if (!window.confirm(`Delete “${club?.title || 'this club'}”? This cannot be undone.`)) return;
    try {
      await deleteClubApi(numericId);
      navigate('/clubs');
    } catch (err: any) { showNotification(err.message || 'Failed to delete club'); }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSavingSettings(true);
    try {
      const updated = await updateClubApi(numericId, {
        title: editTitle,
        description: editDesc,
        details: {
          category: editCategory,
          base_department: editDept,
          lead_name: editLeadName,
          banner_url: editBannerUrl,
          profile_picture_url: editProfilePictureUrl,
        },
        settings: {
          membership_fee: editFee,
          join_format: editJoinFormat as any,
          is_recruiting: editIsRecruiting,
          is_open: editIsOpen,
          is_results_public: editIsResultsPublic,
        },
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
    if (isAdminRole(currentRole) && approvedAdminCount <= 1) {
      showNotification('Assign another admin before demoting the only admin.');
      return;
    }
    const newRole = isAdminRole(currentRole) ? 'Member' : 'Admin';
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
        description: newEventDesc,
        event_type: 'workshop',
        status: 'upcoming',
        start_time: newEventDate && newEventTime ? `${newEventDate}T${newEventTime}` : new Date().toISOString().slice(0, 16),
        club_id: numericId,
        details: {
          location: newEventLocation || 'Campus Main Auditorium',
          banner_url: newEventImage || undefined,
          description_markdown: newEventDesc,
        },
        settings: {
          participation_type: 'individual',
          entrance_fee: newEventFee,
        },
      });
      showNotification('Event created successfully!');
      setIsCreateEventOpen(false);
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventImage('');
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
      const announcement = await createPostApi({
        title: newAnnounceTitle,
        description: newAnnounceDesc,
        post_type: 'announcement',
        status: 'members_only',
        club_id: numericId,
      });
      showNotification(announcement.email_notifications_queued
        ? `Announcement published. Email queued for ${announcement.notification_recipient_count} member${announcement.notification_recipient_count === 1 ? '' : 's'}.`
        : `Announcement published. ${announcement.notification_recipient_count} eligible member${announcement.notification_recipient_count === 1 ? '' : 's'} — email is not configured.`);
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
          <p className="text-subText text-xs font-mono">Loading club page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-mainText font-sans pb-16">
      
      {}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-accent text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> {notification}
        </div>
      )}

      {}
      <TopPortion
        bannerUrl={club?.details?.banner_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"}
        logoUrl={club?.details?.profile_picture_url || "🏛️"}
        name={club?.title || "Campus Organization"}
        tagline={`Lead: ${club?.details?.lead_name || 'Club Lead'} • ${club?.details?.base_department || 'Engineering'}`}
        location={club?.details?.base_department || "Main Campus"}
        founded={new Date(club?.created_at || Date.now()).getFullYear().toString()}
        entityType="club"
        userRole={isAdmin ? 'ADMIN' : (club?.is_joined ? 'ENROLLED' : 'EXTERNAL')}
        isPending={club?.is_joined === false && club?.settings?.join_format !== 'open' ? false : undefined}
        memberCount={club?.member_count}
        category={club?.details?.category || 'technical'}
        isJoined={club?.is_joined}
        onAction={club?.is_joined ? undefined : handleJoin}
      />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-5">

        {}
        <div className="glass-panel mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3">
          <Tabs options={tabOptions} activeTab={activeTab} onChange={(k) => setActiveTab(k)} />
          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setIsCreateEventOpen(true)}
                className="px-3.5 py-2 bg-accent text-white font-bold rounded-xl text-xs hover:bg-accentHover transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> + Create Event
              </button>
              <button onClick={handleDeleteClub} className="px-3.5 py-2 border border-rose-500/40 text-rose-400 font-bold rounded-xl text-xs hover:bg-rose-500/10 transition-all cursor-pointer flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Delete club
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {}
          <div className="lg:col-span-8 space-y-5">

            {}
            {activeTab === 'public' && (
              <div className="space-y-4">
                {isAdmin && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-customBorder bg-card p-4">
                    <div>
                      <h3 className="text-sm font-bold text-mainText">Share with the campus</h3>
                      <p className="mt-0.5 text-xs text-subText">Create a public post for this club's feed.</p>
                    </div>
                    <button onClick={() => setIsCreatePostOpen(true)} className="btn-primary shrink-0">
                      <Plus className="h-4 w-4" /> Create post
                    </button>
                  </div>
                )}
                {publicPosts.length === 0 ? (
                  <div className="rounded-2xl border border-customBorder bg-card p-12 text-center">
                    <FileText className="mx-auto w-10 h-10 text-subText/30 mb-2" />
                    <p className="text-subText text-sm font-medium">No public posts published yet.</p>
                  </div>
                ) : (
                  publicPosts.map((bp) => (
                    <PostCard key={bp.id} postData={mapBackendPostToPostData(bp)} canManage={isAdmin} onDeleted={() => loadAllClubData()} onUpdated={() => loadAllClubData()} />
                  ))
                )}
              </div>
            )}

            
            {activeTab === 'announcements' && isEnrolled && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-customBorder bg-card p-4">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 shrink-0 text-accent" />
                    <div>
                      <h4 className="text-sm font-bold text-mainText">Club announcements</h4>
                      <p className="text-xs text-subText">Updates from {club?.title}, newest first.</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsCreateAnnouncementOpen(true);
                      }}
                      className="btn-primary shrink-0"
                    >
                      + Announcement
                    </button>
                  )}
                </div>

                {internalPosts.length === 0 ? (
                  <div className="rounded-2xl border border-customBorder bg-card p-12 text-center">
                    <Megaphone className="mx-auto mb-2 h-8 w-8 text-subText/30" />
                    <p className="text-subText text-xs font-mono">No announcements yet.</p>
                  </div>
                ) : (
                  internalPosts.map((bp) => (
                    <AnnouncementCard key={bp.id} announcement={bp} />
                  ))
                )}
              </div>
            )}

            
            {activeTab === 'events' && (
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="rounded-2xl border border-customBorder bg-card p-12 text-center">
                    <p className="text-subText text-xs font-mono">No events scheduled for this club yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((ev) => (
                      <div key={ev.id} className="rounded-2xl border border-customBorder bg-card overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between">
                        {ev.details?.banner_url && (
                          <div className="h-36 w-full overflow-hidden">
                            <img src={ev.details.banner_url} alt={ev.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                              {ev.event_type}
                            </span>
                            <h4 className="text-base font-bold text-mainText mt-1.5">{ev.title}</h4>
                            <p className="text-xs text-subText line-clamp-2 mt-1">{ev.description}</p>
                          </div>
                          <div className="pt-3 border-t border-customBorder/40 flex items-center justify-between text-xs text-subText font-mono">
                            <span>📅 {ev.start_time ? new Date(ev.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                            <a href={`/event/${ev.id}`} className="text-accent font-bold hover:underline">
                              View Event →
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            
            {activeTab === 'members' && (
              <div className="rounded-2xl border border-customBorder bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-customBorder pb-3">
                  <h3 className="text-sm font-bold text-mainText flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" /> Club Members Roster
                  </h3>
                  <span className="text-xs text-subText font-mono">{members.length} Members</span>
                </div>

                <div className="divide-y divide-customBorder/40">
                  {members.map((m) => {
                    const isOnlyAdmin = isAdminRole(m.role) && m.status === 'approved' && approvedAdminCount <= 1;
                    return (
                    <div
                      key={m.id}
                      onClick={() => navigate(`/profile/${m.student_id}`)}
                      className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-primary/40 rounded-xl transition-colors px-2 -mx-2"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar name={m.name} src={m.profile_pic} className="h-9 w-9 rounded-full border border-customBorder font-bold text-xs" textClassName="text-xs" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-mainText">{m.name}</h4>
                            {m.role === 'Admin' && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                👑 Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-subText">{m.email} • {m.department}</span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          {m.status === 'pending' && (
                            <button
                              onClick={(event) => { event.stopPropagation(); handleApproveMember(m.id); }}
                              className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-500 cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={(event) => { event.stopPropagation(); handlePromoteToAdmin(m.id, m.role); }}
                            disabled={isOnlyAdmin}
                            title={isOnlyAdmin ? 'Assign another admin before demoting the only admin' : undefined}
                            className={`px-2.5 py-1 border text-[11px] font-bold rounded-lg ${isOnlyAdmin ? 'bg-footer text-subText border-customBorder cursor-not-allowed' : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30 cursor-pointer'}`}
                          >
                            {isOnlyAdmin ? 'Only Admin' : isAdminRole(m.role) ? 'Demote' : 'Make Admin'}
                          </button>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            
            {activeTab === 'settings' && isAdmin && (
              <form onSubmit={handleUpdateSettings} className="space-y-5">
                
                <div className="rounded-2xl border border-customBorder bg-card p-6 space-y-4">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider border-b border-customBorder pb-2 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> Identity & Branding
                  </h3>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-subText uppercase">Banner Image</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={editBannerUrl}
                        onChange={(e) => setEditBannerUrl(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 text-xs focus:outline-none focus:border-accent"
                      />
                      <input
                        ref={clubBannerRef}
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const res = await uploadFileApi(file);
                            setEditBannerUrl(res.url);
                            showNotification('Banner uploaded. Save settings to apply it.');
                          } catch (err) {
                            showNotification(err instanceof Error ? err.message : 'Banner upload failed');
                          } finally {
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => clubBannerRef.current?.click()}
                        className="px-3 py-2 bg-footer border border-customBorder text-mainText text-xs font-bold rounded-xl hover:border-accent/40 transition-all cursor-pointer"
                      >
                        📁
                      </button>
                    </div>
                    <p className="text-[10px] text-subText">Upload an image or paste its URL, then save the settings to update the club cover.</p>
                    {editBannerUrl && (
                      <img src={editBannerUrl} alt="Banner preview" className="h-28 w-full rounded-lg border border-customBorder object-cover" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-subText uppercase">Profile Picture</label>
                    <div className="flex gap-2">
                      <input type="url" placeholder="https://..." value={editProfilePictureUrl} onChange={(e) => setEditProfilePictureUrl(e.target.value)} className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 text-xs focus:outline-none focus:border-accent" />
                      <input ref={clubProfilePictureRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try { setEditProfilePictureUrl((await uploadFileApi(file)).url); showNotification('Profile picture uploaded. Save settings to apply it.'); }
                        catch (err) { showNotification(err instanceof Error ? err.message : 'Profile picture upload failed'); }
                        finally { e.target.value = ''; }
                      }} />
                      <button type="button" onClick={() => clubProfilePictureRef.current?.click()} className="px-3 py-2 bg-footer border border-customBorder text-mainText text-xs font-bold rounded-xl hover:border-accent/40 transition-all cursor-pointer" title="Upload profile picture">📁</button>
                    </div>
                    {editProfilePictureUrl && <img src={editProfilePictureUrl} alt="Profile preview" className="h-20 w-20 rounded-xl border border-customBorder object-cover" />}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Club Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Club Lead Name</label>
                      <input
                        type="text"
                        value={editLeadName}
                        onChange={(e) => setEditLeadName(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Base Department</label>
                      <input
                        type="text"
                        value={editDept}
                        onChange={(e) => setEditDept(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="technical">Technical</option>
                        <option value="cultural">Cultural</option>
                        <option value="sports">Sports</option>
                        <option value="academic">Academic</option>
                        <option value="social">Social</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-subText uppercase text-xs mb-1">About / Description</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full bg-primary border border-customBorder text-mainText text-xs rounded-xl p-3 focus:outline-none focus:border-accent"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                
                <div className="rounded-2xl border border-customBorder bg-card p-6 space-y-4">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider border-b border-customBorder pb-2 flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5" /> Membership & Access Control
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Membership Fee</label>
                      <input
                        type="text"
                        placeholder="free or $15/year"
                        value={editFee}
                        onChange={(e) => setEditFee(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Join Format</label>
                      <select
                        value={editJoinFormat}
                        onChange={(e) => setEditJoinFormat(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="open">Open (Instant Join)</option>
                        <option value="interview">Interview Required</option>
                        <option value="portfolio-review">Portfolio Review</option>
                      </select>
                    </div>
                  </div>

                  
                  <div className="space-y-2 pt-1">
                    {[
                      {
                        label: 'Currently Recruiting New Members',
                        value: editIsRecruiting,
                        set: setEditIsRecruiting,
                        hint: 'Displays active recruitment tag on club banner.',
                      },
                      {
                        label: 'Publicly Open Club Page',
                        value: editIsOpen,
                        set: setEditIsOpen,
                        hint: 'When off, club page and public posts are hidden from non-members.',
                      },
                    ].map(({ label, value, set, hint }) => (
                      <div key={label} className="flex items-start justify-between gap-4 p-3 bg-primary rounded-xl border border-customBorder">
                        <div>
                          <p className="text-xs font-bold text-mainText">{label}</p>
                          <p className="text-[10px] text-subText/70 mt-0.5">{hint}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => set(!value)}
                          className={`w-10 h-5 rounded-full transition-all shrink-0 relative cursor-pointer ${
                            value ? 'bg-accent' : 'bg-footer border border-customBorder'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                              value ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                
                <div className="rounded-2xl border border-customBorder bg-card p-6 space-y-4">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider border-b border-customBorder pb-2 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" /> Privacy Settings
                  </h3>

                  <div className="flex items-start justify-between gap-4 p-3 bg-primary rounded-xl border border-customBorder">
                    <div>
                      <p className="text-xs font-bold text-mainText">Show Club Results & Achievements Publicly</p>
                      <p className="text-[10px] text-subText/70 mt-0.5">Allow non-members to view event results and competition placements.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditIsResultsPublic(!editIsResultsPublic)}
                      className={`w-10 h-5 rounded-full transition-all shrink-0 relative cursor-pointer ${
                        editIsResultsPublic ? 'bg-accent' : 'bg-footer border border-customBorder'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          editIsResultsPublic ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 bg-accent text-white font-bold text-xs rounded-xl hover:bg-accentHover transition-all cursor-pointer shadow-md disabled:opacity-60"
                  >
                    {isSavingSettings ? 'Saving...' : 'Save All Settings'}
                  </button>
                </div>
              </form>
            )}

          </div>

          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-5 self-start">

            
            <div className="rounded-2xl border border-customBorder bg-card p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-mainText border-b border-customBorder pb-2">
                About {club?.title}
              </h3>
              <p className="text-xs text-subText leading-relaxed">
                {club?.description}
              </p>

              <div className="space-y-2.5 text-xs pt-2">
                <div className="flex items-center gap-2 text-subText">
                  <UserCheck className="w-4 h-4 text-accent shrink-0" />
                  <span>Lead: <strong className="text-mainText">{club?.details?.lead_name || 'Club Lead'}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-subText">
                  <Building2 className="w-4 h-4 text-accent shrink-0" />
                  <span>Dept: <strong className="text-mainText">{club?.details?.base_department || 'Engineering'}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-subText">
                  <Tag className="w-4 h-4 text-accent shrink-0" />
                  <span>Category: <span className="capitalize font-bold text-mainText">{club?.details?.category || 'technical'}</span></span>
                </div>
                <div className="flex items-center gap-2 text-subText">
                  <Globe className="w-4 h-4 text-accent shrink-0" />
                  <span>Format: <span className="capitalize font-bold text-mainText">{club?.settings?.join_format || 'open'}</span></span>
                </div>
              </div>
            </div>

            
            <div className="rounded-2xl border border-customBorder bg-card p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-subText">Club Activity</h3>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-primary p-3 rounded-xl border border-customBorder">
                  <span className="text-lg font-black text-accent block">{publicPosts.length + internalPosts.length}</span>
                  <span className="text-[10px] text-subText uppercase font-bold">Total Posts</span>
                </div>
                <div className="bg-primary p-3 rounded-xl border border-customBorder">
                  <span className="text-lg font-black text-emerald-400 block">{events.length}</span>
                  <span className="text-[10px] text-subText uppercase font-bold">Events</span>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </div>

      
      {isCreateEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCreateEventOpen(false)} />
          <div className="relative w-full max-w-md bg-card rounded-2xl p-6 border border-customBorder shadow-2xl z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-customBorder pb-3">
              <h3 className="text-sm font-bold text-mainText flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent" /> Create New Event
              </h3>
              <button onClick={() => setIsCreateEventOpen(false)} className="text-subText hover:text-mainText text-sm">✕</button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. AI Hackathon 2026"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-subText mb-1 uppercase">Date</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:border-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-subText mb-1 uppercase">Time</label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:border-accent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Location</label>
                <input
                  type="text"
                  placeholder="Room 402 or Main Auditorium"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Description</label>
                <textarea
                  placeholder="Event overview..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:border-accent"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-customBorder">
                <button type="button" onClick={() => setIsCreateEventOpen(false)} className="px-4 py-2 bg-footer text-mainText rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingEvent} className="px-5 py-2 bg-accent text-white rounded-xl font-bold shadow-sm">
                  {isSubmittingEvent ? 'Publishing...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreatePostOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
          <div className="mx-auto my-6 w-full max-w-3xl">
            <PostForm
              eventId={numericId}
              clubName={club?.title || 'Campus Club'}
              modalTitle="Create public club post"
              onClose={() => setIsCreatePostOpen(false)}
              onSaved={() => {
                showNotification('Public post published.');
                loadAllClubData();
              }}
            />
          </div>
        </div>
      )}

      
      {isCreateAnnouncementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCreateAnnouncementOpen(false)} />
          <div className="relative w-full max-w-md bg-card rounded-2xl p-6 border border-customBorder shadow-2xl z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-customBorder pb-3">
              <h3 className="text-sm font-bold text-mainText flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-accent" /> Create Member Announcement
              </h3>
              <button onClick={() => setIsCreateAnnouncementOpen(false)} className="text-subText hover:text-mainText text-sm">✕</button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div className="rounded-lg border border-customBorder bg-footer px-3 py-2.5 text-xs text-subText">
                This announcement will be shared with club members.
              </div>
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Header</label>
                <input
                  type="text"
                  placeholder="e.g. Workshop Registration Open"
                  value={newAnnounceTitle}
                  onChange={(e) => setNewAnnounceTitle(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Content</label>
                <textarea
                  placeholder="Write announcement text..."
                  value={newAnnounceDesc}
                  onChange={(e) => setNewAnnounceDesc(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:border-accent"
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-customBorder">
                <button type="button" onClick={() => setIsCreateAnnouncementOpen(false)} className="px-4 py-2 bg-footer text-mainText rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingAnnounce} className="px-5 py-2 bg-accent text-white rounded-xl font-bold shadow-sm">
                  {isSubmittingAnnounce ? 'Posting...' : 'Post Announcement'}
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
