import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Users, 
  FileText, 
  MapPin, 
  Flame, 
  MessageSquare, 
  Compass, 
  CheckCircle2, 
  Plus, 
  ExternalLink,
  Search
} from 'lucide-react';



import type { PostData } from '../interfaces/post.type';
import type { EventData } from '../interfaces/event.type';
import type { Student } from '../interfaces/student.type';
import type { ReactionType } from '../interfaces/post.type';

// ==========================================
// COMPREHENSIVE PRODUCTION MOCK DATA ARRAYS
// ==========================================

const MOCK_EVENTS: EventData[] = [
  {
    id: 'ev-101',
    type: 'competition',
    status: 'upcoming',
    title: 'Inter-Departmental Algorithmic Sprint',
    shortDescription: 'Compete in containerized sandboxes to solve low-latency scaling bottlenecks.',
    clubName: 'AI Development Guild',
    tags: [],
    date: 'May 28, 2026',
    time: '14:00 - 18:00',
    location: 'Advanced Computing Lab (Block C)',
    spotsLeft: 12,
    totalSpots: 50,
    registrants: [],
    descriptionMarkdown: '',
    discussion: []
  },
  {
    id: 'ev-102',
    type: 'workshop',
    status: 'upcoming',
    title: 'Embedded RTOS & Microkernel Architecture',
    shortDescription: 'Hands-on flashing of deterministic tasks onto real-time sensor array kits.',
    clubName: 'Robotics & Automation Society',
    tags: [],
    date: 'Jun 02, 2026',
    time: '10:00 - 13:00',
    location: 'Lab 4, Engineering Core',
    spotsLeft: 4,
    totalSpots: 30,
    registrants: [],
    descriptionMarkdown: '',
    discussion: []
  }
];

const MOCK_FEED: PostData[] = [
  {
    id: 'post-901',
    title: 'Autonomous Solar Rover Ecosystem',
    postType: 'PROJECT',
    markdownContent: 'An automated navigation and battery-monitoring array utilizing lightweight RTOS microkernels.',
    createdAt: '2 hours ago',
    author: {
      id: 'auth-cl-1',
      name: 'Robotics & Automation Society',
      avatar: '🤖',
      association: 'CLUB',
      roleTitle: 'Core Engineering Group'
    },
    attachments: [{ id: 'at-1', postId: 'post-901', type: 'LINK', url: '#', name: 'Repository Specification' }],
    comments: [],
    tags: ['Hardware', 'C++', 'RTOS'],
    reactions: { 'u-1': 'LIKE', 'u-2': 'STAR' }
  },
  {
    id: 'post-902',
    title: 'Architecting zero-allocation buffers in concurrent Go arrays',
    postType: 'DISCUSSION',
    markdownContent: 'Bypassing the heap allocator by recycling arrays via local synchronization pools under high network traffic thresholds.',
    createdAt: '1 day ago',
    author: {
      id: 'auth-st-2',
      name: 'Sarah Chen',
      avatar: '👩‍💻',
      association: 'STUDENT',
      roleTitle: 'Systems Contributor'
    },
    attachments: null,
    comments: [
      { id: 'c-1', postId: 'post-902', parentId: null, authorName: 'Marcus Vance', authorAvatar: '🤖', content: 'Incredible speedups seen on embedded nodes.', createdAt: '12h ago', reactions: {} }
    ],
    tags: ['Go', 'Concurrency', 'Backend'],
    reactions: { 'u-3': 'LIKE' }
  }
];

const MOCK_TRENDING_STUDENTS: Partial<Student>[] = [
  {
    studentId: 'STU-2026-9912',
    name: 'Sarah Chen',
    department: 'Computer Science & Engineering',
    bio: 'Concurrent systems enthusiast.',
    skills: [{ name: 'Rust', level: 'Advanced' }, { name: 'Go', level: 'Advanced' }]
  },
  {
    studentId: 'STU-2026-0841',
    name: 'Marcus Vance',
    department: 'Robotics Engineering',
    bio: 'Deterministic execution engineer.',
    skills: [{ name: 'C++', level: 'Advanced' }, { name: 'RTOS', level: 'Advanced' }]
  }
];

