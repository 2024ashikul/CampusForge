import React, { useState } from 'react';
import { 
  Plus, FileText, Users, Settings, X, Trash2, 
  Trophy, Calendar, Clock, MapPin, Link2, 
  Users2, Eye, ShieldAlert, FileEdit, HelpCircle
} from 'lucide-react';

// --- TYPE INTERFACES ALIGNED WITH YOUR RICH DATA ---
interface Registrant {
  id: string;
  name: string;
  department: string;
  teamName: string;
}

interface Announcement {
  id: string;
  date: string;
  author: string;
  content: string;
  imageUrl?: string;
  ctaLink?: { label: string; url: string };
}

interface EventData {
  id: string;
  type: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  logoUrl: string;
  bannerUrl: string;
  tagline: string;
  title: string;
  clubName: string;
  date: string;
  time: string;
  location: string;
  virtualLink?: string;
  spotsLeft: number;
  totalSpots: number;
  registrants: Registrant[];
  descriptionMarkdown: string;
  announcements: Announcement[];
}

interface EditEventProps {
  eventData: EventData;
  onUpdateEvent: (updatedData: EventData) => void;
  onAddAnnouncement: (newAnnouncement: Omit<Announcement, 'id' | 'date'>) => void;
  onRemoveRegistrant: (registrantId: string) => void;
  onToggleLeaderboardPublish: (isPublished: boolean) => void;
  isLeaderboardPublishedStatus: boolean;
}

