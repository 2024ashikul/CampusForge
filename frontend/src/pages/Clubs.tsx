import React, { useState, useMemo } from 'react';

// --- Schema Interfaces ---
export interface ClubSocials {
  discordUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
}

export interface ClubData {
  id: string;
  category: 'technical' | 'cultural' | 'sports' | 'business';
  isRecruiting: boolean;
  joinFormat: 'open' | 'interview' | 'portfolio-review';
  membershipFee: 'free' | string;
  name: string;
  briefIntro: string;
  leadName: string;
  tags: string[];
  foundedDate: string;
  baseDepartment: string;
  memberCount: number;
  socials: ClubSocials;
  detailedMarkdown: string;
}

// --- Dynamic Campus Clubs Dummy Data ---
const DUMMY_CLUBS: ClubData[] = [
  {
    id: 'club-1',
    category: 'technical',
    isRecruiting: true,
    joinFormat: 'interview',
    membershipFee: 'free',
    name: 'Google Developer Student Club',
    briefIntro: 'The premier technical collective for scaling software products, exploring AI tooling, and building community ecosystems.',
    leadName: 'Alex Rivers',
    tags: ['Web3', 'AI', 'Cloud', 'Open Source'],
    foundedDate: '2023-09-12',
    baseDepartment: 'Computer Science',
    memberCount: 142,
    socials: { discordUrl: 'https://discord.gg/gdsc' },
    detailedMarkdown: 'Deep-dive background layout content...'
  },
  {
    id: 'club-2',
    category: 'technical',
    isRecruiting: true,
    joinFormat: 'portfolio-review',
    membershipFee: '$5 Cash',
    name: 'Pixel Perfect Design Club',
    briefIntro: 'Crafting pixel-perfect interface components, establishing unified design tokens, and hosting multi-campus Figma hackathons.',
    leadName: 'Sarah Chen',
    tags: ['UI/UX', 'Figma', 'Product Design'],
    foundedDate: '2024-02-15',
    baseDepartment: 'Design Architecture',
    memberCount: 68,
    socials: {},
    detailedMarkdown: 'Deep-dive background layout content...'
  },
  {
    id: 'club-3',
    category: 'technical',
    isRecruiting: false,
    joinFormat: 'interview',
    membershipFee: 'free',
    name: 'Robotics & Automation Society',
    briefIntro: 'Designing high-performance mechanical systems, firmware control loops, and autonomous EV prototypes.',
    leadName: 'Marcus Vance',
    tags: ['EV', 'Hardware', 'ROS', 'Firmware'],
    foundedDate: '2022-05-10',
    baseDepartment: 'Mechanical & Electrical',
    memberCount: 95,
    socials: { githubUrl: 'https://github.com/campusforge-robotics' },
    detailedMarkdown: 'Deep-dive background layout content...'
  },
  {
    id: 'club-4',
    category: 'business',
    isRecruiting: false,
    joinFormat: 'open',
    membershipFee: 'free',
    name: 'WallStreet Quantitative Finance Club',
    briefIntro: 'Analyzing live market data and executing programmatic trade formulas using Python algorithms.',
    leadName: 'Elena Rostova',
    tags: ['Trading', 'Finance', 'Python', 'Data Analytics'],
    foundedDate: '2025-01-20',
    baseDepartment: 'Business Analytics',
    memberCount: 110,
    socials: {},
    detailedMarkdown: 'Deep-dive background layout content...'
  },
  {
    id: 'club-5',
    category: 'cultural',
    isRecruiting: true,
    joinFormat: 'open',
    membershipFee: 'free',
    name: 'Forge Creative Arts Collective',
    briefIntro: 'Uniting musicians, digital painters, and performance artists for collaborative multimedia canvas events.',
    leadName: 'Liam Cross',
    tags: ['Music', 'Art', 'Production', 'Media'],
    foundedDate: '2023-11-01',
    baseDepartment: 'Fine Arts',
    memberCount: 54,
    socials: {},
    detailedMarkdown: 'Deep-dive background layout content...'
  }
];

