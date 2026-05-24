import React, { act, useState } from 'react';
import {
    QrCode, MessageSquare, Link as LinkIcon, MedalIcon,
} from 'lucide-react';
import { AnnouncementTab } from "../components/Events/AnnouncementTab";
import { LeaderboardTab } from "../components/Events/LeaderboardTab";
import { EventDetailsTab } from "../components/Events/EventDetails";
import { ParticipantsTab } from "../components/Events/ParticipantsTab";

// ==========================================
// 1. TYPINGS & INTERFACES (TypeScript Blueprints)
// ==========================================

import type { Announcement, DiscussionComment, EventData } from '../interfaces/event.type';

import { Tabs, type TabOption } from '../components/Tabs';
import TopPortion from '../components/TopPortion';
import { EditEvent } from '../components/EditEvent';

type tabkeys = 'details' | 'announcements' | 'discussion' | 'participants' | 'results' | 'edit';

// ==========================================
// 2. REFRESHED MOCK COMPREHENSIVE DATA VALUE
// ==========================================
const mockRichEventData: EventData = {
    id: "evt-2026-forgehack",
    type: "competition",
    status: "completed",
    logoUrl: '',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    tagline: '',
    tags :['Generative AI', 'Agentic LLMs', 'Next.js 15', 'TypeScript', 'Vector DBs', 'Vercel AI SDK', 'Hackathon'],
    title: "ForgeHack 2026: GenAI Campus Solutions",
    clubName: "CampusForge AI & Dev Club",
    date: "June 05, 2026",
    start_time: '9 :00 AM',
    end_time: '5:00 PM',
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
    ],
    settings: {
        isResultsPublished: true,
        isDraft: true,
        isParticipationPubic: true,
        isDiscussionOpen: true
    }
};

