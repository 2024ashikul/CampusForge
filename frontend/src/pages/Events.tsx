import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEventsApi, registerEventApi, type BackendEvent } from '../services/api';
import { PaymentModal } from '../components/PaymentModal';
import { Sparkles, CheckCircle2 } from 'lucide-react';

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
  rawId?: number;
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
  registrantCount?: number;
  isRegistered?: boolean;
  descriptionMarkdown: string;
  resultsSpreadsheetUrl?: string | null;
  announcements?: Announcement[] | null;
  discussion: DiscussionComment[] | null;
  imageUrl?: string | null;
}

// --- Dynamic Fallback Image Mapping ---
const CATEGORY_IMAGES: Record<EventData['type'], string> = {
  competition: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80',
  workshop: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
  'guest-speaker': 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80'
};

const DUMMY_EVENTS: EventData[] = [
  {
    rawId: 1,
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
    registrantCount: 42,
    descriptionMarkdown: 'Long markdown text describing hackathon rubrics...',
    discussion: [],
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80'
  },
  {
    rawId: 2,
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
    registrantCount: 18,
    descriptionMarkdown: 'Long markdown text describing component libraries...',
    discussion: [],
    imageUrl: null
  },
  {
    rawId: 3,
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
    registrantCount: 85,
    descriptionMarkdown: 'Long markdown text detailing guest presentation indexes...',
    resultsSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/dummy-ev-results',
    discussion: [],
    imageUrl: null
  },
  {
    rawId: 4,
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
    registrantCount: 24,
    descriptionMarkdown: 'Long markdown text outlining strict evaluation rules...',
    resultsSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/dummy-cad-results',
    discussion: [],
    imageUrl: null
  },
  {
    rawId: 5,
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
    registrantCount: 60,
    descriptionMarkdown: 'Long markdown content focusing on structural market indexes...',
    discussion: [],
    imageUrl: null
  }
];

type SortOption = 'date-asc' | 'date-desc' | 'alphabetical';
type StatusFilter = 'all' | 'upcoming' | 'completed';

