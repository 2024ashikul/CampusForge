import React, { useState } from 'react';
import {
    Calendar, MapPin, Clock, Megaphone,
    Trophy, Sparkles, ShieldCheck, CalendarX, Eye,
    QrCode, ArrowUpRight, MessageSquare, Image, Link as LinkIcon, MedalIcon,
} from 'lucide-react';
import { AnnouncementTab } from "../components/Events/AnnouncementTab";
import { LeaderboardTab } from "../components/Events/LeaderboardTab";
import { EventDetailsTab } from "../components/Events/EventDetails";
import { ParticipantsTab } from "../components/Events/ParticipantsTab";

// ==========================================
// 1. TYPINGS & INTERFACES (TypeScript Blueprints)
// ==========================================
import type { Announcement , DiscussionComment, EventData} from '../interfaces/event.type';

// ==========================================
// 2. REFRESHED MOCK COMPREHENSIVE DATA VALUE
// ==========================================
const mockRichEventData: EventData = {
    id: "evt-2026-forgehack",
    type: "competition",
    status: "completed", 
    title: "ForgeHack 2026: GenAI Campus Solutions",
    clubName: "CampusForge AI & Dev Club",
    date: "June 05, 2026",
    time: "9:00 AM (Friday) - 5:00 PM (Saturday)",
    location: "Campus Innovation Hub & Main Auditorium",
    virtualLink: "https://discord.gg/campusforge-hackathon",
    spotsLeft: 0,
    totalSpots: 120,
    registrants: [
        { id: "STU-2026-0101", name: "Asif Khan", department: "Computer Science", teamName: "Team Alpha" },
        { id: "STU-2026-0102", name: "Tamim Iqbal", department: "Electrical Engineering", teamName: "Team Alpha" },
        { id: "STU-2026-0304", name: "Nabila Rahman", department: "Data Science", teamName: "Team Beta" },
        { id: "STU-2026-0305", name: "Fahim Shahriar", department: "Computer Science", teamName: "Team Beta" },
        { id: "STU-2026-0999", name: "Rahat Karim", department: "Cyber Security", teamName: "Solo Prototype" }
    ],
    descriptionMarkdown: `### 🚀 Welcome to the Arena\nForgeHack is our flagship annual 24-hour hackathon challenge...`,
    announcements: [
        {
            id: 'a-rich-1',
            date: 'Today, 4:00 PM',
            author: 'Alex Rivera (Organizer)',
            content: '🚨 FINAL RESULTS ARE LIVE! Huge round of applause to all 30 teams who deployed code tonight.',
            imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
            ctaLink: { label: 'View Photo Gallery', url: 'https://photos.university.edu/forgehack26' }
        }
    ],
    discussion: [
        { id: 'd1', user: 'Zayn M.', role: 'Student', avatar: 'ZM', text: 'Where can we download our compliance participation certificates?', time: '2 hrs ago' }
    ]
};

