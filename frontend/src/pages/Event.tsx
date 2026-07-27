import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Users,
  Trophy,
  Sparkles,
  Settings,
  Megaphone,
  Loader2,
  ExternalLink,
  Video,
  Check,
  Image as ImageIcon,
  FileSpreadsheet,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Ticket,
  Upload,
  Trash2
} from 'lucide-react';
import Tabs, { type TabOption } from '../components/Tabs';
import TopPortion from '../components/TopPortion';
import { CsvResultsUploader } from '../components/CsvResultsUploader';
import { useTheme } from '../context/ThemeContext';
import {
  getEventByIdApi,
  registerEventApi,
  addTeamMembersApi,
  updateEventApi,
  publishEventResultsApi,
  deleteEventApi,
  getEventRegistrantsApi,
  updateEventRegistrantApi,
  addEventAdminApi,
  removeEventTeamApi,
  createPostApi,
  uploadFileApi,
  getPostsApi,
  getUsersApi,
  type BackendEvent,
  type BackendPost,
  type BackendUser
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from '../components/ui/UserAvatar';

const MarkdownPreview = React.lazy(() =>
  import('@uiw/react-md-editor').then((mod) => ({ default: mod.default.Markdown }))
);
const MDEditor = React.lazy(() => import('@uiw/react-md-editor'));

type TabKey = 'details' | 'results' | 'registrants' | 'announcements' | 'settings';

const AnnouncementCard: React.FC<{ announcement: BackendPost }> = ({ announcement }) => {
  const { theme } = useTheme();
  return <article className="overflow-hidden rounded-xl border border-customBorder bg-card shadow-sm transition-colors hover:border-accent/35">
    <div className="flex items-center gap-2 border-b border-customBorder bg-footer/70 px-4 py-2.5">
      <Megaphone className="h-4 w-4 text-accent" />
      <span className="text-[11px] font-bold uppercase tracking-wider text-mainText">Announcement</span>
      <time className="ml-auto text-[11px] text-subText">{new Date(announcement.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
    </div>
    <div className="space-y-2 px-4 py-4">
      <h3 className="text-base font-bold text-mainText">{announcement.title}</h3>
      <div data-color-mode={theme} className="text-sm leading-relaxed text-subText">
        <Suspense fallback={<p className="animate-pulse">Loading announcement…</p>}>
          <MarkdownPreview source={announcement.description} className="!bg-transparent !text-mainText" />
        </Suspense>
      </div>
    </div>
  </article>;
};

interface EventRegistrant {
  id: number;
  user_id: string;
  name: string;
  email: string;
  department: string;
  profile_pic?: string | null;
  team_name?: string;
  role: string;
  status: string;
  registered_at: string;
}

export const Event: React.FC = () => {
  const { eventid } = useParams<{ eventid: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const numericId = eventid ? parseInt(eventid, 10) : 1;
  const { theme } = useTheme();

  const [eventData, setEventData] = useState<BackendEvent | null>(null);
  const [registrants, setRegistrants] = useState<EventRegistrant[]>([]);
  const [announcements, setAnnouncements] = useState<BackendPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [notification, setNotification] = useState<string | null>(null);

  
  const [isPublishResultsOpen, setIsPublishResultsOpen] = useState(false);
  const [isPostAnnounceOpen, setIsPostAnnounceOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [teamRegistrationMode, setTeamRegistrationMode] = useState<'create' | 'extend'>('create');

  
  const [resultsInput, setResultsInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const resultsFileRef = useRef<HTMLInputElement>(null);

  
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [isPostingAnnounce, setIsPostingAnnounce] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<BackendUser[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [allUsers, setAllUsers] = useState<BackendUser[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminRole, setAdminRole] = useState('Admin');

  
  const [editTitle, setEditTitle] = useState('');
  const [editMarkdown, setEditMarkdown] = useState('');
  const [editType, setEditType] = useState('workshop');
  const [editStatus, setEditStatus] = useState('upcoming');
  const [editParticipation, setEditParticipation] = useState('individual');
  const [editFee, setEditFee] = useState('free');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editVirtualLink, setEditVirtualLink] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editProfilePictureUrl, setEditProfilePictureUrl] = useState('');
  const eventBannerRef = useRef<HTMLInputElement>(null);
  const eventProfilePictureRef = useRef<HTMLInputElement>(null);
  const [editIsAttendeesPublic, setEditIsAttendeesPublic] = useState(true);
  const [editIsResultsPublic, setEditIsResultsPublic] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const userRole = eventData?.user_role || (eventData?.is_registered ? 'ENROLLED' : 'EXTERNAL');
  const isAdmin = userRole === 'ADMIN';
  const isEnrolled = userRole === 'ENROLLED' || isAdmin;
  const mainAdminId = useMemo(() => registrants
    .filter((registrant) => registrant.role.toLowerCase() === 'admin')
    .sort((a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime())[0]?.user_id, [registrants]);
  const isMainAdmin = isAdmin && currentUser?.student_id === mainAdminId;
  const currentTeamMembership = useMemo(() => registrants.find((registrant) =>
    registrant.user_id === currentUser?.student_id && registrant.role.toLowerCase() !== 'admin' && registrant.team_name
  ), [registrants, currentUser?.student_id]);
  const currentTeamSize = useMemo(() => currentTeamMembership?.team_name
    ? registrants.filter((registrant) => registrant.team_name === currentTeamMembership.team_name && registrant.role.toLowerCase() !== 'admin').length
    : 0, [registrants, currentTeamMembership?.team_name]);
  const maxSelectableTeamMembers = teamRegistrationMode === 'extend' ? 4 - currentTeamSize : 3;
  const attendeeGroups = useMemo(() => {
    const groupByTeam = (items: EventRegistrant[]) => {
      const groups = new Map<string, EventRegistrant[]>();
      items.forEach((registrant) => {
        const key = registrant.team_name?.trim() || registrant.name;
        groups.set(key, [...(groups.get(key) || []), registrant]);
      });
      return [...groups.entries()].map(([name, members]) => ({ name, members }));
    };
    return {
      participants: groupByTeam(registrants.filter((registrant) => registrant.role.toLowerCase() !== 'admin')),
    };
  }, [registrants]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadAllEventData = async () => {
    if (isNaN(numericId)) return;
    setIsLoading(true);
    try {
      const backendEv = await getEventByIdApi(numericId);
      setEventData(backendEv);
      setResultsInput(backendEv.details?.results || '');

      setEditTitle(backendEv.title);
      setEditMarkdown(backendEv.details?.description_markdown || backendEv.description);
      setEditType(backendEv.event_type || 'workshop');
      setEditStatus(backendEv.status || 'upcoming');
      setEditParticipation(backendEv.settings?.participation_type || 'individual');
      setEditFee(backendEv.settings?.entrance_fee || 'free');
      
      setEditStartTime(backendEv.start_time ? backendEv.start_time.slice(0, 16) : '');
      setEditEndTime(backendEv.end_time ? backendEv.end_time.slice(0, 16) : '');
      setEditLocation(backendEv.details?.location || '');
      setEditVirtualLink(backendEv.details?.virtual_link || '');
      setEditBannerUrl(backendEv.details?.banner_url || '');
      setEditProfilePictureUrl(backendEv.details?.profile_picture_url || '');
      setEditIsAttendeesPublic(backendEv.settings?.is_attendees_public ?? true);
      setEditIsResultsPublic(backendEv.settings?.is_results_public ?? false);

      if (backendEv.user_role === 'ADMIN' || backendEv.is_registered) {
        getEventRegistrantsApi(numericId)
          .then((data) => setRegistrants([...data].sort((a, b) =>
            Number(a.role.toLowerCase() !== 'admin') - Number(b.role.toLowerCase() !== 'admin') ||
            (a.team_name || 'zzzz').localeCompare(b.team_name || 'zzzz') ||
            new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime()
          )))
          .catch(() => []);
      }
      if (backendEv.id) {
        getPostsApi({ event_id: backendEv.id, post_type: 'announcement_event', status: 'members_only' })
          .then((data) => setAnnouncements([...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())))
          .catch(() => setAnnouncements([]));
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllEventData();
  }, [eventid]);

  const tabOptions: TabOption<TabKey>[] = [
    { key: 'details', label: 'Event Details' },
    { key: 'results', label: '🏆 Standings' },
    { key: 'registrants', label: `Attendees (${registrants.length || eventData?.registrant_count || 0})` },
  ];

  if (isEnrolled) {
    tabOptions.push({ key: 'announcements', label: 'Announcements' });
  }

  if (isAdmin) {
    tabOptions.push({ key: 'settings', label: '⚙️ Settings & Banner' });
  }

  
  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const isTeamEvent = eventData?.settings?.participation_type === 'team';
    if (isTeamEvent && !teamName.trim()) return;
    setIsRegistering(true);
    try {
      const members = teamMembers.map((member) => member.student_id);
      if (teamRegistrationMode === 'extend') {
        if (!members.length) return showNotification('Choose at least one member to add.');
        const res = await addTeamMembersApi(numericId, teamName, members);
        showNotification(res.detail);
      } else {
        const res = await registerEventApi(numericId, isTeamEvent ? teamName.trim() : undefined, isTeamEvent ? members : []);
        showNotification(res.detail);
      }
      setIsRegisterOpen(false);
      setTeamName('');
      setTeamMembers([]);
      loadAllEventData();
    } catch (e: any) {
      showNotification(e.message || 'Failed to register');
    } finally { setIsRegistering(false); }
  };

  const openRegistration = async () => {
    setTeamRegistrationMode('create');
    setTeamName('');
    setTeamMembers([]);
    setIsRegisterOpen(true);
    if (eventData?.settings?.participation_type === 'team' && allUsers.length === 0) {
      setAllUsers(await getUsersApi());
    }
  };

  const openAddTeamMembers = async (existingTeamName: string) => {
    setTeamRegistrationMode('extend');
    setTeamName(existingTeamName);
    setTeamMembers([]);
    setIsRegisterOpen(true);
    if (!allUsers.length) setAllUsers(await getUsersApi());
  };

  const addTeamMember = (member: BackendUser) => {
    if (teamMembers.some((existing) => existing.student_id === member.student_id)) return;
    if (teamMembers.length >= maxSelectableTeamMembers) return showNotification(`Only ${maxSelectableTeamMembers} team seat(s) are available.`);
    if (member.student_id === currentUser?.student_id) return showNotification('You are already the team lead.');
    setTeamMembers((members) => [...members, member]);
    setMemberSearch('');
  };

  const handleAddAdmin = async (member: BackendUser) => {
    try {
      await addEventAdminApi(numericId, member.student_id, adminRole);
      showNotification(`${member.name} added as ${adminRole}.`);
      setAdminSearch(''); setAdminRole('Admin'); loadAllEventData();
    } catch (err: any) { showNotification(err.message || 'Failed to add admin'); }
  };

  const handleRemoveTeam = async (name: string) => {
    if (!window.confirm(`Remove ${name} and all of its members from this event?`)) return;
    try { await removeEventTeamApi(numericId, name); showNotification(`${name} was removed.`); loadAllEventData(); }
    catch (err: any) { showNotification(err.message || 'Failed to remove team'); }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSavingSettings(true);
    try {
      const updated = await updateEventApi(numericId, {
        title: editTitle,
        description: editMarkdown.replace(/[#*_`>\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 240) || editTitle,
        event_type: editType,
        status: editStatus,
        start_time: editStartTime,
        end_time: editEndTime || undefined,
        details: {
          location: editLocation,
          virtual_link: editVirtualLink || null,
          banner_url: editBannerUrl || null,
          profile_picture_url: editProfilePictureUrl || null,
          description_markdown: editMarkdown,
        },
        settings: {
          participation_type: editParticipation as any,
          entrance_fee: editFee,
          is_attendees_public: editIsAttendeesPublic,
          is_results_public: editIsResultsPublic,
        },
      });
      setEventData(updated);
      showNotification('Event updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update event settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePublishResults = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;
    setIsPublishing(true);
    try {
      const updated = await publishEventResultsApi(numericId, resultsInput);
      setEventData(updated);
      showNotification('Results published successfully!');
      setIsPublishResultsOpen(false);
    } catch (err: any) {
      showNotification(err.message || 'Failed to publish results');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm(`Delete “${eventData?.title || 'this event'}”? This cannot be undone.`)) return;
    try {
      await deleteEventApi(numericId);
      navigate('/events');
    } catch (err: any) { showNotification(err.message || 'Failed to delete event'); }
  };

  const handleApproveRegistrant = async (registrantId: number) => {
    if (!isAdmin) return;
    try {
      await updateEventRegistrantApi(numericId, registrantId, { status: 'approved' });
      showNotification('Registrant approved successfully!');
      const updated = await getEventRegistrantsApi(numericId);
      setRegistrants(updated);
    } catch (err: any) {
      showNotification(err.message || 'Failed to approve registrant');
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsPostingAnnounce(true);
    try {
      const announcement = await createPostApi({
        title: announceTitle,
        description: announceContent,
        post_type: 'announcement_event',
        status: 'members_only',
        club_id: eventData?.club_id || undefined,
        event_id: numericId,
      });
      showNotification(announcement.email_notifications_queued
        ? `Announcement posted. Email queued for ${announcement.notification_recipient_count} attendee${announcement.notification_recipient_count === 1 ? '' : 's'}.`
        : `Announcement posted. ${announcement.notification_recipient_count} eligible attendee${announcement.notification_recipient_count === 1 ? '' : 's'} — email is not configured.`);
      setIsPostAnnounceOpen(false);
      setAnnounceTitle('');
      setAnnounceContent('');
      loadAllEventData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to post announcement');
    } finally {
      setIsPostingAnnounce(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-subText text-xs font-mono">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-mainText font-sans pb-16">
      
      
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-accent text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> {notification}
        </div>
      )}

      
      <TopPortion
        bannerUrl={eventData?.details?.banner_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"}
        logoUrl={eventData?.details?.profile_picture_url || "🗓️"}
        name={eventData?.title || "Campus Event"}
        tagline={`Host: ${eventData?.club_title || 'Campus Organization'} • Status: ${eventData?.status?.toUpperCase()}`}
        location={eventData?.details?.location || "Main Auditorium"}
        date={eventData?.start_time ? new Date(eventData.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : undefined}
        time={eventData?.start_time ? new Date(eventData.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : undefined}
        entityType="event"
        userRole={isAdmin ? 'ADMIN' : (eventData?.is_registered ? 'ENROLLED' : 'EXTERNAL')}
        isJoined={eventData?.is_registered}
        onAction={eventData?.is_registered ? undefined : openRegistration}
      />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-5">

        
        <div className="glass-panel mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3">
          <Tabs options={tabOptions} activeTab={activeTab} onChange={(k) => setActiveTab(k)} />
          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setIsPostAnnounceOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Megaphone className="w-3.5 h-3.5" /> + Announcement
              </button>
              <button onClick={handleDeleteEvent} className="px-3.5 py-2 border border-rose-500/40 text-rose-400 font-bold rounded-xl text-xs hover:bg-rose-500/10 transition-all cursor-pointer flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Delete event
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          
          <div className="lg:col-span-8 space-y-6">

            
            {activeTab === 'details' && (
              <div className="space-y-5">
                
                <div className="rounded-2xl border border-customBorder bg-card p-6 space-y-3">
                  <h3 className="text-sm font-bold text-mainText border-b border-customBorder pb-2">
                    Event Overview
                  </h3>
                  <div data-color-mode={theme} className="text-sm">
                    <Suspense fallback={<p className="text-xs text-subText animate-pulse">Loading overview...</p>}>
                      <MarkdownPreview source={eventData?.details?.description_markdown || eventData?.description || ''} className="!bg-transparent !text-mainText text-sm leading-relaxed" />
                    </Suspense>
                  </div>
                </div>

                
                {eventData?.details?.virtual_link && (
                  <div className="rounded-2xl border border-customBorder bg-card p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-accent flex items-center gap-2">
                        <Video className="w-4 h-4" /> Virtual Stream / Link
                      </h4>
                      {isEnrolled ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          ✓ Access Granted
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          🔒 Registered Only
                        </span>
                      )}
                    </div>
                    {isEnrolled ? (
                      <a
                        href={eventData.details.virtual_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-mono text-accent hover:underline bg-primary p-2.5 rounded-xl border border-customBorder"
                      >
                        <ExternalLink className="w-4 h-4" /> {eventData.details.virtual_link}
                      </a>
                    ) : (
                      <p className="text-xs text-subText italic">Register for this event to unlock the stream link.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            
            {activeTab === 'results' && (
              <div className="rounded-2xl border border-customBorder bg-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-customBorder pb-3">
                  <h3 className="text-sm font-bold text-mainText flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" /> Standings
                  </h3>
                </div>

                {eventData?.details?.results ? (
                  <div data-color-mode={theme} className="bg-primary/50 p-5 rounded-2xl border border-customBorder overflow-x-auto">
                    {/^https?:\/\//.test(eventData.details.results) ? (
                      <a href={eventData.details.results} target="_blank" rel="noreferrer" className="btn-secondary w-fit"><ExternalLink className="h-4 w-4" /> Open results file</a>
                    ) : (
                      <Suspense fallback={<p className="text-xs text-subText font-mono animate-pulse">Loading standings...</p>}>
                        <MarkdownPreview source={eventData.details.results} className="!bg-transparent !text-mainText text-sm leading-relaxed" />
                      </Suspense>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-2">
                    <Trophy className="mx-auto text-subText/30 mb-1" size={36} />
                    <p className="text-subText text-xs font-mono">Results have not been published by organizers yet.</p>
                  </div>
                )}
              </div>
            )}

            
            {activeTab === 'registrants' && (
              <div className="rounded-2xl border border-customBorder bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-customBorder pb-3">
                  <h3 className="text-sm font-bold text-mainText flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" /> Registered Participants
                  </h3>
                  <span className="text-xs text-subText font-mono">{registrants.length} Total</span>
                </div>

                {registrants.length === 0 ? (
                  <p className="text-xs text-subText italic py-6 text-center">No registered participants yet.</p>
                ) : (
                  <div className="space-y-5">
                    {registrants.some((r) => r.role.toLowerCase() === 'admin') && <section className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-subText">Admins</h4>
                      <div className="overflow-hidden rounded-xl border border-customBorder bg-card divide-y divide-customBorder/50">
                        {registrants.filter((r) => r.role.toLowerCase() === 'admin').map((admin) => (
                          <div key={admin.id} className="flex items-center justify-between gap-3 px-3 py-3">
                            <Link to={`/profile/${admin.user_id}`} className="flex min-w-0 items-center gap-2 hover:text-accent" title={`View ${admin.name}'s profile`}>
                              <UserAvatar name={admin.name} src={admin.profile_pic} className="h-8 w-8 rounded-full border border-customBorder font-bold text-[10px]" textClassName="text-[10px]" />
                              <span className="min-w-0"><span className="block truncate text-xs font-bold text-mainText">{admin.name}</span><span className="block font-mono text-[10px] text-subText">{admin.user_id}</span></span>
                            </Link>
                            <span className="shrink-0 text-[11px] font-bold text-accent">{admin.team_name?.trim() || 'Admin'}</span>
                          </div>
                        ))}
                      </div>
                    </section>}

                    {attendeeGroups.participants.length > 0 && <section className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-subText">Participants</h4>
                      {attendeeGroups.participants.map((group) => (
                        <div key={`participants-${group.name}`} className="overflow-hidden rounded-xl border border-customBorder bg-card">
                          {eventData?.settings?.participation_type === 'team' ? <>
                            <div className="flex items-center justify-between gap-3 bg-footer px-3 py-2">
                              <span className="text-xs font-bold text-mainText">{group.name}</span>
                              <div className="flex items-center gap-3">
                                {currentTeamMembership?.team_name === group.name && group.members.length < 4 && <button onClick={() => openAddTeamMembers(group.name)} className="text-[10px] font-bold text-accent hover:text-accentHover">Add members ({4 - group.members.length} left)</button>}
                                {isAdmin && <button onClick={() => handleRemoveTeam(group.name)} className="text-[10px] font-bold text-rose-400 hover:text-rose-300">Kick team</button>}
                              </div>
                            </div>
                            <div className={`grid divide-x divide-y divide-customBorder/50 ${group.members.length >= 4 ? 'grid-cols-4' : group.members.length === 3 ? 'grid-cols-3' : group.members.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                              {group.members.slice(0, 4).map((r) => <Link key={r.id} to={`/profile/${r.user_id}`} title={`View ${r.name}'s profile`} className="flex min-w-0 items-center justify-center gap-2 px-3 py-3 hover:bg-primary/60"><UserAvatar name={r.name} src={r.profile_pic} className="h-9 w-9 rounded-full border border-customBorder font-bold text-[10px]" textClassName="text-[10px]" /><span className="truncate font-mono text-[10px] text-subText">{r.user_id}</span></Link>)}
                            </div>
                          </> : <div className="flex items-center gap-3 px-3 py-3"><Link to={`/profile/${group.members[0].user_id}`}><UserAvatar name={group.members[0].name} src={group.members[0].profile_pic} className="h-9 w-9 rounded-full border border-customBorder font-bold text-[10px]" textClassName="text-[10px]" /></Link><span className="text-xs font-bold">{group.members[0].name}</span></div>}
                        </div>
                      ))}
                    </section>}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'announcements' && isEnrolled && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-customBorder bg-card p-4">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 shrink-0 text-accent" />
                    <div>
                      <h3 className="text-sm font-bold text-mainText">Event announcements</h3>
                      <p className="text-xs text-subText">The latest updates from the organizers.</p>
                    </div>
                  </div>
                  {isAdmin && <button onClick={() => setIsPostAnnounceOpen(true)} className="btn-primary shrink-0">+ Announcement</button>}
                </div>
                {announcements.length ? announcements.map((announcement) => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                )) : (
                  <div className="rounded-xl border border-customBorder bg-card p-12 text-center">
                    <Megaphone className="mx-auto mb-2 h-8 w-8 text-subText/30" />
                    <p className="text-xs text-subText">No announcements yet.</p>
                  </div>
                )}
              </div>
            )}

            
            {activeTab === 'settings' && isAdmin && (
              <form onSubmit={handleUpdateSettings} className="space-y-5">
                
                <div className="rounded-2xl border border-customBorder bg-card p-6 space-y-4">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider border-b border-customBorder pb-2 flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5" /> Identity & Content
                  </h3>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-subText uppercase">Banner Image</label>
                    <div className="flex gap-2">
                      <input type="url" placeholder="https://..." value={editBannerUrl} onChange={(e) => setEditBannerUrl(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 text-xs focus:outline-none focus:border-accent" />
                      <input ref={eventBannerRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try { setEditBannerUrl((await uploadFileApi(file)).url); }
                        catch (err) { showNotification(err instanceof Error ? err.message : 'Banner upload failed'); }
                        finally { e.target.value = ''; }
                      }} />
                      <button type="button" onClick={() => eventBannerRef.current?.click()} className="px-3 py-2 bg-footer border border-customBorder text-mainText text-xs font-bold rounded-xl hover:border-accent/40 cursor-pointer" title="Upload banner">📁</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-subText uppercase">Profile Picture</label>
                    <div className="flex gap-2">
                      <input type="url" placeholder="https://..." value={editProfilePictureUrl} onChange={(e) => setEditProfilePictureUrl(e.target.value)} className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 text-xs focus:outline-none focus:border-accent" />
                      <input ref={eventProfilePictureRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try { setEditProfilePictureUrl((await uploadFileApi(file)).url); showNotification('Profile picture uploaded. Save settings to apply it.'); }
                        catch (err) { showNotification(err instanceof Error ? err.message : 'Profile picture upload failed'); }
                        finally { e.target.value = ''; }
                      }} />
                      <button type="button" onClick={() => eventProfilePictureRef.current?.click()} className="px-3 py-2 bg-footer border border-customBorder text-mainText text-xs font-bold rounded-xl hover:border-accent/40 cursor-pointer" title="Upload profile picture">📁</button>
                    </div>
                    {editProfilePictureUrl && <img src={editProfilePictureUrl} alt="Profile preview" className="h-20 w-20 rounded-xl border border-customBorder object-cover" />}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Event Title</label>
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent" required />
                    </div>
                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Event Type</label>
                      <select value={editType} onChange={(e) => setEditType(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent cursor-pointer">
                        {['workshop', 'competition', 'guest-speaker', 'seminar'].map(t => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Status</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent cursor-pointer">
                        {['draft', 'upcoming', 'ongoing', 'completed'].map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-subText uppercase text-xs mb-1">Event Description (Markdown)</label>
                    <div data-color-mode={theme} className="overflow-hidden rounded-xl border border-customBorder">
                      <Suspense fallback={<div className="h-64 bg-primary p-3 text-xs text-subText">Loading editor…</div>}>
                        <MDEditor value={editMarkdown} onChange={(value) => setEditMarkdown(value || '')} preview="edit" height={300} />
                      </Suspense>
                    </div>
                  </div>
                </div>

                
                <div className="rounded-2xl border border-customBorder bg-card p-6 space-y-4">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider border-b border-customBorder pb-2 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Logistics & Location
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Start Date & Time</label>
                      <input type="datetime-local" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent" required />
                    </div>
                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">End Date & Time <span className="text-subText/40 normal-case font-normal">(optional)</span></label>
                      <input type="datetime-local" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Location</label>
                      <input type="text" placeholder="Room 402 or Main Auditorium" value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Virtual Link <span className="text-subText/40 normal-case font-normal">(optional)</span></label>
                      <input type="url" placeholder="https://zoom.us/..." value={editVirtualLink} onChange={(e) => setEditVirtualLink(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-customBorder bg-card p-6 space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-customBorder pb-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Standings</h3>
                      <p className="mt-1 text-[11px] text-subText">Save Markdown standings or upload a results file.</p>
                    </div>
                    <button type="button" onClick={() => setIsPublishResultsOpen(true)} className="btn-secondary">
                      <FileSpreadsheet className="h-4 w-4" /> Manage standings
                    </button>
                  </div>
                  <p className="text-xs text-subText">{eventData?.details?.results ? 'Standings are ready to publish or update.' : 'No standings have been added yet.'}</p>
                </div>

                
                <div className="rounded-2xl border border-customBorder bg-card p-6 space-y-4">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider border-b border-customBorder pb-2 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" /> Privacy & Access
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Entrance Fee</label>
                      <input type="text" placeholder="free or $10" value={editFee} onChange={(e) => setEditFee(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="block font-bold text-subText uppercase mb-1">Participation Type</label>
                      <select value={editParticipation} onChange={(e) => setEditParticipation(e.target.value)}
                        className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent cursor-pointer">
                        <option value="individual">Individual</option>
                        <option value="team">Team</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-1">
                    {([
                      { label: 'Attendees List Visible to Public', key: 'attendees', value: editIsAttendeesPublic, set: setEditIsAttendeesPublic,
                        hint: 'When on, anyone can see who is registered for this event.' },
                      { label: 'Results Visible to Public', key: 'results', value: editIsResultsPublic, set: setEditIsResultsPublic,
                        hint: 'When on, results are shown publicly on the event page.' },
                    ] as const).map(({ label, key, value, set, hint }) => (
                      <div key={key} className="flex items-start justify-between gap-4 p-3 bg-primary rounded-xl border border-customBorder">
                        <div>
                          <p className="text-xs font-bold text-mainText">{label}</p>
                          <p className="text-[10px] text-subText/70 mt-0.5">{hint}</p>
                        </div>
                        <button type="button" onClick={() => set(!value)}
                          className={`w-10 h-5 rounded-full transition-all shrink-0 relative cursor-pointer ${
                            value ? 'bg-accent' : 'bg-footer border border-customBorder'
                          }`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                            value ? 'left-5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={isSavingSettings}
                    className="px-6 py-2.5 bg-accent text-white font-bold text-xs rounded-xl hover:bg-accentHover transition-all cursor-pointer shadow-md disabled:opacity-60">
                    {isSavingSettings ? 'Saving...' : 'Save All Settings'}
                  </button>
                </div>

                {isMainAdmin && (
                  <div className="rounded-2xl border border-customBorder bg-card p-6 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Event admins</h3>
                      <p className="mt-1 text-[11px] text-subText">Assign a role label and give another user event-admin access.</p>
                    </div>
                    <div className="space-y-2">
                      {registrants.filter((r) => r.role.toLowerCase() === 'admin').map((admin) => (
                        <div key={admin.id} className="flex items-center gap-3 rounded-xl border border-customBorder bg-primary p-3">
                          <Link to={`/profile/${admin.user_id}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-[10px] font-bold text-accent">{admin.name.slice(0, 2).toUpperCase()}</Link>
                          <span className="min-w-0 flex-1 truncate text-xs font-bold">{admin.name}</span>
                          <input defaultValue={admin.team_name || 'Admin'} aria-label={`${admin.name}'s role`} className="input-field w-28 py-1.5 text-xs" onBlur={async (e) => {
                            const role = e.target.value.trim() || 'Admin';
                            if (role === (admin.team_name || 'Admin')) return;
                            try { await updateEventRegistrantApi(numericId, admin.id, { team_name: role }); showNotification('Admin role updated.'); loadAllEventData(); }
                            catch (err: any) { showNotification(err.message || 'Failed to update role'); }
                          }} />
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-customBorder bg-footer p-3 space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_9rem]">
                        <input value={adminSearch} onFocus={async () => { if (!allUsers.length) setAllUsers(await getUsersApi()); }} onChange={(e) => setAdminSearch(e.target.value)} className="input-field w-full text-xs" placeholder="Search student ID to add an admin" />
                        <input value={adminRole} onChange={(e) => setAdminRole(e.target.value)} className="input-field w-full text-xs" placeholder="Role (e.g. Lead)" />
                      </div>
                      {adminSearch.trim() && <div className="max-h-32 overflow-y-auto rounded-lg border border-customBorder bg-card">{allUsers.filter((u) => u.student_id.includes(adminSearch.trim())).slice(0, 5).map((u) => <button type="button" key={u.student_id} onClick={() => handleAddAdmin(u)} className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-primary"><span>{u.name}</span><span className="font-mono text-subText">{u.student_id}</span></button>)}</div>}
                    </div>
                  </div>
                )}
              </form>
            )}

          </div>

          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-5 self-start">
            <div className="rounded-2xl border border-customBorder bg-card p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-mainText border-b border-customBorder pb-2">
                Event Logistics
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2.5 text-subText">
                  <Calendar className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-subText/70">Start</span>
                    <strong className="text-mainText">
                      {eventData?.start_time ? new Date(eventData.start_time).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : 'TBA'}
                    </strong>
                  </div>
                </div>

                {eventData?.end_time && (
                  <div className="flex items-center gap-2.5 text-subText">
                    <Clock className="w-4 h-4 text-accent shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-subText/70">End</span>
                      <strong className="text-mainText">
                        {new Date(eventData.end_time).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5 text-subText">
                  <MapPin className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-subText/70">Location</span>
                    <strong className="text-mainText">{eventData?.details?.location || 'TBA'}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-subText">
                  <Ticket className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-subText/70">Entrance Fee</span>
                    <strong className="text-emerald-400 capitalize">{eventData?.settings?.entrance_fee || 'free'}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-subText">
                  <Tag className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-subText/70">Format</span>
                    <span className="capitalize font-bold text-mainText">{eventData?.event_type}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsRegisterOpen(false)} />
          <form onSubmit={handleRegister} className="relative z-10 w-full max-w-md space-y-4 rounded-2xl border border-customBorder bg-card p-6 shadow-2xl">
            <div className="border-b border-customBorder pb-3">
              <h3 className="text-sm font-bold text-mainText">{teamRegistrationMode === 'extend' ? `Add members to ${teamName}` : `Register for ${eventData?.title}`}</h3>
              <p className="mt-1 text-xs text-subText">{teamRegistrationMode === 'extend' ? 'The selected users will be registered together under this same team name.' : eventData?.settings?.participation_type === 'team' ? 'Create a team and add members by student ID.' : 'Your registration will be submitted immediately.'}</p>
            </div>
            {eventData?.settings?.participation_type === 'team' && <>
              {teamRegistrationMode === 'create' && <div>
                <label className="mb-1 block text-xs font-bold uppercase text-subText">Team name</label>
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} required className="input-field w-full text-sm" placeholder="e.g. Byte Builders" />
              </div>}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-subText">Add members <span className="normal-case font-medium">({teamRegistrationMode === 'extend' ? currentTeamSize + teamMembers.length : teamMembers.length + 1}/4)</span></label>
                <input value={memberSearch} onFocus={async () => { if (!allUsers.length) setAllUsers(await getUsersApi()); }} onChange={(e) => setMemberSearch(e.target.value)} disabled={teamMembers.length >= maxSelectableTeamMembers} className="input-field w-full text-sm" placeholder="Search by student ID" />
                {memberSearch.trim() && teamMembers.length < maxSelectableTeamMembers && (
                  <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-customBorder bg-primary">
                    {allUsers.filter((user) => user.student_id.includes(memberSearch.trim()) && user.student_id !== currentUser?.student_id && !registrants.some((registrant) => registrant.user_id === user.student_id) && !teamMembers.some((member) => member.student_id === user.student_id)).slice(0, 5).map((user) => (
                      <button type="button" key={user.student_id} onClick={() => addTeamMember(user)} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs hover:bg-footer">
                        <span className="font-bold text-mainText">{user.name}</span><span className="font-mono text-subText">{user.student_id}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {teamRegistrationMode === 'create' && <div className="flex min-w-0 items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-2 text-xs"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">{currentUser?.name?.slice(0, 2).toUpperCase() || 'ME'}</span><span className="truncate font-bold">You</span></div>}
                  {teamMembers.map((member) => <div key={member.student_id} className="flex min-w-0 items-center gap-1 rounded-lg border border-customBorder bg-primary p-2 text-xs"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card text-[9px] font-bold text-accent">{member.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1 truncate">{member.name}</span><button type="button" onClick={() => setTeamMembers((members) => members.filter((item) => item.student_id !== member.student_id))} className="text-subText hover:text-rose-400">×</button></div>)}
                </div>
              </div>
            </>}
            <div className="flex justify-end gap-2 border-t border-customBorder pt-3">
              <button type="button" onClick={() => setIsRegisterOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isRegistering} className="btn-primary">{isRegistering ? 'Saving...' : teamRegistrationMode === 'extend' ? 'Add selected members' : eventData?.settings?.participation_type === 'team' ? 'Register team' : 'Register'}</button>
            </div>
          </form>
        </div>
      )}

      
      {isPublishResultsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPublishResultsOpen(false)} />
          <div className="relative w-full max-w-2xl bg-card rounded-2xl p-6 border border-customBorder shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-customBorder pb-3">
              <h3 className="text-sm font-bold text-mainText flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> Manage Standings
              </h3>
              <button onClick={() => setIsPublishResultsOpen(false)} className="text-subText hover:text-mainText text-sm">✕</button>
            </div>

            <div className="space-y-4">
              <CsvResultsUploader
                onResultsExtracted={(mdTable) => setResultsInput(mdTable)}
                initialMarkdown={resultsInput}
              />

              <div className="flex items-center gap-3 rounded-xl border border-customBorder bg-footer p-3">
                <input ref={resultsFileRef} type="file" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setResultsInput((await uploadFileApi(file)).url);
                    showNotification('Results file uploaded. Publish standings to save it.');
                  } catch (err) {
                    showNotification(err instanceof Error ? err.message : 'Results file upload failed');
                  } finally { e.target.value = ''; }
                }} />
                <button type="button" onClick={() => resultsFileRef.current?.click()} className="btn-secondary"><Upload className="h-4 w-4" /> Upload results file</button>
                <span className="text-[11px] text-subText">CSV uploads can also be converted to Markdown above.</span>
              </div>

              <form onSubmit={handlePublishResults} className="space-y-3 text-xs pt-3 border-t border-customBorder">
                <div>
                  <label className="block font-bold text-subText mb-1 uppercase">Markdown standings or file URL</label>
                  <textarea
                    placeholder="🥇 1st Place: Team Alpha&#10;🥈 2nd Place: Team Beta"
                    value={resultsInput}
                    onChange={(e) => setResultsInput(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:border-accent font-mono text-xs"
                    rows={6}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-customBorder">
                  <button type="button" onClick={() => setIsPublishResultsOpen(false)} className="px-4 py-2 bg-footer text-mainText rounded-xl font-bold">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPublishing} className="px-5 py-2 bg-accent text-white font-bold rounded-xl shadow-sm">
                    {isPublishing ? 'Publishing...' : 'Publish Results'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      
      {isPostAnnounceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPostAnnounceOpen(false)} />
          <div className="relative w-full max-w-3xl bg-card rounded-2xl p-6 border border-customBorder shadow-2xl z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-customBorder pb-3">
              <h3 className="text-sm font-bold text-mainText flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-accent" /> Post Event Announcement
              </h3>
              <button onClick={() => setIsPostAnnounceOpen(false)} className="text-subText hover:text-mainText text-sm">✕</button>
            </div>
            <form onSubmit={handlePostAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Header</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule Update or Room Change"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Message (Markdown supported)</label>
                <Suspense fallback={<div className="h-52 animate-pulse rounded-xl bg-primary" />}>
                  <MDEditor value={announceContent} onChange={(value) => setAnnounceContent(value || '')} preview="live" height={240} data-color-mode={theme} />
                </Suspense>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-customBorder">
                <button type="button" onClick={() => setIsPostAnnounceOpen(false)} className="px-4 py-2 bg-footer text-mainText rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={isPostingAnnounce} className="px-5 py-2 bg-accent text-white rounded-xl font-bold shadow-sm">
                  {isPostingAnnounce ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Event;