export default function ClubsEventsPage() {
  const navigate = useNavigate();
  const [eventsList, setEventsList] = useState<EventData[]>(DUMMY_EVENTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & State
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('date-asc');

  // Registration & Payment Modal
  const [activePaymentEvent, setActivePaymentEvent] = useState<EventData | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadBackendEvents = async () => {
    setIsLoading(true);
    try {
      const backendEvents = await getEventsApi();
      if (backendEvents && backendEvents.length > 0) {
        const mappedEvents: EventData[] = backendEvents.map((be: BackendEvent) => ({
          rawId: be.id,
          id: `ev-${be.id}`,
          type: (be.event_type as any) || 'workshop',
          status: (be.status as any) || 'upcoming',
          participationType: (be.participation_type as any) || 'individual',
          entranceFee: be.entrance_fee || 'free',
          title: be.title,
          shortDescription: be.short_description,
          clubName: be.club_title || 'Campus Organization',
          tags: be.tags || ['Event', 'Campus'],
          date: be.date,
          time: be.time,
          location: be.location,
          virtualLink: be.virtual_link,
          registrants: [],
          registrantCount: be.registrant_count || 0,
          isRegistered: Boolean(be.is_registered),
          descriptionMarkdown: be.description_markdown || be.short_description,
          imageUrl: be.image_url,
          discussion: [],
        }));
        setEventsList(mappedEvents);
      }
    } catch {
      // Fallback to dummy data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackendEvents();
  }, []);

  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    eventsList.forEach((event) => {
      if (Array.isArray(event.tags)) {
        event.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return ['All', ...Array.from(tagsSet)];
  }, [eventsList]);

  const filteredAndSortedEvents = useMemo(() => {
    let output = [...eventsList];

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      output = output.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.clubName.toLowerCase().includes(q) ||
          e.shortDescription.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      output = output.filter((e) => e.status === statusFilter);
    }

    if (selectedTag !== 'All') {
      output = output.filter((e) => e.tags?.includes(selectedTag));
    }

    output.sort((a, b) => {
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
      return 0;
    });

    return output;
  }, [eventsList, selectedTag, statusFilter, searchQuery, sortBy]);

  const metrics = useMemo(() => {
    return {
      total: eventsList.length,
      upcoming: eventsList.filter((e) => e.status === 'upcoming').length,
      completed: eventsList.filter((e) => e.status === 'completed').length,
    };
  }, [eventsList]);

  const handleOpenRegisterModal = (event: EventData) => {
    if (event.isRegistered) return;
    setActivePaymentEvent(event);
  };

  return (
    <div className="min-h-screen bg-primary text-mainText px-4 py-8 md:px-8 max-w-[1400px] mx-auto transition-colors duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-accent text-primary px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" /> {notification}
        </div>
      )}

      {/* Header and Compact Meta Badge Section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-customBorder pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">CampusForge Events</h1>
          <p className="text-subText text-sm">Discover and track workshops, design sprints, and active challenges.</p>
        </div>

        {/* Counter Section */}
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
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-card border-customBorder text-subText hover:text-mainText'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Stack List View */}
      <main>
        {filteredAndSortedEvents.length === 0 ? (
          <div className="text-center py-16 bg-card border border-customBorder rounded-xl">
            <p className="text-subText text-sm">No collaborative campus events match your active filters.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAndSortedEvents.map((event) => {
              const isUpcoming = event.status === 'upcoming';
              const resolvedCardImage = event.imageUrl || CATEGORY_IMAGES[event.type];

              return (
                <article
                  key={event.id}
                  className="group bg-card border border-customBorder rounded-xl overflow-hidden shadow-sm hover:border-accent/40 transition-all duration-300 hover:shadow-md flex flex-col md:flex-row"
                >
                  {/* LEFT SIDE: Banner */}
                  <div className="relative w-full md:w-1/4 lg:w-1/5 min-h-[160px] md:min-h-full bg-footer overflow-hidden border-b md:border-b-0 md:border-r border-customBorder/60 flex-shrink-0">
                    <img
                      src={resolvedCardImage}
                      alt={event.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 md:from-black/30 via-transparent to-black/20 pointer-events-none" />

                    <div className="absolute top-3 left-3 right-3 flex md:flex-col lg:flex-row gap-2 items-start justify-between pointer-events-none">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs border border-white/10 text-white shadow-sm">
                        {event.type.replace('-', ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-xs shadow-sm ${
                          isUpcoming
                            ? 'bg-accent text-white font-black'
                            : 'bg-black/60 text-neutral-400 border border-white/10'
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="p-5 flex-1 flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
                    <div className="space-y-2 flex-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <h3
                          onClick={() => navigate(`/event/${event.rawId || event.id}`)}
                          className="text-xl font-bold text-mainText tracking-tight group-hover:text-accent transition-colors duration-200 cursor-pointer"
                        >
                          {event.title}
                        </h3>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-white/5 border border-white/10 rounded text-blue-400">
                          {event.entranceFee}
                        </span>
                      </div>

                      <p className="text-sm text-subText line-clamp-2 leading-relaxed">
                        {event.shortDescription}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {event.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-subText/80 px-2 py-0.5 rounded bg-primary border border-customBorder/40"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-6 flex-shrink-0 border-t lg:border-t-0 border-customBorder/40 pt-4 lg:pt-0">
                      <div className="flex flex-col gap-3 min-w-[200px] text-xs">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-subText/50 tracking-wider">Timeline</span>
                          <span className="text-mainText font-semibold">{event.date}</span>
                          <span className="text-subText/80 ml-1.5">@ {event.time}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] uppercase font-bold text-subText/50 tracking-wider">Location</span>
                          <span className="text-mainText font-medium truncate block max-w-[240px]">{event.location}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] uppercase font-bold text-subText/50 tracking-wider">Host Club</span>
                          <span className="text-accent font-semibold block truncate max-w-[240px]">{event.clubName}</span>
                        </div>
                      </div>

                      <div className="w-full sm:w-44 flex flex-col gap-2 flex-shrink-0">
                        {event.isRegistered ? (
                          <button
                            disabled
                            className="w-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Registered
                          </button>
                        ) : isUpcoming ? (
                          <button
                            onClick={() => handleOpenRegisterModal(event)}
                            className="w-full bg-accent text-primary hover:bg-accentHover text-xs font-bold py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-md cursor-pointer text-center"
                          >
                            Register ({event.entranceFee})
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/event/${event.rawId || event.id}`)}
                            className="w-full bg-primary border border-customBorder text-subText hover:text-mainText text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-center"
                          >
                            View Event Details
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/event/${event.rawId || event.id}`)}
                          className="w-full text-[11px] text-subText hover:text-mainText font-medium text-center hover:underline cursor-pointer"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* --- Registration & Payment Modal --- */}
      <PaymentModal
        isOpen={!!activePaymentEvent}
        onClose={() => setActivePaymentEvent(null)}
        title={activePaymentEvent?.title || ''}
        subtitle={`Host: ${activePaymentEvent?.clubName} | Date: ${activePaymentEvent?.date}`}
        fee={activePaymentEvent?.entranceFee || 'Free'}
        type="event"
        participationType={activePaymentEvent?.participationType}
        onConfirm={async (method, teamName) => {
          if (!activePaymentEvent) return;
          if (activePaymentEvent.rawId) {
            const res = await registerEventApi(activePaymentEvent.rawId, teamName, method);
            setNotification(res.detail || `Registered for ${activePaymentEvent.title}!`);
          } else {
            setNotification(`Registered for ${activePaymentEvent.title}!`);
          }
          setActivePaymentEvent(null);
          await loadBackendEvents();
          setTimeout(() => setNotification(null), 4000);
        }}
      />
    </div>
  );
}