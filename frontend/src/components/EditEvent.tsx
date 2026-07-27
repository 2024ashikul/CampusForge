import React, { useState, Suspense } from 'react';
import {
    Plus, FileText, Users, Settings, X, Trash2,
    Calendar, Clock, MapPin, Link2, 
    Users2, ShieldAlert, FileEdit, HelpCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { PostForm } from './Posts/PostForm';


const MDEditor = React.lazy(() => import('@uiw/react-md-editor'));


export interface Announcement {
    id: string;
    date: string;
    author: string;
    content: string;
    imageUrl?: string | null;
    ctaLink?: { label: string; url: string } | null;
}

export interface DiscussionComment {
    id: string;
    user: string;
    role: string;
    avatar: string;
    text: string;
    time: string;
}

interface Registrant {
    id: string;
    name: string;
    department: string;
    teamName: string;
}

export interface EventData {
    id: string;
    type: 'workshop' | 'competition' | 'guest-speaker';
    status: 'upcoming' | 'completed';
    title: string;
    logoUrl: string;
    bannerUrl: string;
    shortDescription: string;
    clubName: string;
    tagline: string;
    tags: string[];
    date: string;
    time: string;
    location: string;
    virtualLink?: string | null;
    spotsLeft: number;
    totalSpots: number;
    registrants: Registrant[];
    settings: {
        isResultsPublished?: boolean;
        isDraft?: boolean;
        isParticipationPubic?: boolean;
        isDiscussionOpen?: boolean;
    };
    descriptionMarkdown: string;
    resultsSpreadsheetUrl?: string | null;
    announcements?: Announcement[] | null;
    discussion: DiscussionComment[] | null;
}

interface EditEventProps {
    eventData: EventData;
    onUpdateEvent: (updatedData: EventData) => void;
    onRemoveRegistrant: (registrantId: string) => void;
    
    themeMode?: 'dark' | 'light'; 
}

export const EditEvent: React.FC<EditEventProps> = ({
    eventData,
    onUpdateEvent,
    onRemoveRegistrant,
    themeMode = 'dark'
}) => {
    
    const [activeModal, setActiveModal] = useState<'announcement' | 'participants' | 'edit-description' | null>(null);

    


    
    const [settings, setSettings] = useState<EventData>({ ...eventData });
    const [temporaryMarkdown, setTemporaryMarkdown] = useState(settings.descriptionMarkdown);

    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = parseInt(value) || 0;
        setSettings(prev => ({ ...prev, [name]: numValue }));
    };

    
    const toggleSettingFlag = (flagName: keyof EventData['settings']) => {
        setSettings(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                [flagName]: !prev.settings[flagName]
            }
        }));
    };

    
    const saveAllConfigurations = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateEvent(settings);
        alert('All master structural profile configurations updated securely!');
    };

    
    const saveDescriptionMarkdownModal = () => {
        setSettings(prev => ({ ...prev, descriptionMarkdown: temporaryMarkdown }));
        setActiveModal(null);
        alert('Markdown cache saved to memory bucket. Click Update Event Blueprint below to broadcast live.');
    };

    return (
        <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto p-1 text-mainText">

            {}
            <div className="grid grid-cols-1 gap-2">

                {}
                <button
                    onClick={() => setActiveModal('announcement')}
                    className="flex items-center justify-between py-3 px-5 bg-card border border-customBorder hover:border-accent/40 rounded-xl transition-all group text-left cursor-pointer"
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

                {}
                <button
                    onClick={() => {
                        setTemporaryMarkdown(settings.descriptionMarkdown);
                        setActiveModal('edit-description');
                    }}
                    className="flex items-center justify-between py-3 px-5 bg-card border border-customBorder hover:border-accent/40 rounded-xl transition-all group text-left cursor-pointer"
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-primary text-accent rounded-lg border border-customBorder group-hover:scale-105 transition-transform">
                            <FileEdit className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-mainText">Edit Rich Description</h4>
                            <p className="text-xs text-subText mt-0.5">Modify core Markdown source elements</p>
                        </div>
                    </div>
                    <Plus className="w-5 h-5 text-subText group-hover:text-accent transition-colors" />
                </button>

                {}
                <button
                    onClick={() => setActiveModal('participants')}
                    className="flex items-center justify-between  py-3 px-5 bg-card border border-customBorder hover:border-accent/40 rounded-xl transition-all group text-left cursor-pointer"
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-primary text-accent rounded-lg border border-customBorder group-hover:scale-105 transition-transform">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-mainText">Audit Registrants</h4>
                            <p className="text-xs text-subText mt-0.5">Manage {settings.registrants?.length || 0} active event records</p>
                        </div>
                    </div>
                    <Plus className="w-5 h-5 text-subText group-hover:text-accent transition-colors" />
                </button>

            </div>

            {}
            <div className="bg-card border border-customBorder rounded-xl p-6 space-y-2">
                <div className="flex items-center space-x-2 pb-3 border-b border-customBorder">
                    <ShieldAlert className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-mainText">Pipeline Permissions Gatekeeper</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 pt-2">
                    
                    {}
                    <div className="bg-primary/40 py-2 px-4 border border-customBorder rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-xs font-bold truncate">Draft Schema State</div>
                            <div className="text-[10px] text-subText truncate">Is hidden from public feeds</div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => toggleSettingFlag('isDraft')}
                            className="text-accent hover:scale-105 transition-transform cursor-pointer"
                        >
                            {settings.settings.isDraft ? <ToggleRight className="w-8 h-8 text-accent" /> : <ToggleLeft className="w-8 h-8 text-subText/40" />}
                        </button>
                    </div>

                    {}
                    <div className="bg-primary/40 py-2 px-4 border border-customBorder rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-xs font-bold truncate">Publish Results</div>
                            <div className="text-[10px] text-subText truncate">Expose spreadsheets node logs</div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => toggleSettingFlag('isResultsPublished')}
                            className="text-accent hover:scale-105 transition-transform cursor-pointer"
                        >
                            {settings.settings.isResultsPublished ? <ToggleRight className="w-8 h-8 text-emerald-400" /> : <ToggleLeft className="w-8 h-8 text-subText/40" />}
                        </button>
                    </div>

                    {}
                    <div className="bg-primary/40 py-2 px-4 border border-customBorder rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-xs font-bold truncate">Public Attendance</div>
                            <div className="text-[10px] text-subText truncate">Allow users to look up rosters</div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => toggleSettingFlag('isParticipationPubic')}
                            className="text-accent hover:scale-105 transition-transform cursor-pointer"
                        >
                            {settings.settings.isParticipationPubic ? <ToggleRight className="w-8 h-8 text-accent" /> : <ToggleLeft className="w-8 h-8 text-subText/40" />}
                        </button>
                    </div>

                    {}
                    <div className="bg-primary/40 py-2 px-4 border border-customBorder rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-xs font-bold truncate">Discussion Stream</div>
                            <div className="text-[10px] text-subText truncate">Allow live comment parsing</div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => toggleSettingFlag('isDiscussionOpen')}
                            className="text-accent hover:scale-105 transition-transform cursor-pointer"
                        >
                            {settings.settings.isDiscussionOpen ? <ToggleRight className="w-8 h-8 text-accent" /> : <ToggleLeft className="w-8 h-8 text-subText/40" />}
                        </button>
                    </div>

                </div>
            </div>

            {}
            <div className="bg-card border border-customBorder rounded-xl p-6">
                <div className="flex items-center space-x-2 pb-4 mb-6 border-b border-customBorder">
                    <Settings className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-mainText">Event System Core Registry</h3>
                </div>

                <form onSubmit={saveAllConfigurations} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-subText flex items-center gap-1.5"><FileEdit className="w-3 h-3" /> Event Master Title</label>
                            <input
                                type="text" name="title" value={settings.title} onChange={handleInputChange}
                                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" required
                            />
                        </div>

                        {}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-subText flex items-center gap-1.5"><HelpCircle className="w-3 h-3" /> Event Tagline</label>
                            <input
                                type="text" name="tagline" value={settings.tagline} onChange={handleInputChange}
                                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors"
                                placeholder="Purpose vector description..."
                            />
                        </div>

                        {}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-subText flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Target Date Sequence</label>
                            <input
                                type="text" name="date" value={settings.date} onChange={handleInputChange}
                                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" required
                            />
                        </div>

                        {}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-subText flex items-center gap-1.5"><Clock className="w-3 h-3" /> Runtime Execution Window</label>
                            <input
                                type="text" name="time" value={settings.time} onChange={handleInputChange}
                                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" required
                            />
                        </div>

                        {}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-subText flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Physical Base Venue</label>
                            <input
                                type="text" name="location" value={settings.location} onChange={handleInputChange}
                                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" required
                            />
                        </div>

                        {}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-subText flex items-center gap-1.5"><Link2 className="w-3 h-3" /> Virtual Portal / Mirror Node Link</label>
                            <input
                                type="url" name="virtualLink" value={settings.virtualLink || ''} onChange={handleInputChange}
                                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText font-mono focus:outline-hidden transition-colors"
                                placeholder="https://..."
                            />
                        </div>

                        {}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-subText">Total Allocation Seats</label>
                                <input
                                    type="number" name="totalSpots" value={settings.totalSpots} onChange={handleNumberChange}
                                    className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors" min="1"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-subText">Remaining Empty Nodes</label>
                                <input
                                    type="number" name="spotsLeft" value={settings.spotsLeft} onChange={handleNumberChange}
                                    className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors"
                                />
                            </div>
                        </div>

                        {}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-subText">Operational Context Flag Classification</label>
                            <select
                                name="type" value={settings.type} onChange={handleInputChange}
                                className="w-full bg-primary border border-customBorder focus:border-accent/50 rounded-lg p-2.5 text-sm text-mainText focus:outline-hidden transition-colors"
                            >
                                <option value="workshop">Workshop Training Block</option>
                                <option value="competition">Competitive Hackathon Matrix</option>
                                <option value="guest-speaker">Guest Keynote Node</option>
                            </select>
                        </div>

                        

                       
                        

                    </div>

                    {}
                    <div className="flex justify-end pt-4 border-t border-customBorder">
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-accent hover:bg-accentHover text-primary font-black uppercase tracking-widest rounded-lg text-xs transition-all cursor-pointer transform active:scale-95 shadow-md shadow-accent/5"
                        >
                            Update Event Blueprint
                        </button>
                    </div>
                </form>
            </div>

            {}

            {}
            {activeModal === 'announcement' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
                        <PostForm
                            eventId={settings.id}
                            clubName={settings.clubName}
                            onClose={() => setActiveModal(null)}
                            isImageInput={true}
                            isVideoInput={false}
                            isTags={true}
                        />
                    </div>
                </div>
            )}

            {}
            {activeModal === 'edit-description' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-card border border-customBorder w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                        
                        {}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-customBorder bg-primary/40">
                            <div>
                                <h3 className="font-bold text-mainText flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <FileEdit className="w-4 h-4 text-accent" /> Description Matrix Workspace
                                </h3>
                                <p className="text-[10px] text-subText mt-0.5">Author core information parameters directly with live preview bindings</p>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="text-subText hover:text-mainText cursor-pointer"><X className="w-5 h-5" /></button>
                        </div>

                        {}
                        <div className="flex-1 p-6 overflow-y-auto bg-primary/20" data-color-mode={themeMode}>
                            <Suspense fallback={<div className="w-full h-full flex items-center justify-center font-mono text-xs text-subText animate-pulse">Mounting Rich Markdown Editor Elements Node...</div>}>
                                <MDEditor
                                    value={temporaryMarkdown}
                                    onChange={(val) => setTemporaryMarkdown(val || '')}
                                    height="100%"
                                    minHeight={340}
                                    preview="live"
                                />
                            </Suspense>
                        </div>

                        {}
                        <div className="p-4 bg-primary/40 border-t border-customBorder flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setActiveModal(null)} 
                                className="px-4 py-2 bg-primary hover:bg-primary/80 border border-customBorder text-mainText rounded-lg text-xs font-bold cursor-pointer"
                            >
                                Discard Cache Changes
                            </button>
                            <button 
                                type="button"
                                onClick={saveDescriptionMarkdownModal}
                                className="px-5 py-2 bg-accent hover:bg-accentHover text-primary rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-md"
                            >
                                Apply Workspace Injections
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {activeModal === 'participants' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-card border border-customBorder w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-customBorder bg-primary/40">
                            <h3 className="font-bold text-mainText flex items-center gap-2"><Users2 className="w-4 h-4 text-accent" /> Inbound Roster Audit System</h3>
                            <button onClick={() => setActiveModal(null)} className="text-subText hover:text-mainText cursor-pointer"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-3 flex-1">
                            {settings.registrants?.length === 0 ? (
                                <div className="text-center py-8 text-subText text-xs">No active registrations indexed for this node.</div>
                            ) : (
                                settings.registrants?.map(registrant => (
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
                                            type="button"
                                            onClick={() => {
                                                if (confirm(`Sever alignment record and remove ${registrant.name}?`)) {
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

        </div>
    );
};