type SortOption = 'member-count-desc' | 'alphabetical' | 'newest';
type StatusFilter = 'all' | 'recruiting' | 'closed';

export default function CampusForgeClubsPage() {
  // --- Local Filtering States ---
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('member-count-desc');

  // --- Dynamic Meta Tag Extraction ---
  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    DUMMY_CLUBS.forEach((club) => {
      if (Array.isArray(club.tags)) {
        club.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return ['All', ...Array.from(tagsSet)];
  }, []);

  // --- Filtering and Processing Pipeline ---
  const filteredAndSortedClubs = useMemo(() => {
    let output = [...DUMMY_CLUBS];

    // Search query matching
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      output = output.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.briefIntro.toLowerCase().includes(q) ||
          c.baseDepartment.toLowerCase().includes(q)
      );
    }

    // Recruitment Status filters
    if (statusFilter === 'recruiting') {
      output = output.filter((c) => c.isRecruiting);
    } else if (statusFilter === 'closed') {
      output = output.filter((c) => !c.isRecruiting);
    }

    // Custom Tag matching
    if (selectedTag !== 'All') {
      output = output.filter((c) => c.tags?.includes(selectedTag));
    }

    // Sort evaluation matrices
    output.sort((a, b) => {
      if (sortBy === 'member-count-desc') return b.memberCount - a.memberCount;
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      if (sortBy === 'newest') return new Date(b.foundedDate).getTime() - new Date(a.foundedDate).getTime();
      return 0;
    });

    return output;
  }, [selectedTag, statusFilter, searchQuery, sortBy]);

  // --- Compact Overview Metrics ---
  const metrics = useMemo(() => {
    return {
      total: DUMMY_CLUBS.length,
      recruiting: DUMMY_CLUBS.filter((c) => c.isRecruiting).length,
      totalMembers: DUMMY_CLUBS.reduce((sum, c) => sum + c.memberCount, 0),
    };
  }, []);

  return (
    <div className="min-h-screen bg-primary text-mainText px-4 py-8 md:px-8 max-w-(--width-total) mx-auto transition-colors duration-200">
      
      {/* Header and Integrated Compact Analytics Bar */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-customBorder pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">CampusForge Clubs</h1>
          <p className="text-subText text-sm">Browse, evaluate, and join registered student operations and field ecosystems.</p>
        </div>

        {/* Re-engineered Compact Meta Badge Section */}
        <div className="flex flex-wrap items-center gap-2 bg-card border border-customBorder rounded-xl p-2.5 shadow-sm max-w-max">
          <div className="px-3 py-1 bg-footer rounded-lg text-center">
            <span className="block text-[10px] text-subText font-bold uppercase tracking-wider">Total Clubs</span>
            <span className="text-sm font-black text-mainText">{metrics.total}</span>
          </div>
          <div className="w-px h-6 bg-customBorder" />
          <div className="px-3 py-1 bg-footer rounded-lg text-center">
            <span className="block text-[10px] text-accent font-bold uppercase tracking-wider">Hiring</span>
            <span className="text-sm font-black text-accent">{metrics.recruiting}</span>
          </div>
          <div className="w-px h-6 bg-customBorder" />
          <div className="px-3 py-1 bg-footer rounded-lg text-center">
            <span className="block text-[10px] text-subText font-bold uppercase tracking-wider">Community Size</span>
            <span className="text-sm font-black text-subText">{metrics.totalMembers}</span>
          </div>
        </div>
      </header>

      {/* Control Navigation Deck */}
      <section className="bg-footer border border-customBorder rounded-xl p-5 mb-8 space-y-4">
        
        {/* Search & Status Sort Combos */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search via club title, department clusters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-primary border border-customBorder text-mainText rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-subText/50"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Recruitment Pipeline Filters */}
            <div className="inline-flex rounded-lg bg-primary p-1 border border-customBorder">
              {(['all', 'recruiting', 'closed'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                    statusFilter === status
                      ? 'bg-card text-accent shadow-sm'
                      : 'text-subText hover:text-mainText'
                  }`}
                >
                  {status === 'all' ? 'All Units' : status}
                </button>
              ))}
            </div>

            {/* General Sorting Combobox */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-primary border border-customBorder text-mainText rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="member-count-desc">Size: Largest First</option>
              <option value="alphabetical">Name (A-Z)</option>
              <option value="newest">Est. Timeline: Newest</option>
            </select>
          </div>
        </div>

        {/* Dynamic Filtering by Tags System */}
        <div className="border-t border-customBorder/50 pt-3">
          <span className="block text-subText text-[11px] font-bold uppercase tracking-wider mb-2">
            Sort / Filter by Meta Fields
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

      {/* Grid Canvas */}
      <main>
        {filteredAndSortedClubs.length === 0 ? (
          <div className="text-center py-16 bg-card border border-customBorder rounded-xl">
            <p className="text-subText text-sm">No campus clubs or organizations match your active tags.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSortedClubs.map((club) => {
              const isHiring = club.isRecruiting;
              const isFree = club.membershipFee.toLowerCase() === 'free';

              return (
                <article
                  key={club.id}
                  className="bg-card border border-customBorder rounded-xl flex flex-col justify-between overflow-hidden shadow-sm hover:border-accent/40 transition-all duration-200"
                >
                  <div className="p-5">
                    {/* Upper Metadata Flag Layout */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-footer border border-customBorder text-subText">
                        {club.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isHiring
                            ? 'bg-accent/10 text-accent'
                            : 'bg-footer text-subText border border-customBorder'
                        }`}
                      >
                        {isHiring ? 'Recruiting' : 'Closed'}
                      </span>
                    </div>

                    {/* Content Header Rows */}
                    <h3 className="text-lg font-bold text-mainText mb-0.5 tracking-tight">
                      {club.name}
                    </h3>
                    <p className="text-xs font-medium text-accent mb-3">Lead: {club.leadName}</p>

                    {/* Introductory information field */}
                    <p className="text-xs text-subText line-clamp-3 mb-4 leading-relaxed">
                      {club.briefIntro}
                    </p>

                    {/* In-Card Display of Associated Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {club.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-subText/80 px-1.5 py-0.5 rounded bg-primary/60 border border-customBorder/40"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Operational Metrics Deck & Clean Action Footer */}
                  <div className="p-5 pt-0 mt-auto">
                    <div className="bg-footer rounded-lg p-3 border border-customBorder space-y-2 text-xs text-subText">
                      <div className="flex justify-between items-center">
                        <span>Base Dept:</span>
                        <span className="text-mainText font-medium truncate max-w-[150px]">{club.baseDepartment}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Active Members:</span>
                        <span className="text-mainText font-medium">{club.memberCount} enrolled</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Dues / Cost:</span>
                        <span className={`font-semibold capitalize ${isFree ? 'text-accent' : 'text-mainText'}`}>
                          {club.membershipFee}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Entry Format:</span>
                        <span className="text-mainText font-medium capitalize bg-primary/40 border border-customBorder/50 px-2 py-0.5 rounded text-[11px]">
                          {club.joinFormat.replace('-', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Unified Footer Layout: Exactly one clear action trigger */}
                    <div className="mt-4 pt-1">
                      {isHiring ? (
                        <button className="w-full bg-accent text-accent text-xs font-bold py-2 rounded-lg transition-transform active:scale-[0.99]">
                          View Club (Apply Now)
                        </button>
                      ) : (
                        <button className="w-full bg-primary border border-customBorder text-subText hover:text-mainText text-xs font-semibold py-2 rounded-lg transition-colors">
                          View Club (Full Roster)
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