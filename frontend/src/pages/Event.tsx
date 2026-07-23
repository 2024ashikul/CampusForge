import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  Trophy,
  Sparkles,
  Settings,
  CheckCircle,
  Megaphone,
  Loader2,
  ExternalLink,
  Video,
  Check
} from 'lucide-react';
import Tabs, { type TabOption } from '../components/Tabs';
import TopPortion from '../components/TopPortion';
import {
  getEventByIdApi,
  registerEventApi,
  updateEventApi,
  publishEventResultsApi,
  getEventRegistrantsApi,
  updateEventRegistrantApi,
  createPostApi,
  type BackendEvent
} from '../services/api';

type TabKey = 'details' | 'announcements' | 'results' | 'registrants' | 'settings';

interface EventRegistrant {
  id: number;
  user_id: number;
  name: string;
  email: string;
  department: string;
  team_name?: string;
  role: string;
  status: string;
  registered_at: string;
}

export const Event: React.FC = () => {
  const { eventid } = useParams<{ eventid: string }>();
  const numericId = eventid ? parseInt(eventid, 10) : 1;

  const [eventData, setEventData] = useState<BackendEvent | null>(null);
  const [registrants, setRegistrants] = useState<EventRegistrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal States
  const [isPublishResultsOpen, setIsPublishResultsOpen] = useState(false);
  const [isPostAnnounceOpen, setIsPostAnnounceOpen] = useState(false);

  // Publish Results State
  const [resultsInput, setResultsInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Announcement State
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [isPostingAnnounce, setIsPostingAnnounce] = useState(false);

  // Settings State
  const [editTitle, setEditTitle] = useState('');
  const [editShortDesc, setEditShortDesc] = useState('');
  const [editMarkdown, setEditMarkdown] = useState('');
  const [editType, setEditType] = useState('workshop');
  const [editStatus, setEditStatus] = useState('upcoming');
  const [editParticipation, setEditParticipation] = useState('individual');
  const [editFee, setEditFee] = useState('free');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editVirtualLink, setEditVirtualLink] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const userRole = eventData?.user_role || (eventData?.is_registered ? 'ENROLLED' : 'EXTERNAL');
  const isAdmin = userRole === 'ADMIN';
  const isEnrolled = userRole === 'ENROLLED' || isAdmin;

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
      setResultsInput(backendEv.results || '');

      setEditTitle(backendEv.title);
      setEditShortDesc(backendEv.short_description);
      setEditMarkdown(backendEv.description_markdown || backendEv.short_description);
      setEditType(backendEv.event_type || 'workshop');
      setEditStatus(backendEv.status || 'upcoming');
      setEditParticipation(backendEv.participation_type || 'individual');
      setEditFee(backendEv.entrance_fee || 'free');
      setEditDate(backendEv.date);
      setEditTime(backendEv.time);
      setEditLocation(backendEv.location);
      setEditVirtualLink(backendEv.virtual_link || '');

      if (backendEv.user_role === 'ADMIN' || backendEv.is_registered) {
        getEventRegistrantsApi(numericId)
          .then(setRegistrants)
          .catch(() => []);
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
    { key: 'results', label: '🏆 Results & Winners' },
    { key: 'registrants', label: `Registrants (${registrants.length || eventData?.registrant_count || 0})` },
  ];

  if (isEnrolled) {
    tabOptions.push({ key: 'announcements', label: 'Announcements' });
  }

  if (isAdmin) {
    tabOptions.push({ key: 'settings', label: '⚙️ Event Settings' });
  }

  // Handlers
  const handleRegister = async () => {
    try {
      const res = await registerEventApi(numericId);
      showNotification(res.detail);
      loadAllEventData();
    } catch (e: any) {
      showNotification(e.message || 'Failed to register');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSavingSettings(true);
    try {
      const updated = await updateEventApi(numericId, {
        title: editTitle,
        short_description: editShortDesc,
        description_markdown: editMarkdown,
        event_type: editType,
        status: editStatus,
        participation_type: editParticipation,
        entrance_fee: editFee,
        date: editDate,
        time: editTime,
        location: editLocation,
        virtual_link: editVirtualLink,
      });
      setEventData(updated);
      showNotification('Event settings updated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update event settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePublishResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsPublishing(true);
    try {
      const updated = await publishEventResultsApi(numericId, resultsInput);
      setEventData(updated);
      showNotification('Event results published successfully!');
      setIsPublishResultsOpen(false);
    } catch (err: any) {
      showNotification(err.message || 'Failed to publish results');
    } finally {
      setIsPublishing(false);
    }
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
      await createPostApi({
        title: announceTitle,
        description: announceContent,
        post_type: 'announcement',
        club_id: eventData?.club_id || undefined,
      });
      showNotification('Announcement posted!');
      setIsPostAnnounceOpen(false);
      setAnnounceTitle('');
      setAnnounceContent('');
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
          <p className="text-subText text-xs font-mono">Loading event permissions & details...</p>
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
        bannerUrl={eventData?.image_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"}
        logoUrl="🗓️"
        name={eventData?.title || "Campus Event"}
        tagline={`Host: ${eventData?.club_title || 'Campus Organization'} • Status: ${eventData?.status?.toUpperCase()}`}
        location={eventData?.location || "Main Auditorium"}
        founded="2026"
        date={eventData?.date}
        time={eventData?.time}
        memberType={eventData?.is_registered ? 'member' : 'non_member'}
        isJoined={eventData?.is_registered}
        onJoin={handleRegister}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-6">

        {/* Navigation Tabs + Admin Quick Actions */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Tabs options={tabOptions} activeTab={activeTab} onChange={(k) => setActiveTab(k)} />
          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setIsPublishResultsOpen(true)}
                className="px-3.5 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5" /> 🏆 Publish Results
              </button>
              <button
                onClick={() => setIsPostAnnounceOpen(true)}
                className="px-3.5 py-2 bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold rounded-xl text-xs hover:bg-purple-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Megaphone className="w-3.5 h-3.5" /> + Announcement
              </button>
            </div>
          )}
        </div>

        {/* TAB CONTENTS */}
        <div className="space-y-6">

          {/* 1. EVENT DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <div className="glass-panel rounded-2xl p-6 border border-customBorder space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-subText">Event Description</h3>
                  <p className="text-sm text-mainText/90 leading-relaxed font-sans">{eventData?.short_description}</p>

                  {eventData?.description_markdown && (
                    <div className="bg-primary/50 p-4 rounded-xl border border-customBorder text-xs leading-relaxed text-subText font-mono">
                      {eventData.description_markdown}
                    </div>
                  )}
                </div>

                {/* Virtual Link Section (Protected for Enrolled & Admin) */}
                {eventData?.virtual_link && (
                  <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                        <Video className="w-4 h-4 text-cyan-400" /> Virtual Stream / Discord Link
                      </h4>
                      {isEnrolled ? (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          ✓ Access Granted
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          🔒 Enrolled Only
                        </span>
                      )}
                    </div>
                    {isEnrolled ? (
                      <a
                        href={eventData.virtual_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-mono text-cyan-300 hover:underline bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/40"
                      >
                        <ExternalLink className="w-4 h-4" /> {eventData.virtual_link}
                      </a>
                    ) : (
                      <p className="text-xs text-subText italic">Register for this event to view the virtual stream link.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Event Metadata Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                <div className="glass-panel rounded-2xl p-5 border border-customBorder space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-subText">Event Details</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-customBorder/40">
                      <span className="text-subText">Event Type</span>
                      <span className="font-mono text-accent uppercase">{eventData?.event_type}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-customBorder/40">
                      <span className="text-subText">Status</span>
                      <span className="font-mono text-emerald-400 uppercase">{eventData?.status}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-customBorder/40">
                      <span className="text-subText">Participation</span>
                      <span className="font-mono text-mainText capitalize">{eventData?.participation_type}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-subText">Entrance Fee</span>
                      <span className="font-mono text-accent">{eventData?.entrance_fee}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. RESULTS & WINNERS TAB */}
          {activeTab === 'results' && (
            <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-customBorder pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2 glow-text">
                  <Trophy className="w-5 h-5 text-amber-400" /> Official Competition Results & Standings
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => setIsPublishResultsOpen(true)}
                    className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    🏆 Edit / Publish Results
                  </button>
                )}
              </div>

              {eventData?.results ? (
                <div className="bg-primary/50 p-5 rounded-2xl border border-amber-500/20 text-xs text-mainText leading-relaxed space-y-2 font-mono whitespace-pre-wrap">
                  {eventData.results}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="mx-auto text-subText/30 mb-2" size={32} />
                  <p className="text-subText text-xs font-mono">Results have not been published by event admins yet.</p>
                </div>
              )}
            </div>
          )}

          {/* 3. REGISTRANTS / ATTENDEES TAB */}
          {activeTab === 'registrants' && (
            <div className="glass-panel rounded-2xl p-6 border border-customBorder space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-subText flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" /> Registered Participants
                </h3>
                <span className="text-xs font-mono text-accent">{registrants.length} Total</span>
              </div>

              {registrants.length === 0 ? (
                <p className="text-xs text-subText italic">No registered participants recorded.</p>
              ) : (
                <div className="divide-y divide-customBorder/40">
                  {registrants.map((r) => (
                    <div key={r.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-cyan-500/30 border border-customBorder flex items-center justify-center font-bold text-accent text-sm">
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-mainText">{r.name}</h4>
                            {r.team_name && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
                                Team: {r.team_name}
                              </span>
                            )}
                            {r.role === 'Admin' && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                👑 Admin
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-subText font-mono">{r.email} • {r.department}</span>
                        </div>
                      </div>

                      {isAdmin && r.status === 'pending' && (
                        <button
                          onClick={() => handleApproveRegistrant(r.id)}
                          className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg hover:bg-emerald-500/30 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve Registration
                        </button>
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
                    onClick={() => setIsPostAnnounceOpen(true)}
                    className="px-4 py-2 bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:bg-purple-600/40"
                  >
                    <Megaphone className="w-4 h-4" /> Post Event Announcement
                  </button>
                </div>
              )}

              <div className="glass-panel text-center py-12 rounded-2xl border border-customBorder">
                <p className="text-subText text-xs font-mono">Announcements will appear here when posted by organizers.</p>
              </div>
            </div>
          )}

          {/* 5. ⚙️ ADMIN EVENT SETTINGS TAB */}
          {activeTab === 'settings' && isAdmin && (
            <form onSubmit={handleUpdateSettings} className="glass-panel rounded-2xl p-6 border border-customBorder space-y-6">
              <div className="border-b border-customBorder pb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-mainText flex items-center gap-2">
                  <Settings className="w-4 h-4 text-accent" /> Manage Event Configurations
                </h3>
                <p className="text-xs text-subText mt-1">Update event schedule, location, virtual links, and participation rules.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Event Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Entrance Fee</label>
                  <input
                    type="text"
                    value={editFee}
                    onChange={(e) => setEditFee(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Date</label>
                  <input
                    type="text"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Time</label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Physical Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Virtual Stream / Discord Link</label>
                  <input
                    type="text"
                    value={editVirtualLink}
                    onChange={(e) => setEditVirtualLink(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Event Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="competition">Competition / Hackathon</option>
                    <option value="guest-speaker">Guest Speaker</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Event Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-subText uppercase text-xs mb-1">Short Summary</label>
                <textarea
                  value={editShortDesc}
                  onChange={(e) => setEditShortDesc(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                  rows={3}
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

      {/* PUBLISH RESULTS MODAL FOR ADMIN */}
      {isPublishResultsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPublishResultsOpen(false)} />
          <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 border border-amber-500/40 shadow-2xl z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-customBorder pb-3">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> Publish Competition Results & Winners
              </h3>
              <button onClick={() => setIsPublishResultsOpen(false)} className="text-subText hover:text-mainText text-sm">✕</button>
            </div>
            <form onSubmit={handlePublishResults} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Results Summary & Winners List</label>
                <textarea
                  placeholder="🥇 1st Place: Team Alpha&#10;🥈 2nd Place: Team Beta&#10;🥉 3rd Place: Solo Prototype"
                  value={resultsInput}
                  onChange={(e) => setResultsInput(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                  rows={6}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-customBorder">
                <button type="button" onClick={() => setIsPublishResultsOpen(false)} className="px-4 py-2 bg-footer text-mainText rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={isPublishing} className="px-5 py-2 bg-amber-500 text-primary font-black rounded-xl shadow-md">
                  {isPublishing ? 'Publishing...' : 'Publish Results'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST ANNOUNCEMENT MODAL FOR ADMIN */}
      {isPostAnnounceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPostAnnounceOpen(false)} />
          <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-purple-500/30 shadow-2xl z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-customBorder pb-3">
              <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-purple-400" /> Post Event Announcement
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
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-subText mb-1 uppercase">Announcement Message</label>
                <textarea
                  placeholder="Write event announcement details..."
                  value={announceContent}
                  onChange={(e) => setAnnounceContent(e.target.value)}
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-customBorder">
                <button type="button" onClick={() => setIsPostAnnounceOpen(false)} className="px-4 py-2 bg-footer text-mainText rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={isPostingAnnounce} className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold shadow-md">
                  {isPostingAnnounce ? 'Posting...' : 'Broadcast Announcement'}
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