export const EditEvent: React.FC<EditEventProps> = ({
  eventData,
  onUpdateEvent,
  onAddAnnouncement,
  onRemoveRegistrant,
  onToggleLeaderboardPublish,
  isLeaderboardPublishedStatus
}) => {
  // Modal Management Controls
  const [activeModal, setActiveModal] = useState<'announcement' | 'participants' | 'leaderboard' | null>(null);

  // Core Form Controls
  const [settings, setSettings] = useState<EventData>({ ...eventData });

  // Announcement Form Sub-state
  const [announcementForm, setAnnouncementForm] = useState({
    author: 'Organizer Panel',
    content: '',
    imageUrl: '',
    ctaLabel: '',
    ctaUrl: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;
    setSettings(prev => ({ ...prev, [name]: numValue }));
  };

  const saveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEvent(settings);
    alert('Event profile configurations synchronized successfully!');
  };

  const submitAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Structure optional call to actions if fields contain values
    const ctaLink = announcementForm.ctaLabel && announcementForm.ctaUrl 
      ? { label: announcementForm.ctaLabel, url: announcementForm.ctaUrl }
      : undefined;

    onAddAnnouncement({
      author: announcementForm.author,
      content: announcementForm.content,
      imageUrl: announcementForm.imageUrl || undefined,
      ctaLink
    });

    setActiveModal(null);
    setAnnouncementForm({ author: 'Organizer Panel', content: '', imageUrl: '', ctaLabel: '', ctaUrl: '' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. MANAGEMENT CONSOLE TOOLBAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* ACTION: ANNOUNCEMENTS */}
        <button 
          onClick={() => setActiveModal('announcement')}
          className="flex items-center justify-between p-5 bg-card border border-customBorder hover:border-accent/40 rounded-xl transition-all group text-left cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary text-accent rounded-lg border border-customBorder group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-mainText">Dispatch Announcement</h4>
              <p className="text-xs text-subText mt-0.5">Broadcast push logs to timeline</p>
            </div>
          </div>
          <Plus className="w-5 h-5 text-subText group-hover:text-accent transition-colors" />
        </button>

        {/* ACTION: LEADERBOARD PERMISSIONS */}
        <button 
          onClick={() => setActiveModal('leaderboard')}
          className={`flex items-center justify-between p-5 bg-card border rounded-xl transition-all group text-left cursor-pointer ${
            isLeaderboardPublishedStatus ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-customBorder hover:border-accent/40'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`p-3 bg-primary rounded-lg border border-customBorder group-hover:scale-105 transition-transform ${
              isLeaderboardPublishedStatus ? 'text-emerald-400' : 'text-accent'
            }`}>
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-mainText flex items-center gap-1.5">
                Leaderboard Console
                <span className={`w-2 h-2 rounded-full inline-block ${isLeaderboardPublishedStatus ? 'bg-emerald-400 animate-pulse' : 'bg-subText/40'}`} />
              </h4>
              <p className="text-xs text-subText mt-0.5">
                {isLeaderboardPublishedStatus ? 'Scores are live and public' : 'Scores are private / hidden'}
              </p>
            </div>
          </div>
          <Eye className="w-5 h-5 text-subText group-hover:text-accent transition-colors" />
        </button>

        {/* ACTION: PARTICIPANTS REGISTER */}
        <button 
          onClick={() => setActiveModal('participants')}
          className="flex items-center justify-between p-5 bg-card border border-customBorder hover:border-accent/40 rounded-xl transition-all group text-left cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary text-accent rounded-lg border border-customBorder group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-mainText">Audit Registrants</h4>
              <p className="text-xs text-subText mt-0.5">Manage {eventData.registrants.length} active event records</p>
            </div>
          </div>
          <Plus className="w-5 h-5 text-subText group-hover:text-accent transition-colors" />
        </button>

      </div>

      {/* 2. MAIN REGISTRY CONFIGURATIONS CARD */}
      <div className="bg-card border border-customBorder rounded-xl p-6">
        <div className="flex items-center space-x-2 pb-4 mb-6 border-b border-customBorder">
          <Settings className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-mainText">Event System Core Registry</h3>
        </div>

        <form onSubmit={saveGeneralSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Field: Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-subText flex items-center gap-1.5"><FileEdit className="w-3 h-3"/> Event System Title</label>
              <input 
                type="text" name="title" value={settings.title} onChange={handleInputChange}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" required
              />
            </div>

            {/* Field: Tagline */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-subText flex items-center gap-1.5"><HelpCircle className="w-3 h-3"/> Event Tagline / Purpose</label>
              <input 
                type="text" name="tagline" value={settings.tagline} onChange={handleInputChange}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" 
                placeholder="e.g. Build, Deploy, and Pitch in 24 Hours"
              />
            </div>

            {/* Field: Date Parameter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-subText flex items-center gap-1.5"><Calendar className="w-3 h-3"/> Calendar Execution Date</label>
              <input 
                type="text" name="date" value={settings.date} onChange={handleInputChange}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" required
                placeholder="e.g. June 05, 2026"
              />
            </div>

            {/* Field: Time Interval */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-subText flex items-center gap-1.5"><Clock className="w-3 h-3"/> Runtime Clock Window</label>
              <input 
                type="text" name="time" value={settings.time} onChange={handleInputChange}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" required
                placeholder="e.g. 9:00 AM (Fri) - 5:00 PM (Sat)"
              />
            </div>

            {/* Field: Location Anchor */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-subText flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Structural Physical Location</label>
              <input 
                type="text" name="location" value={settings.location} onChange={handleInputChange}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" required
              />
            </div>

            {/* Field: Virtual Mirror Link */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-subText flex items-center gap-1.5"><Link2 className="w-3 h-3"/> Streaming / Virtual Mirror Node Link</label>
              <input 
                type="url" name="virtualLink" value={settings.virtualLink || ''} onChange={handleInputChange}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText font-mono focus:outline-hidden transition-colors"
                placeholder="https://discord.gg/..."
              />
            </div>

            {/* Field: Capacity Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-subText">Total Seat Allocations</label>
                <input 
                  type="number" name="totalSpots" value={settings.totalSpots} onChange={handleNumberChange}
                  className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" min="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-subText">Remaining / Open Seats</label>
                <input 
                  type="number" name="spotsLeft" value={settings.spotsLeft} onChange={handleNumberChange}
                  className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            {/* Field: Event Phase Status */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-subText">Operational Event Status Lifecycle</label>
              <select 
                name="status" value={settings.status} onChange={handleInputChange}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors"
              >
                <option value="upcoming">Upcoming (Accepting Inbound Registrations)</option>
                <option value="ongoing">Ongoing (Locked System / Active Execution)</option>
                <option value="completed">Completed (Archived / Display Leaderboards)</option>
              </select>
            </div>

            {/* Field: Description Content */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-subText">Comprehensive Markdown Specification Document</label>
              <textarea 
                name="descriptionMarkdown" value={settings.descriptionMarkdown} onChange={handleInputChange} rows={5}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText leading-relaxed focus:outline-hidden transition-colors resize-y" required
              />
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-customBorder">
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-accent hover:bg-accentHover text-primary font-bold rounded-lg text-sm transition-all cursor-pointer transform active:scale-95 shadow-md shadow-accent/5"
            >
              Update Event Blueprint
            </button>
          </div>
        </form>
      </div>

      {/* ================= MODAL MATRIX CONSOLE ================= */}

      {/* MODAL 1: CREATE ANNOUNCEMENT */}
      {activeModal === 'announcement' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-card border border-customBorder w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-scaleUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-customBorder bg-primary/40">
              <h3 className="font-bold text-mainText flex items-center gap-2"><FileText className="w-4 h-4 text-accent" /> Dispatch Immediate Event Announcement</h3>
              <button onClick={() => setActiveModal(null)} className="text-subText hover:text-mainText cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={submitAnnouncement} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-subText">Author Signature Signature</label>
                <input type="text" required value={announcementForm.author} onChange={e => setAnnouncementForm({...announcementForm, author: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-subText">Broadcast Payload Content</label>
                <textarea required rows={4} value={announcementForm.content} onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText leading-relaxed focus:outline-hidden" placeholder="Type core updates, changes, alerts, or links here..." />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-subText">Optional Banner Asset Image URL</label>
                <input type="url" value={announcementForm.imageUrl} onChange={e => setAnnouncementForm({...announcementForm, imageUrl: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden font-mono" placeholder="https://images.unsplash.com/..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-subText">CTA Action Button Label</label>
                  <input type="text" value={announcementForm.ctaLabel} onChange={e => setAnnouncementForm({...announcementForm, ctaLabel: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden" placeholder="e.g. View Leaderboard" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-subText">CTA Execution Destination URL</label>
                  <input type="url" value={announcementForm.ctaUrl} onChange={e => setAnnouncementForm({...announcementForm, ctaUrl: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden font-mono" placeholder="https://..." />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-customBorder">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-primary text-subText rounded-lg text-xs font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-accent text-primary font-bold rounded-lg text-xs hover:bg-accentHover cursor-pointer">Push Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE AND AUDIT EVENT REGISTRANTS */}
      {activeModal === 'participants' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-card border border-customBorder w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scaleUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-customBorder bg-primary/40">
              <h3 className="font-bold text-mainText flex items-center gap-2"><Users2 className="w-4 h-4 text-accent" /> Inbound Roster Audit System</h3>
              <button onClick={() => setActiveModal(null)} className="text-subText hover:text-mainText cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {eventData.registrants.length === 0 ? (
                <div className="text-center py-8 text-subText text-xs">No active registrations indexed for this node.</div>
              ) : (
                eventData.registrants.map(registrant => (
                  <div key={registrant.id} className="bg-primary/40 border border-customBorder rounded-xl p-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-mainText">{registrant.name}</div>
                      <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap text-xs text-subText mt-0.5">
                        <span className="text-accent/80 font-medium">{registrant.teamName}</span>
                        <span>•</span>
                        <span>{registrant.department}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-subText/60">{registrant.id}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if(confirm(`Sever alignment record and remove ${registrant.name}?`)) {
                          onRemoveRegistrant(registrant.id);
                        }
                      }}
                      title="Void Registration Node"
                      className="p-2 border border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-primary/20 border-t border-customBorder flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-5 py-2 bg-primary hover:bg-primary/80 border border-customBorder text-mainText rounded-lg text-xs font-bold cursor-pointer">Close Registry</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LEADERBOARD VISIBILITY GATEKEEPER */}
      {activeModal === 'leaderboard' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-card border border-customBorder w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-scaleUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-customBorder bg-primary/40">
              <h3 className="font-bold text-mainText flex items-center gap-2"><Trophy className="w-4 h-4 text-accent" /> Scoreboard Release Protocol</h3>
              <button onClick={() => setActiveModal(null)} className="text-subText hover:text-mainText cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-start space-x-3 bg-primary/40 border border-customBorder p-4 rounded-xl">
                <ShieldAlert className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isLeaderboardPublishedStatus ? 'text-emerald-400' : 'text-amber-400'}`} />
                <div className="text-xs space-y-1">
                  <h5 className="font-bold text-mainText">Current Visibility Pipeline State:</h5>
                  <p className="text-subText leading-relaxed">
                    {isLeaderboardPublishedStatus 
                      ? "The scoreboard array matrix is completely open and public. General participants can see rankings and podium positions."
                      : "The leaderboard configuration is locked. Only administrators, advisors, and jury nodes can review raw scores."
                    }
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-primary/20 border border-dashed border-customBorder rounded-xl gap-3">
                <span className="text-xs text-subText font-medium">Toggle Public Pipeline Permissions</span>
                
                <button
                  type="button"
                  onClick={() => {
                    onToggleLeaderboardPublish(!isLeaderboardPublishedStatus);
                  }}
                  className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md transform active:scale-95 cursor-pointer ${
                    isLeaderboardPublishedStatus
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-primary shadow-emerald-500/10'
                  }`}
                >
                  {isLeaderboardPublishedStatus ? 'Revoke and Hide Leaderboard' : 'Publish Leaderboard to Main Timeline'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-primary/20 border-t border-customBorder flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-5 py-2 bg-primary border border-customBorder text-mainText rounded-lg text-xs font-bold cursor-pointer">Done</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};