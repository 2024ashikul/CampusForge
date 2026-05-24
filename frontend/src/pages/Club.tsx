import React, { useState } from 'react';
import { Calendar, Users, FileText, MapPin, Award, ArrowUpRight } from 'lucide-react';
import Tabs, { type TabOption } from '../components/Tabs';
import { EditClub } from '../components/Clubs/Edit';
import TopPortion from '../components/TopPortion';
 // <-- Import the new top portion layout

type memberTypes = 'admin' | 'member' | 'non_member' | 'announcement';

// --- MOCK API DATA STRUCTURES ---
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

interface Post {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
}

interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'In-person' | 'Virtual';
  location: string;
  spotsLeft: number;
  availability: string;
}

interface Participant {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isLead: boolean;
}

// --- DUMMY API VALUES ---
const mockClubData: Club = {
  name: "CampusForge AI & Dev Club",
  tagline: "Forging the future of software engineering and intelligent systems.",
  description: "Welcome to CampusForge! We are a community of passionate developers, builders, and designers pushing the boundaries of technology. We host weekly hack nights, technical workshops, guest lectures from industry experts, and collaborative open-source projects.",
  bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  logoUrl: "⚙️",
  location: "Engineering Block, Room 402",
  founded: "Fall 2024",
  memberCount: 142,
  eventCount: 8,
  postCount: 24,
};

const mockPosts: Post[] = [
  { id: '1', title: 'Getting Started with Next.js 15 & Server Actions', excerpt: 'A comprehensive deep-dive into streaming data, server components, and layout structures for modern apps.', date: 'May 18, 2026', author: 'N. Sharma', category: 'Technical' },
  { id: '2', title: 'Reflecting on the 2026 Spring Hackathon Winners', excerpt: 'Shoutout to team ForgeByte for securing 1st place with their AI-driven campus accessibility assistant.', date: 'May 12, 2026', author: 'Sarah Jenkins', category: 'Community' },
  { id: '3', title: 'Open Source Contribution Night: UI Libraries', excerpt: 'Looking for maintainers for our internal component systems. Tap into React, Tailwind, and Radix configurations.', date: 'May 05, 2026', author: 'Alex Rivera', category: 'Projects' }
];

const mockEvents: ClubEvent[] = [
  { id: '1', title: 'AI Agent Workshop: Building with Gemini API', date: 'May 25, 2026', time: '6:00 PM - 8:00 PM', type: 'In-person', location: 'Lab 3B', spotsLeft: 12 },
  { id: '2', title: 'Bi-Weekly Open Forge Hack Session', date: 'May 29, 2026', time: '7:00 PM - 11:00 PM', type: 'In-person', location: 'Innovation Hub', spotsLeft: 35 },
  { id: '3', title: 'Tech Portfolio Review & Resume Critique', date: 'June 03, 2026', time: '5:30 PM', type: 'Virtual', location: 'Discord Stage', spotsLeft: 50 }
];

const mockParticipants: Participant[] = [
  { id: '1', name: 'Nishant Sharma', role: 'Club Founder & Lead', avatar: 'NS', isLead: true },
  { id: '2', name: 'Sarah Jenkins', role: 'Vice President', avatar: 'SJ', isLead: true },
  { id: '3', name: 'Alex Rivera', role: 'Technical Project Director', avatar: 'AR', isLead: true },
  { id: '4', name: 'Emily Chen', role: 'Full Stack Developer', avatar: 'EC', isLead: false },
  { id: '5', name: 'Marcus Brody', role: 'UI/UX Contributor', avatar: 'MB', isLead: false },
  { id: '6', name: 'Zayn Malik', role: 'DevOps Novice', avatar: 'ZM', isLead: false },
];

type tabkeys = 'posts' | 'events' | 'members' | 'edit' | 'announcement';