type memberTypes = 'admin' | 'member' | 'non_member';
// ==========================================
// 3. MAIN INTERACTIVE APPLICATION COMPONENT
// ==========================================
export const Event: React.FC = () => {
    const [eventType, setEventType] = useState<'individual' | 'team'>('team');
    const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
    const [memberType, setmemberType] = useState<memberTypes>('admin');
    const [activeTab, setActiveTab] = useState<tabkeys>('details');
    const [eventData, setEventData] = useState<EventData>(mockRichEventData);
    const [currentStatus, setCurrentStatus] = useState<'FUTURE' | 'ONGOING' | 'COMPLETED'>('FUTURE');
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });


    React.useEffect(() => {
        const calculateTimeMetrics = () => {
            const now = new Date().getTime();

            // Map data directly from your eventData state blueprint attributes
            // (Assumes parseable date strings are mapped into these keys)
            const start = new Date(`${eventData.date} ${eventData.start_time}`).getTime();
            const end = new Date(`${eventData.date} ${eventData.end_time}`).getTime();

            if (now > end) {
                setCurrentStatus('COMPLETED');
                return;
            }

            if (now >= start && now <= end) {
                setCurrentStatus('ONGOING');
                return;
            }

            setCurrentStatus('FUTURE');
            const distance = start - now;

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        };

        calculateTimeMetrics();
        const tickerInterval = setInterval(calculateTimeMetrics, 1000);
        return () => clearInterval(tickerInterval);
    }, [eventData.date, eventData.start_time, eventData.end_time]);
    const tabOptions: TabOption<tabkeys>[] = [
        { key: 'details', label: 'Details' },
        { key: 'announcements', label: 'Announcements' },
        { key: 'discussion', label: 'Discussions' },
        { key: 'participants', label: 'Participants' },
        { key: 'results', label: 'Leaderboard' },
    ];
    if (memberType == 'admin') {
        tabOptions.push({ key: 'edit', label: 'Edit' });
    }




    return (
        // REFACTORED: Application wrapper maps directly to your central background properties
        <div className="min-h-screen bg-primary text-mainText font-sans pb-16 transition-colors duration-200">
            <TopPortion
                bannerUrl={mockRichEventData.bannerUrl}
                logoUrl={mockRichEventData.logoUrl}
                name={mockRichEventData.title}
                tagline={mockRichEventData.tagline}
                location={mockRichEventData.location}
                founded={mockRichEventData.founded}
                date={mockRichEventData.date}
                time={mockRichEventData.time}
                memberType={memberType}
            />


            {/* CONTENT SYSTEM GRID NAVIGATION */}
            <div className="max-w-(--width-total) mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* MAIN DYNAMIC COLUMN TRACK */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* COMPONENT TAB PANEL OPTIONS */}

                        <Tabs
                            options={tabOptions}
                            activeTab={activeTab}
                            onChange={(key) => setActiveTab(key)}
                        />

                        {/* TAB SUB-MODULES WITH INHERITED THEME PROPS */}
                        {activeTab === 'details' && (
                            <EventDetailsTab
                                descriptionMarkdown={eventData.descriptionMarkdown}
                            />
                        )}

                        {activeTab === 'results' && (
                            <LeaderboardTab
                                memberType={memberType}
                                storedHeaders={eventData.storedHeaders}
                                storedRows={eventData.storedRows}
                                onUploadSuccess={({ headers, rows }) => {
                                    setEventData(prev => ({ ...prev, storedHeaders: headers, storedRows: rows }));
                                }}
                            />
                        )}

                        {activeTab === 'announcements' && (
                            <AnnouncementTab
                                announcements={eventData.announcements}
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

                        {activeTab === 'edit' && memberType == 'admin' && (
                            <EditEvent
                                eventData={mockRichEventData}
                                isLeaderboardPublishedStatus={false}
                                onUpdateEvent={(updatedEvent) => console.log("Push update modifications globally:", updatedEvent)}
                                onAddAnnouncement={(newAnnouncement) => console.log("Append news record stack:", newAnnouncement)}
                                onRemoveRegistrant={(id) => console.log("Prune user instance identifier:", id)}
                                onToggleLeaderboardPublish={(status) => console.log("Set pipeline broadcast state:", status)}
                            />
                        )}

                    </div>

                    {/* RIGHT SIDEBAR MODULE: SYSTEM LIVE STATS METRICS ENGINE */}
                    <div className="space-y-6">

                        {/* ⏱️ SIDEBAR PANEL 1: REGISTRATION TRACKING PROGRESS ENGINE */}
                        {/* ⏱️ SIDEBAR PANEL 1: ADAPTIVE EVENT LIFECYCLE LIFELINE ENGINE */}
                        <div className="bg-card border border-customBorder rounded-xl p-5 space-y-4 transition-colors">
                            <div className="flex items-center justify-between border-b border-customBorder pb-2">
                                <span className="text-[10px] text-subText font-bold uppercase tracking-wider block">
                                    {currentStatus === 'FUTURE' && 'Countdown To Execution'}
                                    {currentStatus === 'ONGOING' && 'Live Operational Feed'}
                                    {currentStatus === 'COMPLETED' && 'Event Status Archive'}
                                </span>
                                <span className={`w-2 h-2 rounded-full ${currentStatus === 'FUTURE' ? 'bg-amber-500 shadow-md shadow-amber-500/20' :
                                        currentStatus === 'ONGOING' ? 'bg-emerald-500 animate-ping' : 'bg-slate-500/60'
                                    }`} />
                            </div>

                            {/* CONDITION A: FUTURE STATUS — RICH INTERACTIVE COUNTDOWN CHIPS */}
                            {currentStatus === 'FUTURE' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="bg-primary border border-customBorder p-2 rounded-lg text-center">
                                            <div className="text-base font-black text-mainText font-mono tracking-tight">{timeLeft.days}</div>
                                            <div className="text-[8px] text-subText font-bold uppercase tracking-wider">Days</div>
                                        </div>
                                        <div className="bg-primary border border-customBorder p-2 rounded-lg text-center">
                                            <div className="text-base font-black text-mainText font-mono tracking-tight">
                                                {String(timeLeft.hours).padStart(2, '0')}
                                            </div>
                                            <div className="text-[8px] text-subText font-bold uppercase tracking-wider">Hrs</div>
                                        </div>
                                        <div className="bg-primary border border-customBorder p-2 rounded-lg text-center">
                                            <div className="text-base font-black text-mainText font-mono tracking-tight">
                                                {String(timeLeft.minutes).padStart(2, '0')}
                                            </div>
                                            <div className="text-[8px] text-subText font-bold uppercase tracking-wider">Min</div>
                                        </div>
                                        <div className="bg-primary border border-customBorder p-2 rounded-lg text-center">
                                            <div className="text-base font-black text-accent font-mono tracking-tight animate-pulse">
                                                {String(timeLeft.seconds).padStart(2, '0')}
                                            </div>
                                            <div className="text-[8px] text-subText font-bold uppercase tracking-wider">Sec</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CONDITION B: ONGOING STATUS — PULSING BROADCAST MARQUEE CHIP */}
                            {currentStatus === 'ONGOING' && (
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center space-y-2 animate-pulse">
                                    <div className="text-xs font-black text-emerald-400 uppercase tracking-widest">Matrix Is Active</div>
                                    <p className="text-[10px] text-subText leading-relaxed">
                                        Operations are live. Submissions and code tracking channels are indexing telemetry streams.
                                    </p>
                                </div>
                            )}

                            {/* CONDITION C: COMPLETED STATUS — FIXED COMPLETE ARCHIVE MESSAGE */}
                            {currentStatus === 'COMPLETED' && (
                                <div className="bg-primary/60 border border-customBorder rounded-xl p-4 text-center space-y-2">
                                    <div className="text-xs font-bold text-mainText uppercase tracking-wider">Operations Concluded</div>
                                    <p className="text-[10px] text-subText leading-relaxed">
                                        This event segment node has finished execution. Metrics and project logs are sealed inside the archives.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 🎫 SIDEBAR PANEL 2: SECURITY VERIFICATION ACCESS KEY */}
                        {memberType === 'member' && (
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
                                {mockRichEventData.tags.map((tag) => (
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