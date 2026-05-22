import React, { useState, useMemo } from 'react';

// --- Schema Interfaces ---
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

export interface EventData {
  id: string;
  type: 'workshop' | 'competition' | 'guest-speaker';
  status: 'upcoming' | 'completed';
  participationType: 'individual' | 'team';
  entranceFee: 'free' | string; 
  title: string;
  shortDescription: string;
  clubName: string;
  tags: string[];
  date: string;
  time: string;
  location: string;
  virtualLink?: string | null;
  registrants: { id: string; name: string; department: string; teamName: string }[];

  descriptionMarkdown: string;
  resultsSpreadsheetUrl?: string | null;

  announcements?: Announcement[] | null;
  discussion: DiscussionComment[] | null;
}

// --- Updated Dummy Data ---
const DUMMY_EVENTS: EventData[] = [
  {
    id: 'ev-1',
    type: 'competition',
    status: 'upcoming',
    participationType: 'team',
    entranceFee: 'free',
    title: 'ByteCraft Hackathon 2026',
    shortDescription: 'The ultimate campus-wide 36-hour hackathon targeting web3 and sustainability paradigms.',
    clubName: 'Google Developer Student Club',
    tags: ['Next.js', 'Hackathon', 'Web3', 'AI'],
    date: '2026-06-15',
    time: '09:00 AM',
    location: 'Main Auditorium & Discord',
    virtualLink: 'https://discord.gg/campusforge-bytecraft',
    registrants: [],
    descriptionMarkdown: 'Long markdown text describing hackathon rubrics...',
    discussion: []
  },
  {
    id: 'ev-2',
    type: 'workshop',
    status: 'upcoming',
    participationType: 'individual',
    entranceFee: '$10 Cash',
    title: 'UI/UX Design Systems Mastery',
    shortDescription: 'Construct complex, highly scalable atomic design components and interactive tokens in Figma.',
    clubName: 'Pixel Perfect Club',
    tags: ['Design', 'Figma', 'UI/UX'],
    date: '2026-05-28',
    time: '02:30 PM',
    location: 'Design Lab 3',
    registrants: [],
    descriptionMarkdown: 'Long markdown text describing component libraries...',
    discussion: []
  },
  {
    id: 'ev-3',
    type: 'guest-speaker',
    status: 'completed',
    participationType: 'individual',
    entranceFee: 'free',
    title: 'Future of EV and Clean Energy Systems',
    shortDescription: 'An interactive seminar outlining structural engineering trends within high-performance electric vehicles.',
    clubName: 'Robotics & Automation Society',
    tags: ['Hardware', 'EV', 'Electrical'],
    date: '2026-05-10',
    time: '11:00 AM',
    location: 'Seminar Hall B',
    registrants: [],
    descriptionMarkdown: 'Long markdown text detailing guest presentation indexes...',
    resultsSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/dummy-ev-results',
    discussion: []
  },
  {
    id: 'ev-4',
    type: 'competition',
    status: 'completed',
    participationType: 'team',
    entranceFee: '$5 Cash',
    title: 'CAD Solid Modeling Showdown',
    shortDescription: 'Speed assembly competition evaluating constraint management and speed under stressful design parameter prompts.',
    clubName: 'ASME Student Chapter',
    tags: ['Mechanical', 'CAD', 'SolidWorks'],
    date: '2026-04-18',
    time: '01:00 PM',
    location: 'CAD Lab 1',
    registrants: [],
    descriptionMarkdown: 'Long markdown text outlining strict evaluation rules...',
    resultsSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/dummy-cad-results',
    discussion: []
  },
  {
    id: 'ev-5',
    type: 'workshop',
    status: 'upcoming',
    participationType: 'individual',
    entranceFee: 'free',
    title: 'FinTech Basics & Algorithmic Trading',
    shortDescription: 'Analyze real-time market execution protocols using programmatic trade execution scripts.',
    clubName: 'WallStreet Club',
    tags: ['Finance', 'Python', 'Trading'],
    date: '2026-06-02',
    time: '04:00 PM',
    location: 'Virtual Zoom Room 4',
    virtualLink: 'https://zoom.us/j/campusforge-fintech',
    registrants: [],
    descriptionMarkdown: 'Long markdown content focusing on structural market indexes...',
    discussion: []
  }
];

