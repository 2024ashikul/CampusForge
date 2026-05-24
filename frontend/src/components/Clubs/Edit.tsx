import React, { useState } from 'react';
import { 
  Plus, Calendar, FileText, Users, Settings, 
  X, Trash2, Shield, ShieldAlert, MapPin, 
  Clock, Info, Image, Type, Users2 
} from 'lucide-react';

// --- EXPANDED INTERFACES FROM YOUR CONFIGURATION ---
interface Club {
  name: string;
  tagline: string;
  description: string;
  bannerUrl: string;
  logoUrl: string;
  location: string;
  founded: string;
  memberCount: number;
  eventCount: number;
  postCount: number;
}

interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'In-person' | 'Virtual';
  location: string;
  spotsLeft: number;
  availability: string; // Added custom field requirement
}

interface Post {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
}

interface Participant {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isLead: boolean;
}

interface EditClubProps {
  clubData: Club;
  onUpdateClub: (updatedData: Club) => void;
  onAddEvent: (newEvent: Omit<ClubEvent, 'id'>) => void;
  onAddPost: (newPost: Omit<Post, 'id' | 'date' | 'author'>) => void;
  members: Participant[];
  onKickMember: (memberId: string) => void;
  onToggleRole: (memberId: string) => void;
}

export const EditClub: React.FC<EditClubProps> = ({
  clubData,
  onUpdateClub,
  onAddEvent,
  onAddPost,
  members,
  onKickMember,
  onToggleRole
}) => {
  // Modal toggles
  const [activeModal, setActiveModal] = useState<'event' | 'post' | 'members' | null>(null);

  // Settings Forms State
  const [settings, setSettings] = useState<Club>({ ...clubData });

  // Form State: Event Modal
  const [eventForm, setEventForm] = useState<Omit<ClubEvent, 'id'>>({
    title: '',
    date: '',
    time: '',
    type: 'In-person',
    location: '',
    spotsLeft: 30,
    availability: 'Open to All'
  });

  // Form State: Post/Announcement Modal
  const [postForm, setPostForm] = useState({
    title: '',
    excerpt: '',
    category: 'Announcement'
  });

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const saveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClub(settings);
    alert('Club profile settings saved safely!');
  };

  const submitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEvent(eventForm);
    setActiveModal(null);
    // Reset form
    setEventForm({ title: '', date: '', time: '', type: 'In-person', location: '', spotsLeft: 30, availability: 'Open to All' });
  };

  const submitPost = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPost(postForm);
    setActiveModal(null);
    setPostForm({ title: '', excerpt: '', category: 'Announcement' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* QUICK ACTIONS TOOLBAR GRID */}
      <div className="grid grid-cols-1  gap-4">
        
        <button 
          onClick={() => setActiveModal('event')}
          className="flex items-center justify-between p-5 bg-card border border-customBorder hover:border-accent/40 rounded-xl transition-all group text-left cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary text-accent rounded-lg border border-customBorder group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-mainText">Create New Event</h4>
              <p className="text-xs text-subText mt-0.5">Schedule workshops or hack nights</p>
            </div>
          </div>
          <Plus className="w-5 h-5 text-subText group-hover:text-accent transition-colors" />
        </button>

        <button 
          onClick={() => setActiveModal('post')}
          className="flex items-center justify-between p-5 bg-card border border-customBorder hover:border-accent/40 rounded-xl transition-all group text-left cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary text-accent rounded-lg border border-customBorder group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-mainText">Post Announcement</h4>
              <p className="text-xs text-subText mt-0.5">Publish logs, news, and updates</p>
            </div>
          </div>
          <Plus className="w-5 h-5 text-subText group-hover:text-accent transition-colors" />
        </button>

        <button 
          onClick={() => setActiveModal('members')}
          className="flex items-center justify-between p-5 bg-card border border-customBorder hover:border-accent/40 rounded-xl transition-all group text-left cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary text-accent rounded-lg border border-customBorder group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-mainText">Manage Members</h4>
              <p className="text-xs text-subText mt-0.5">Promote roles or audit rosters</p>
            </div>
          </div>
          <Plus className="w-5 h-5 text-subText group-hover:text-accent transition-colors" />
        </button>

      </div>

      {/* DETAILED GENERAL SETTINGS CARD */}
      <div className="bg-card border border-customBorder rounded-xl p-6">
        <div className="flex items-center space-x-2 pb-4 mb-6 border-b border-customBorder">
          <Settings className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-mainText">Core Registry Settings</h3>
        </div>

        <form onSubmit={saveGeneralSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-subText flex items-center gap-1.5"><Type className="w-3 h-3"/> Club Identity Name</label>
              <input 
                type="text" name="name" value={settings.name} onChange={handleSettingsChange}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-subText flex items-center gap-1.5"><Info className="w-3 h-3"/> Mission Tagline</label>
              <input 
                type="text" name="tagline" value={settings.tagline} onChange={handleSettingsChange}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-subText flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Headquarter Location</label>
              <input 
                type="text" name="location" value={settings.location} onChange={handleSettingsChange}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-subText flex items-center gap-1.5"><Clock className="w-3 h-3"/> Registry/Founded Date</label>
              <input 
                type="text" name="founded" value={settings.founded} onChange={handleSettingsChange}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-subText bg-primary/40" disabled
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-subText flex items-center gap-1.5"><Image className="w-3 h-3"/> Banner Image URL</label>
              <input 
                type="url" name="bannerUrl" value={settings.bannerUrl} onChange={handleSettingsChange}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText font-mono focus:outline-hidden transition-colors" required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-subText flex items-center gap-1.5">Extended Markdown Description</label>
              <textarea 
                name="description" value={settings.description} onChange={handleSettingsChange} rows={4}
                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText leading-relaxed focus:outline-hidden transition-colors resize-y" required
              />
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-customBorder">
            <button 
              type="submit" 
              className="px-6 py-2 bg-accent hover:bg-accentHover text-primary font-bold rounded-lg text-sm transition-all cursor-pointer transform active:scale-95 shadow-md shadow-accent/5"
            >
              Save Registry Changes
            </button>
          </div>
        </form>
      </div>


      {/* ================= MODAL WINDOWS SYSTEM ================= */}

      {/* MODAL 1: CREATE EVENT */}
      {activeModal === 'event' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-card border border-customBorder w-full max-w-lg rounded-xl shadow-2xl overflow-hidden scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-customBorder bg-primary/40">
              <h3 className="font-bold text-mainText flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" /> Schedule New Event</h3>
              <button onClick={() => setActiveModal(null)} className="text-subText hover:text-mainText cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={submitEvent} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-subText">Event Title</label>
                <input type="text" required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden" placeholder="e.g., Rust Deep Dive Workshop" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-subText">Date</label>
                  <input type="date" required value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-subText">Time Frame</label>
                  <input type="text" required value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden" placeholder="6:00 PM - 8:00 PM" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-subText">Environment Mode</label>
                  <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value as 'In-person' | 'Virtual'})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden">
                    <option value="In-person">In-person</option>
                    <option value="Virtual">Virtual</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-subText">Total Capacity Spots</label>
                  <input type="number" required value={eventForm.spotsLeft} onChange={e => setEventForm({...eventForm, spotsLeft: parseInt(e.target.value) || 0})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden" min="1" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-subText">Location Pointer / Link</label>
                <input type="text" required value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden" placeholder="Room 201 or Discord Link" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-subText">Accessibility Tier</label>
                <input type="text" required value={eventForm.availability} onChange={e => setEventForm({...eventForm, availability: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden" placeholder="e.g. Open to All, Members Only, Cohort A" />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-customBorder">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-primary hover:bg-primary/80 text-subText rounded-lg text-xs font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-accent text-primary font-bold rounded-lg text-xs hover:bg-accentHover cursor-pointer">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: POST ANNOUNCEMENT */}
      {activeModal === 'post' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-card border border-customBorder w-full max-w-lg rounded-xl shadow-2xl overflow-hidden scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-customBorder bg-primary/40">
              <h3 className="font-bold text-mainText flex items-center gap-2"><FileText className="w-4 h-4 text-accent" /> Dispatch New Document</h3>
              <button onClick={() => setActiveModal(null)} className="text-subText hover:text-mainText cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={submitPost} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-subText">Title</label>
                  <input type="text" required value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden" placeholder="Strategic Launch Phase" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-subText">Group Metric</label>
                  <select value={postForm.category} onChange={e => setPostForm({...postForm, category: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText focus:outline-hidden">
                    <option value="Announcement">Notice</option>
                    <option value="Technical">Technical</option>
                    <option value="Community">Community</option>
                    <option value="Projects">Projects</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-subText">Body Content Excerpt</label>
                <textarea required rows={5} value={postForm.excerpt} onChange={e => setPostForm({...postForm, excerpt: e.target.value})} className="w-full bg-primary border border-customBorder rounded-lg p-2 text-sm text-mainText leading-relaxed focus:outline-hidden" placeholder="Type message parameters here..." />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-customBorder">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-primary hover:bg-primary/80 text-subText rounded-lg text-xs font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-accent text-primary font-bold rounded-lg text-xs hover:bg-accentHover cursor-pointer">Publish Post</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGE MEMBERS ROSTER */}
      {activeModal === 'members' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-card border border-customBorder w-full max-w-xl rounded-xl shadow-2xl overflow-hidden scale-up flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-customBorder bg-primary/40">
              <h3 className="font-bold text-mainText flex items-center gap-2"><Users2 className="w-4 h-4 text-accent" /> Security & Member Roster Operations</h3>
              <button onClick={() => setActiveModal(null)} className="text-subText hover:text-mainText cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
              {members.map(member => (
                <div key={member.id} className="bg-primary/50 border border-customBorder rounded-xl p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      member.isLead ? 'bg-linear-to-b from-accent to-accentHover text-primary' : 'bg-primary text-subText border border-customBorder'
                    }`}>
                      {member.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-mainText flex items-center gap-2">
                        {member.name}
                        {member.isLead && (
                          <span className="text-[8px] bg-accent/10 text-accent border border-accent/20 px-1 rounded font-mono font-black uppercase tracking-wider flex items-center gap-0.5">
                            <Shield className="w-2 h-2 fill-current" /> Core
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-subText">{member.role}</div>
                    </div>
                  </div>

                  {/* Operational Security Options based on Rank Permissions */}
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => onToggleRole(member.id)}
                      title={member.isLead ? "Demote Member Status" : "Promote to Core Lead"}
                      className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                        member.isLead 
                          ? 'border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10' 
                          : 'border-customBorder bg-primary text-subText hover:text-accent hover:border-accent/40'
                      }`}
                    >
                      {member.isLead ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    </button>
                    
                    <button 
                      onClick={() => onKickMember(member.id)}
                      title="Sever Connection / Kick"
                      className="p-2 border border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-primary/20 border-t border-customBorder flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-5 py-2 bg-primary hover:bg-primary/80 border border-customBorder text-mainText rounded-lg text-xs font-bold cursor-pointer">Close Console</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};