// ==========================================
// 3. MAIN INTERACTIVE APPLICATION COMPONENT
// ==========================================
export const Event: React.FC = () => {
    const [eventType, setEventType] = useState<'individual' | 'team'>('team');
    const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
    const [currentRole, setCurrentRole] = useState<'admin' | 'user' | 'external'>('admin');
    const [activeTab, setActiveTab] = useState<'details' | 'announcements' | 'discussion' | 'participants' | 'results'>('results');
    const [eventData, setEventData] = useState<EventData>(mockRichEventData);

    return (
        // REFACTORED: Application wrapper maps directly to your central background properties
        <div className="min-h-screen bg-primary text-mainText font-sans pb-16 transition-colors duration-200">

            {/* ROLE SIMULATOR BAR */}
            <div className="bg-card border-b border-accent/20 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>PROJECT SIMULATOR ROLE GATEWAY:</span>
                </div>
                <div className="flex gap-2">
                    {(['external', 'user', 'admin'] as const).map((role) => (
                        <button
                            key={role}
                            onClick={() => setCurrentRole(role)}
                            className={`px-3 py-1 rounded text-xs font-bold capitalize transition-all cursor-pointer ${
                                currentRole === role
                                    ? 'bg-accent text-primary shadow font-black'
                                    : 'bg-primary text-subText hover:text-mainText border border-customBorder'
                            }`}
                        >
                            {role === 'external' ? 'External Guest' : role === 'user' ? 'Registered Attendee' : 'System Admin'}
                        </button>
                    ))}
                </div>
            </div>

            {/* EVENT TITLE JUMBOTRON HERO */}
            <div className="bg-gradient-to-r from-card via-primary/40 to-primary border-b border-customBorder py-12 px-6">
                <div className="max-w-6xl mx-auto relative">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded">
                            {eventData.type === 'competition' ? '🏆 Live Tournament' : '⚙️ Technical Lab'}
                        </span>
                        {eventData.status === 'completed' && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded">
                                ✓ Concluded / Archive
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-mainText mt-4 leading-tight">
                        {eventData.title}
                    </h1>
                    <div className="flex flex-wrap gap-6 text-xs md:text-sm text-subText mt-6">
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" /> {eventData.date}</span>
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-accent" /> {eventData.time}</span>
                        <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> {eventData.location}</span>
                    </div>
                </div>
            </div>

            {/* CONTENT SYSTEM GRID NAVIGATION */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* MAIN DYNAMIC COLUMN TRACK */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* COMPONENT TAB PANEL OPTIONS */}
                        <div className="flex border-b border-customBorder space-x-2 overflow-x-auto whitespace-nowrap scrollbar-none">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'details' ? 'border-accent text-accent' : 'border-transparent text-subText hover:text-mainText'}`}
                            >
                                Event Manual
                            </button>

                            <button
                                onClick={() => setActiveTab('results')}
                                className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'results' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-subText hover:text-mainText'}`}
                            >
                                <Trophy className="w-4 h-4" /> Podium & Winners
                            </button>

                            <button
                                onClick={() => setActiveTab('announcements')}
                                className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'announcements' ? 'border-accent text-accent' : 'border-transparent text-subText hover:text-mainText'}`}
                            >
                                Broadcasts <span className="text-[10px] px-1.5 py-0.5 bg-footer rounded-full text-subText">{eventData.announcements?.length || 0}</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('discussion')}
                                className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'discussion' ? 'border-accent text-accent' : 'border-transparent text-subText hover:text-mainText'}`}
                            >
                                Discussions
                            </button>
                            
                            <button
                                onClick={() => setActiveTab('participants')}
                                className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${activeTab === 'participants' ? 'border-accent text-mainText' : 'border-transparent text-subText/60 hover:text-mainText'}`}
                            >
                                Participants
                            </button>
                        </div>

                        {/* TAB SUB-MODULES WITH INHERITED THEME PROPS */}
                        {activeTab === 'details' && (
                            <EventDetailsTab
                                currentRole={currentRole}
                                descriptionMarkdown={eventData.descriptionMarkdown}
                                onDescriptionChange={(updatedMarkdown) => {
                                    setEventData(prev => ({ ...prev, descriptionMarkdown: updatedMarkdown }));
                                }}
                            />
                        )}

                        {activeTab === 'results' && (
                            <LeaderboardTab
                                currentRole={currentRole}
                                storedHeaders={eventData.storedHeaders}
                                storedRows={eventData.storedRows}
                                onUploadSuccess={({ headers, rows }) => {
                                    setEventData(prev => ({ ...prev, storedHeaders: headers, storedRows: rows }));
                                }}
                            />
                        )}

                        {activeTab === 'announcements' && (
                            <AnnouncementTab
                                currentRole={currentRole}
                                announcements={eventData.announcements}
                                onPostAnnouncement={(freshAnn) => {
                                    setEventData({ ...eventData, announcements: [freshAnn, ...(eventData.announcements || [])] });
                                }}
                            />
                        )}

                        {/* TAB CONTENT MODULE 4: DISCUSSION SYSTEM CHAT PANEL */}
                        {activeTab === 'discussion' && (
                            <div className="bg-card border border-customBorder rounded-xl p-6 space-y-4 transition-colors">
                                <h3 className="text-sm font-bold text-mainText flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-accent" /> Dialogue Interface
                                </h3>
                                {eventData.discussion.map(disc => (
                                    <div key={disc.id} className="bg-primary border border-customBorder p-4 rounded-lg flex gap-3 text-xs transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-footer flex items-center justify-center font-bold text-accent border border-customBorder flex-shrink-0">{disc.avatar}</div>
                                        <div>
                                            <div className="font-bold text-mainText">{disc.user} <span className="text-[10px] text-subText font-normal">({disc.role})</span></div>
                                            <p className="text-subText mt-1">{disc.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'participants' && (
                            <ParticipantsTab
                                eventType={eventType}
                                registrants={eventData.registrants}
                                expandedTeams={expandedTeams}
                                setExpandedTeams={setExpandedTeams}
                            />
                        )}

                    </div>

                    {/* RIGHT SIDEBAR MODULE: SYSTEM LIVE STATS METRICS ENGINE */}
                    <div className="space-y-6">

                        {/* ⏱️ SIDEBAR PANEL 1: REGISTRATION TRACKING PROGRESS ENGINE */}
                        <div className="bg-card border border-customBorder rounded-xl p-5 space-y-4 transition-colors">
                            <div className="flex items-center justify-between border-b border-customBorder pb-2">
                                <span className="text-[10px] text-subText font-bold uppercase tracking-wider block">Live Event Metrics</span>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-primary border border-customBorder p-3 rounded-xl text-center transition-colors">
                                    <div className="text-lg font-black text-mainText font-mono">148</div>
                                    <div className="text-[10px] text-subText font-bold uppercase tracking-wide mt-0.5">Hackers In</div>
                                </div>
                                <div className="bg-primary border border-customBorder p-3 rounded-xl text-center transition-colors">
                                    <div className="text-lg font-black text-accent font-mono">36</div>
                                    <div className="text-[10px] text-subText font-bold uppercase tracking-wide mt-0.5">Teams Formed</div>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between text-[10px] text-subText font-mono">
                                    <span>Roster Fill Limit</span>
                                    <span>92% Full</span>
                                </div>
                                <div className="w-full bg-primary h-1.5 rounded-full overflow-hidden border border-customBorder transition-colors">
                                    <div className="bg-gradient-to-r from-accent to-amber-500 h-full w-[92%] rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* 🎫 SIDEBAR PANEL 2: SECURITY VERIFICATION ACCESS KEY */}
                        {currentRole === 'user' && (
                            <div className="bg-card border border-accent/20 rounded-xl p-5 text-center space-y-3 shadow-lg transition-colors">
                                <div className="inline-flex p-2 bg-accent/10 text-accent rounded-xl mx-auto border border-accent/20">
                                    <QrCode className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-mainText">Personal Access Pass Verified</div>
                                    <p className="text-[10px] text-subText mt-0.5">Present this digital key at verification booths.</p>
                                </div>
                                <div className="bg-primary border border-customBorder py-1.5 px-2 rounded font-mono text-xs tracking-widest text-accent transition-colors">
                                    PASS-FORGEHACK26
                                </div>
                            </div>
                        )}

                        {/* 🏷️ SIDEBAR PANEL 3: FOCUS STACKS TAG CHIPS */}
                        <div className="bg-card border border-customBorder rounded-xl p-5 space-y-3 transition-colors">
                            <span className="text-[10px] text-subText font-bold uppercase tracking-wider block border-b border-customBorder pb-2">
                                Focus Stacks & Disciplines
                            </span>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {['Generative AI', 'Agentic LLMs', 'Next.js 15', 'TypeScript', 'Vector DBs', 'Vercel AI SDK', 'Hackathon'].map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-[10px] font-medium px-2.5 py-1 bg-primary border border-customBorder hover:border-accent/50 rounded-lg text-subText transition-colors cursor-default"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 🏢 SIDEBAR PANEL 4: HOSTING ORGANIZATION CARD */}
                        <div className="bg-card border border-customBorder rounded-xl p-5 space-y-3 transition-colors">
                            <span className="text-[10px] text-subText font-bold uppercase tracking-wider block border-b border-customBorder pb-2">
                                Hosting Organization
                            </span>
                            <div className="flex items-center gap-3 pt-1">
                                <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-amber-500/10 border border-customBorder rounded-xl flex items-center justify-center font-black text-xs text-accent tracking-tighter shrink-0 shadow-inner">
                                    CFAC
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-mainText truncate">CampusForge AI Collective</h4>
                                    <p className="text-[10px] text-subText mt-0.5 truncate">Official Tier-1 Engineering Club</p>
                                </div>
                            </div>

                            <a
                                href="#club-portal"
                                className="w-full py-1.5 bg-primary hover:bg-footer border border-customBorder hover:border-slate-400/40 text-mainText text-center block text-[11px] font-semibold rounded-lg transition-all mt-2"
                            >
                                View Organizer Profile
                            </a>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Event;