type SortOption = 'date-asc' | 'date-desc' | 'alphabetical';
type StatusFilter = 'all' | 'upcoming' | 'completed';

export default function ClubsEventsPage() {
  // --- Local Management States ---
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('date-asc');

  // --- Dynamic unique tag extraction ---
  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    DUMMY_EVENTS.forEach((event) => {
      if (Array.isArray(event.tags)) {
        event.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return ['All', ...Array.from(tagsSet)];
  }, []);

  // --- Filter and Sort Core Pipeline ---
  const filteredAndSortedEvents = useMemo(() => {
    let output = [...DUMMY_EVENTS];

    // Text Queries
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      output = output.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.clubName.toLowerCase().includes(q) ||
          e.shortDescription.toLowerCase().includes(q)
      );
    }

    // Status Filters
    if (statusFilter !== 'all') {
      output = output.filter((e) => e.status === statusFilter);
    }

    // Dynamic Tag Sorting/Matching
    if (selectedTag !== 'All') {
      output = output.filter((e) => e.tags?.includes(selectedTag));
    }

    // Basic Sorting Handlers
    output.sort((a, b) => {
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
      return 0;
    });

    return output;
  }, [selectedTag, statusFilter, searchQuery, sortBy]);

  // --- Compact Metrics Pipeline ---
  const metrics = useMemo(() => {
    return {
      total: DUMMY_EVENTS.length,
      upcoming: DUMMY_EVENTS.filter((e) => e.status === 'upcoming').length,
      completed: DUMMY_EVENTS.filter((e) => e.status === 'completed').length,
    };
  }, []);

  return (
    <div className="min-h-screen bg-primary text-mainText px-4 py-8 md:px-8 max-w-7xl mx-auto transition-colors duration-200">
      
      {/* Header and Compact Meta Badge Section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-customBorder pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">CampusForge Events</h1>
          <p className="text-subText text-sm">Discover and track workshops, design sprints, and active challenges.</p>
        </div>

        {/* Counter Section: Compact, horizontal inline grid */}
        <div className="flex flex-wrap items-center gap-2 bg-card border border-customBorder rounded-xl p-2.5 shadow-sm max-w-max">
          <div className="px-3 py-1 bg-footer rounded-lg text-center">
            <span className="block text-[10px] text-subText font-bold uppercase tracking-wider">Total</span>
            <span className="text-sm font-black text-mainText">{metrics.total}</span>
          </div>
          <div className="w-px h-6 bg-customBorder" />
          <div className="px-3 py-1 bg-footer rounded-lg text-center">
            <span className="block text-[10px] text-accent font-bold uppercase tracking-wider">Live/Soon</span>
            <span className="text-sm font-black text-accent">{metrics.upcoming}</span>
          </div>
          <div className="w-px h-6 bg-customBorder" />
          <div className="px-3 py-1 bg-footer rounded-lg text-center">
            <span className="block text-[10px] text-subText font-bold uppercase tracking-wider">Archived</span>
            <span className="text-sm font-black text-subText">{metrics.completed}</span>
          </div>
        </div>
      </header>

      {/* Control Panel Area */}
      <section className="bg-footer border border-customBorder rounded-xl p-5 mb-8 space-y-4">
        
        {/* Input Search Controls */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search via clubs, title keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-primary border border-customBorder text-mainText rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-subText/50"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Status Segment Controls */}
            <div className="inline-flex rounded-lg bg-primary p-1 border border-customBorder">
              {(['all', 'upcoming', 'completed'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                    statusFilter === status
                      ? 'bg-card text-accent shadow-sm'
                      : 'text-subText hover:text-mainText'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* General Sorting Combobox */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-primary border border-customBorder text-mainText rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="date-asc">Date: Upcoming First</option>
              <option value="date-desc">Date: Furthest Out</option>
              <option value="alphabetical">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Filtering by Tags System */}
        <div className="border-t border-customBorder/50 pt-3">
          <span className="block text-subText text-[11px] font-bold uppercase tracking-wider mb-2">
            Sort / Filter by Meta Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {allUniqueTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                  selectedTag === tag
                    ? 'bg-accent text-accent border-accent'
                    : 'bg-card border-customBorder text-subText hover:text-mainText'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid View */}
      <main>
        {filteredAndSortedEvents.length === 0 ? (
          <div className="text-center py-16 bg-card border border-customBorder rounded-xl">
            <p className="text-subText text-sm">No collaborative campus events match your active filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSortedEvents.map((event) => {
              const isUpcoming = event.status === 'upcoming';
              const isFree = event.entranceFee.toLowerCase() === 'free';

              return (
                <article
                  key={event.id}
                  className="bg-card border border-customBorder rounded-xl flex flex-col justify-between overflow-hidden shadow-sm hover:border-accent/40 transition-all duration-200"
                >
                  <div className="p-5">
                    {/* Upper Metadata Flag Layout */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-footer border border-customBorder text-subText">
                        {event.type.replace('-', ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isUpcoming
                            ? 'bg-accent/10 text-accent'
                            : 'bg-footer text-subText border border-customBorder'
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>

                    {/* Content Header Rows */}
                    <h3 className="text-lg font-bold text-mainText mb-0.5 tracking-tight">
                      {event.title}
                    </h3>
                    <p className="text-xs font-medium text-accent mb-3">{event.clubName}</p>

                    {/* Integrated shortDescription field */}
                    <p className="text-xs text-subText line-clamp-3 mb-4 leading-relaxed">
                      {event.shortDescription}
                    </p>

                    {/* In-Card Display of Associated Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-subText/80 px-1.5 py-0.5 rounded bg-primary/60 border border-customBorder/40"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Operational Logistics Deck & Adaptive Button Blocks */}
                  <div className="p-5 pt-0 mt-auto">
                    <div className="bg-footer rounded-lg p-3 border border-customBorder space-y-2 text-xs text-subText">
                      <div className="flex justify-between items-center">
                        <span>Timeline:</span>
                        <span className="text-mainText font-medium">{event.date} @ {event.time}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Location:</span>
                        <span className="text-mainText font-medium truncate max-w-[150px]">{event.location}</span>
                      </div>
                      
                      {/* Entry Fee Indicator */}
                      <div className="flex justify-between items-center">
                        <span>Entry Cost:</span>
                        <span className={`font-semibold capitalize ${isFree ? 'text-accent' : 'text-mainText'}`}>
                          {event.entranceFee}
                        </span>
                      </div>

                      {/* Dynamic Format/Type Selector Badge */}
                      <div className="flex justify-between items-center">
                        <span>Format:</span>
                        <span className="text-mainText font-medium capitalize bg-primary/40 border border-customBorder/50 px-2 py-0.5 rounded text-[11px]">
                          {event.participationType}
                        </span>
                      </div>
                    </div>

                    {/* Cleaned Action Footers: Exactly one explicit View Option Button */}
                    <div className="mt-4 pt-1">
                      {isUpcoming ? (
                        <button className="w-full bg-accent text-accent text-xs font-bold py-2 rounded-lg transition-transform active:scale-[0.99]">
                          View Event ({event.participationType === 'team' ? 'Team' : 'Individual'})
                        </button>
                      ) : (
                        <button className="w-full bg-primary border border-customBorder text-subText hover:text-mainText text-xs font-semibold py-2 rounded-lg transition-colors">
                          View Event (Completed)
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}