export const Club: React.FC = () => {
  const [memberType, setMemberType] = useState<memberTypes>('admin');
  
  const [isAdmin, setIsAdmin] = useState(memberType === 'admin');
  const [activeTab, setActiveTab] = useState<tabkeys>('posts');

  const tabOptions: TabOption<tabkeys>[] = [
    { key: 'posts', label: 'Club Posts' },
    { key: 'events', label: 'Events' },
    { key: 'members', label: 'Members' },
  ];

  if (memberType === 'admin' || memberType === 'member') {
    tabOptions.push({ key: 'announcement', label: 'Announcements' });
  }

  if (isAdmin) {
    tabOptions.push({ key: 'edit', label: 'Edit' });
  }
  
  return (
    <div className="min-h-screen bg-primary text-mainText font-sans pb-16 transition-colors duration-200">

      {/* REFACTORED INTEGRATION: Injected clean component container mapping */}
      <TopPortion 
        bannerUrl={mockClubData.bannerUrl}
        logoUrl={mockClubData.logoUrl}
        name={mockClubData.name}
        tagline={mockClubData.tagline}
        location={mockClubData.location}
        founded={mockClubData.founded}
        memberType={memberType}
      />

      {/* 3. GRID LAYOUT: LEFT SIDE DETAILS & RIGHT SIDE ACTIONS */}
      {/* Note: This div wrapper keeps the exact padding offsets from your original layout */}
      <div className="max-w-[var(--width-total)] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

          {/* LEFT & CENTER COLS: Description + Interactive Tabs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Card */}
            <div className="bg-card border border-customBorder rounded-xl p-6 transition-colors">
              <h3 className="text-sm font-bold uppercase tracking-wider text-subText mb-2">About Our Forge</h3>
              <p className="text-mainText/90 text-sm leading-relaxed">{mockClubData.description}</p>
            </div>

            {/* TAB CONTROLS */}
            <div>
              <Tabs
                options={tabOptions}
                activeTab={activeTab}
                onChange={(key) => setActiveTab(key)}
              />

              {/* TAB CONTENT RENDERING */}
              <div className="space-y-4 mt-4">

                {/* TAB: POSTS */}
                {activeTab === 'posts' && mockPosts.map((post) => (
                  <div key={post.id} className="bg-card border border-customBorder hover:border-accent/40 rounded-xl p-5 transition-all group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-accent px-2 py-0.5 rounded transition-colors">
                        {post.category}
                      </span>
                      <span className="text-xs text-subText">{post.date}</span>
                    </div>
                    <h4 className="text-base font-bold text-mainText mt-2 group-hover:text-accent transition-colors flex items-center gap-1 cursor-pointer">
                      {post.title} <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                    </h4>
                    <p className="text-xs text-subText/80 mt-1.5 line-clamp-2">{post.excerpt}</p>
                    <div className="text-xs text-subText mt-3 font-medium">By {post.author}</div>
                  </div>
                ))}

                {/* TAB: EVENTS */}
                {activeTab === 'events' && mockEvents.map((event) => (
                  <div key={event.id} className="bg-card border border-customBorder rounded-xl p-5 flex items-start justify-between gap-4 transition-colors">
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-mainText">{event.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subText pt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-subText/60" /> {event.date} • {event.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-subText/60" /> {event.location} ({event.type})</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs bg-primary border border-customBorder text-accent px-3 py-1 rounded-md font-bold block transition-colors">
                        {event.spotsLeft} spots left
                      </span>
                    </div>
                  </div>
                ))}

                {/* TAB: PARTICIPANTS */}
                {activeTab === 'members' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mockParticipants.map((member) => (
                      <div key={member.id} className="bg-card border border-customBorder rounded-xl p-4 flex items-center space-x-3 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${member.isLead
                          ? 'bg-gradient-to-b from-accent to-accentHover text-primary'
                          : 'bg-primary text-subText'
                          }`}>
                          {member.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-mainText flex items-center gap-1.5">
                            {member.name}
                            {member.isLead && <span className="text-[9px] bg-accent/10 text-accent border border-accent/20 px-1 rounded font-mono font-bold uppercase">Core</span>}
                          </div>
                          <div className="text-xs text-subText">{member.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB: EDIT SYSTEM CONSOLE */}
                {activeTab === 'edit' && (
                  <EditClub
                    clubData={mockClubData}
                    members={mockParticipants}
                    onUpdateClub={(updatedData) => console.log("Save registry global state:", updatedData)}
                    onAddEvent={(newEvent) => console.log("Push event array registry:", newEvent)}
                    onAddPost={(newPost) => console.log("Push announcement array registry:", newPost)}
                    onKickMember={(id) => console.log("Execute removal lifecycle identifier:", id)}
                    onToggleRole={(id) => console.log("Modify system security flag architecture for user:", id)}
                  />
                )}

              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR COLUMN: Counters & Quick Insights */}
          <div className="space-y-6">
            <div className="bg-card border border-customBorder rounded-xl p-5 transition-colors">
              <h3 className="text-xs font-bold uppercase tracking-wider text-subText mb-4">Forge Ecosystem</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-primary border border-customBorder p-3 rounded-lg transition-colors">
                  <Users className="w-5 h-5 mx-auto text-accent mb-1" />
                  <div className="text-lg font-black text-mainText">{mockClubData.memberCount}</div>
                  <div className="text-[10px] uppercase font-semibold text-subText">Members</div>
                </div>
                <div className="bg-primary border border-customBorder p-3 rounded-lg transition-colors">
                  <Calendar className="w-5 h-5 mx-auto text-accent mb-1" />
                  <div className="text-lg font-black text-mainText">{mockClubData.eventCount}</div>
                  <div className="text-[10px] uppercase font-semibold text-subText">Events</div>
                </div>
                <div className="bg-primary border border-customBorder p-3 rounded-lg transition-colors">
                  <FileText className="w-5 h-5 mx-auto text-accent mb-1" />
                  <div className="text-lg font-black text-mainText">{mockClubData.postCount}</div>
                  <div className="text-[10px] uppercase font-semibold text-subText">Posts</div>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-card to-primary border border-customBorder rounded-xl p-5 relative overflow-hidden transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent opacity-5 rounded-full filter blur-xl transform translate-x-8 -translate-y-8" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-1">Weekly Standups</h4>
              <p className="text-xs text-subText leading-relaxed">
                We meet every Thursday evening to review deployment pipelines, share active engineering sprint logs, and grab pizza. All experience levels are welcome!
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Club;