export const Home: React.FC = () => {
  // --- Component Memory Layouts ---
  const [feedPosts, setFeedPosts] = useState<PostData[]>(MOCK_FEED);
  const [events, setEvents] = useState<EventData[]>(MOCK_EVENTS);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [activeFeedTab, setActiveFeedTab] = useState<'ALL' | 'PROJECT' | 'DISCUSSION'>('ALL');
  
  // Track system interactive user states
  const [userQuickPostText, setUserQuickPostText] = useState<string>('');
  const [rsvpedEvents, setRsvpedEvents] = useState<string[]>([]);

  // --- Dynamic System State Modification Interactions ---
  const handleCreateQuickPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuickPostText.trim()) return;

    const newPost: PostData = {
      id: `post-${Date.now()}`,
      title: 'Global System Update Broadcast',
      postType: 'DISCUSSION',
      markdownContent: userQuickPostText,
      createdAt: 'Just now',
      author: {
        id: 'current-user-node',
        name: 'Alex Rivera',
        avatar: '👨‍💻',
        association: 'STUDENT',
        roleTitle: 'Platform Member'
      },
      attachments: null,
      comments: [],
      tags: ['General'],
      reactions: {}
    };

    setFeedPosts([newPost, ...feedPosts]);
    setUserQuickPostText('');
  };

  const toggleRSVP = (eventId: string) => {
    setRsvpedEvents(prev => 
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
    
    setEvents(prevEvents => prevEvents.map(evt => {
      if (evt.id === eventId) {
        const isDeducting = rsvpedEvents.includes(eventId);
        return {
          ...evt,
          spotsLeft: isDeducting ? evt.spotsLeft + 1 : evt.spotsLeft - 1
        };
      }
      return evt;
    }));
  };

  const handleReactionClick = (postId: string, reaction: ReactionType) => {
    setFeedPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      const currentReactions = { ...(post.reactions || {}) };
      
      if (currentReactions['current-user-node'] === reaction) {
        delete currentReactions['current-user-node'];
      } else {
        currentReactions['current-user-node'] = reaction;
      }
      return { ...post, reactions: currentReactions };
    }));
  };

  // --- Search Filtering and Sorting Operations Pipeline ---
  const processedFeed = useMemo(() => {
    let output = [...feedPosts];

    if (activeFeedTab !== 'ALL') {
      output = output.filter(p => p.postType === activeFeedTab);
    }

    if (globalSearch.trim() !== '') {
      const q = globalSearch.toLowerCase();
      output = output.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.markdownContent.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    return output;
  }, [feedPosts, activeFeedTab, globalSearch]);

  return (
    <div className="min-h-screen bg-primary text-mainText px-4 py-8 md:px-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- Global System Header Vector --- */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-customBorder">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">CampusForge Hub</h1>
            <p className="text-subText text-sm">Synchronized workspace processing live engineering indexes, club events, and peer deployments.</p>
          </div>

          {/* Unified Global Search Element */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-subText/60">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Query events, skills, or nodes..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-footer border border-customBorder text-mainText rounded-xl pl-9 pr-4 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-subText/40 shadow-inner"
            />
          </div>
        </header>

        {/* --- Primary Tri-Column Dashboard Architecture --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* =========================================================================
              COLUMN 1: USER CONTEXT & TRENDING TAXONOMIES (LEFT PINNED SECTION - 25%)
              ========================================================================= */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Session Identity Panel */}
            <div className="bg-card border border-customBorder rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-footer border border-customBorder flex items-center justify-center text-2xl shadow-inner">
                  👨‍💻
                </div>
                <div>
                  <h3 className="text-sm font-black text-mainText leading-none">Alex Rivera</h3>
                  <span className="text-[10px] font-mono text-accent block mt-1">STU-2026-0419</span>
                </div>
              </div>
              <p className="text-[11px] text-subText leading-relaxed mb-4">
                Systems Engineering Track • Connected via local node deployment array.
              </p>
              <a 
                href="/profile/STU-2026-0419" 
                className="block text-center w-full py-2 bg-footer hover:bg-primary border border-customBorder text-mainText hover:text-accent font-bold text-xs rounded-xl transition-all"
              >
                Configure System Profile
              </a>
            </div>

            {/* Trending Technology Matrices */}
            <div className="bg-card border border-customBorder rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-subText text-[10px] font-bold uppercase tracking-wider">
                <Flame size={12} className="text-accent" />
                <span>Trending Tech Registers</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {['#Rust', '#Go', '#RTOS', '#PyTorch', '#C++', '#Kubernetes', '#Docker'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setGlobalSearch(tag.replace('#', ''))}
                    className="text-[10px] font-mono px-2 py-1 bg-footer hover:bg-primary border border-customBorder rounded-md text-subText hover:text-mainText transition-all cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Micro Club Alignment Registry */}
            <div className="bg-card border border-customBorder rounded-2xl p-4 space-y-3">
              <div className="text-subText text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                <Users size={12} />
                <span>Verified Club Networks</span>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'AI Development Guild', logo: '🏰', role: 'Member' },
                  { name: 'Robotics & Automation Society', logo: '🤖', role: 'Lead Architect' }
                ].map((club, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-footer border border-customBorder rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{club.logo}</span>
                      <span className="text-xs font-bold text-mainText truncate max-w-[120px]">{club.name}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-primary text-accent rounded border border-customBorder/40">
                      {club.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* =========================================================================
              COLUMN 2: MAIN DYNAMIC CONTENT PIPELINE FEED (CENTER SECTION - 50%)
              ========================================================================= */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Direct Quick Post Form Channel */}
            <form onSubmit={handleCreateQuickPost} className="bg-card border border-customBorder rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-footer border border-customBorder flex items-center justify-center text-sm shadow-inner">
                  💬
                </div>
                <textarea
                  placeholder="Broadcast system updates, tech bugs, or ideas to the active network stream..."
                  value={userQuickPostText}
                  onChange={(e) => setUserQuickPostText(e.target.value)}
                  rows={2}
                  className="flex-1 w-full bg-footer text-mainText text-xs p-2.5 rounded-xl border border-customBorder focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-subText/40 resize-none font-sans"
                />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-accent text-primary text-xs font-black rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} strokeWidth={3} /> Broadcast
                </button>
              </div>
            </form>

            {/* Feed Segment Stream Toggles */}
            <div className="flex justify-between items-center bg-footer border border-customBorder rounded-xl p-1">
              <div className="flex gap-1 w-full sm:w-auto">
                {(['ALL', 'PROJECT', 'DISCUSSION'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFeedTab(tab)}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeFeedTab === tab
                        ? 'bg-card text-accent shadow-xs'
                        : 'text-subText hover:text-mainText'
                    }`}
                  >
                    {tab === 'ALL' ? 'Unified Stream' : tab === 'PROJECT' ? 'Deployments' : 'Discussions'}
                  </button>
                ))}
              </div>
              <span className="hidden sm:inline text-[10px] font-mono text-subText/60 px-2">
                Nodes: {processedFeed.length}
              </span>
            </div>

            {/* Primary Infinite Scroll Content Feed Array */}
            <div className="space-y-4">
              {processedFeed.length === 0 ? (
                <div className="text-center py-16 bg-card border border-customBorder rounded-2xl">
                  <Compass className="mx-auto text-subText/30 mb-2" size={32} />
                  <p className="text-subText text-xs font-mono">No network packets match the active filter criteria.</p>
                </div>
              ) : (
                processedFeed.map((post) => {
                  const hasLiked = post.reactions && post.reactions['current-user-node'] === 'LIKE';
                  const hasStarred = post.reactions && post.reactions['current-user-node'] === 'STAR';
                  const reactionCount = post.reactions ? Object.keys(post.reactions).length : 0;

                  return (
                    <article key={post.id} className="bg-card border border-customBorder rounded-2xl p-5 space-y-4 transition-all">
                      {/* Post Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-footer border border-customBorder flex items-center justify-center text-lg shadow-inner">
                            {post.author.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-mainText leading-none">{post.author.name}</h4>
                              <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                                post.author.association === 'CLUB' 
                                  ? 'bg-accent/10 border-accent text-accent' 
                                  : 'bg-footer border-customBorder text-subText'
                              }`}>
                                {post.author.association}
                              </span>
                            </div>
                            <span className="text-[10px] text-subText/70 font-mono mt-1 block">
                              {post.author.roleTitle} • {post.createdAt}
                            </span>
                          </div>
                        </div>

                        {/* Semantic Type Badge */}
                        <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 bg-primary border border-customBorder text-subText rounded-md uppercase">
                          {post.postType}
                        </span>
                      </div>

                      {/* Content Section */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-mainText tracking-tight">{post.title}</h3>
                        <p className="text-xs text-subText leading-relaxed font-sans whitespace-pre-wrap">
                          {post.markdownContent}
                        </p>
                      </div>

                      {/* Meta Tags Footer Row */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.map(t => (
                            <span key={t} className="text-[10px] font-mono text-subText bg-footer px-1.5 py-0.5 rounded border border-customBorder/60">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Post Attachments Payload Panel */}
                      {post.attachments && post.attachments.map(att => (
                        <div key={att.id} className="bg-footer border border-customBorder rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-subText font-mono truncate">
                            <span>🔗</span>
                            <span className="truncate text-mainText font-bold">{att.name || 'System Link Specs'}</span>
                          </div>
                          <a href={att.url} className="text-accent hover:underline flex items-center gap-0.5 font-bold font-mono text-[11px] shrink-0">
                            Inspect <ExternalLink size={10} />
                          </a>
                        </div>
                      ))}

                      {/* Interactions Array Execution Bar */}
                      <div className="border-t border-customBorder/50 pt-3 flex items-center justify-between text-xs">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReactionClick(post.id, 'LIKE')}
                            className={`px-2.5 py-1 rounded-md border text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                              hasLiked 
                                ? 'bg-accent/10 border-accent text-accent font-bold' 
                                : 'bg-footer border-customBorder text-subText hover:text-mainText'
                            }`}
                          >
                            <span>👍</span> {hasLiked ? 'Acknowledged' : 'Like'}
                          </button>
                          <button
                            onClick={() => handleReactionClick(post.id, 'STAR')}
                            className={`px-2.5 py-1 rounded-md border text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                              hasStarred 
                                ? 'bg-accent text-primary border-accent font-bold' 
                                : 'bg-footer border-customBorder text-subText hover:text-mainText'
                            }`}
                          >
                            <span>⭐</span> Star
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-mono text-subText/80">
                          <span className="flex items-center gap-0.5">
                            <MessageSquare size={12} /> {post.comments ? post.comments.length : 0}
                          </span>
                          <span>•</span>
                          <span>Reactions: {reactionCount}</span>
                        </div>
                      </div>

                    </article>
                  );
                })
              )}
            </div>

          </div>

          {/* =========================================================================
              COLUMN 3: LIVE CLUBS & PEER EXCELLENCE (RIGHT PINNED SECTION - 25%)
              ========================================================================= */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Time-Sensitive Event Deployments */}
            <div className="space-y-3">
              <div className="text-subText text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-1">
                <Calendar size={12} className="text-accent" />
                <span>Live Event Horizon</span>
              </div>

              <div className="space-y-3">
                {events.map((evt) => {
                  const isRegistered = rsvpedEvents.includes(evt.id);

                  return (
                    <div key={evt.id} className="bg-card border border-customBorder rounded-2xl p-4 space-y-3 shadow-sm">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <span className="text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 bg-footer border border-customBorder text-accent rounded uppercase">
                            {evt.type}
                          </span>
                          <span className="text-[10px] font-mono text-subText/60">
                            ⏳ {evt.spotsLeft} slots left
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-mainText leading-tight hover:text-accent transition-colors">
                          <a href={`/events/${evt.id}`}>{evt.title}</a>
                        </h4>
                        <span className="text-[10px] font-mono text-subText block mt-1">
                          Organized by: {evt.clubName}
                        </span>
                      </div>

                      <p className="text-[11px] text-subText leading-relaxed line-clamp-2">
                        {evt.shortDescription}
                      </p>

                      <div className="space-y-1 text-[10px] font-mono text-subText/80 bg-footer/50 p-2 rounded-xl border border-customBorder/40">
                        <div className="flex items-center gap-1">
                          <span>📅</span> <span>{evt.date} ({evt.time})</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <MapPin size={10} className="shrink-0" /> <span className="truncate">{evt.location}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleRSVP(evt.id)}
                        className={`w-full py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isRegistered
                            ? 'bg-footer border border-accent text-accent'
                            : 'bg-accent text-primary hover:opacity-90'
                        }`}
                      >
                        {isRegistered ? (
                          <>
                            <CheckCircle2 size={12} strokeWidth={3} /> Secured Node Registry
                          </>
                        ) : (
                          'RSVP Deployment'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Peer Spotlight Module Frame */}
            <div className="bg-card border border-customBorder rounded-2xl p-4 space-y-3">
              <div className="text-subText text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>🌟</span>
                <span>Rising Innovators</span>
              </div>
              
              <div className="space-y-3">
                {MOCK_TRENDING_STUDENTS.map((student) => (
                  <div key={student.studentId} className="p-3 bg-footer border border-customBorder rounded-xl space-y-2">
                    <div>
                      <h5 className="text-xs font-bold text-mainText leading-none">{student.name}</h5>
                      <span className="text-[9px] font-mono text-subText/70 block mt-1 truncate">
                        {student.department}
                      </span>
                    </div>
                    
                    {/* Skills rendering matching your Skill interface array */}
                    <div className="flex flex-wrap gap-1">
                      {student.skills?.map((s, idx) => (
                        <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 bg-primary border border-customBorder/60 text-mainText rounded">
                          {s.name} <span className="opacity-40">({s.level[0]})</span>
                        </span>
                      ))}
                    </div>

                    <a
                      href={`/profile/${student.studentId}`}
                      className="block text-center text-[10px] font-bold text-accent hover:underline pt-1"
                    >
                      Inspect Profile Systems →
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Home;