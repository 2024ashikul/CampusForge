import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEventsApi, registerEventApi, type BackendEvent } from '../services/api';
import { PaymentModal } from '../components/PaymentModal';
import { Toast } from '../components/ui/Toast';
import { CheckCircle2, CalendarDays, Search, MapPin, Clock, ArrowRight } from 'lucide-react';
import { formatEventDateTime } from '../interfaces/event.type';

export interface EventData {
  rawId?: number;
  id: string;
  type: 'workshop' | 'competition' | 'guest-speaker' | 'seminar';
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed';
  participationType: 'individual' | 'team';
  entranceFee: 'free' | string;
  title: string;
  shortDescription: string;
  clubName: string;
  tags: string[];
  date: string;
  time: string;
  location: string;
  registrantCount?: number;
  isRegistered?: boolean;
  imageUrl?: string | null;
}

const CATEGORY_IMAGES: Record<EventData['type'], string> = {
  competition: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80',
  workshop: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
  'guest-speaker': 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80',
  seminar: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80',
};

const TYPE_LABELS: Record<string, string> = {
  competition: 'Competition',
  workshop: 'Workshop',
  'guest-speaker': 'Guest Speaker',
  seminar: 'Seminar',
};

const DUMMY_EVENTS: EventData[] = [
  {
    rawId: 1, id: 'ev-1', type: 'competition', status: 'upcoming', participationType: 'team',
    entranceFee: 'free', title: 'ByteCraft Hackathon 2026',
    shortDescription: 'The ultimate campus-wide 36-hour hackathon targeting web3 and sustainability paradigms.',
    clubName: 'Google Developer Student Club', tags: ['Next.js', 'Hackathon', 'Web3'],
    date: '2026-06-15', time: '09:00 AM', location: 'Main Auditorium', registrantCount: 42,
  },
  {
    rawId: 2, id: 'ev-2', type: 'workshop', status: 'upcoming', participationType: 'individual',
    entranceFee: '$10', title: 'UI/UX Design Systems Mastery',
    shortDescription: 'Construct complex, highly scalable atomic design components in Figma.',
    clubName: 'Pixel Perfect Club', tags: ['Design', 'Figma'],
    date: '2026-05-28', time: '02:30 PM', location: 'Design Lab 3', registrantCount: 18,
  },
  {
    rawId: 3, id: 'ev-3', type: 'guest-speaker', status: 'completed', participationType: 'individual',
    entranceFee: 'free', title: 'Future of EV and Clean Energy',
    shortDescription: 'An interactive seminar on engineering trends in electric vehicles.',
    clubName: 'Robotics Society', tags: ['Hardware', 'EV'],
    date: '2026-05-10', time: '11:00 AM', location: 'Seminar Hall B', registrantCount: 85,
  },
];

type SortOption = 'date-asc' | 'date-desc' | 'alphabetical';
type StatusFilter = 'all' | 'draft' | 'upcoming' | 'ongoing' | 'completed';

export default function EventsPage() {
  const navigate = useNavigate();
  const [eventsList, setEventsList] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedTag, setSelectedTag] = useState('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-asc');

  const [activePaymentEvent, setActivePaymentEvent] = useState<EventData | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadBackendEvents = async () => {
    setIsLoading(true);
    try {
      const backendEvents = await getEventsApi();
      setEventsList(backendEvents.map((be: BackendEvent) => {
          const dt = formatEventDateTime(be.start_time);
          return {
            rawId: be.id,
            id: `ev-${be.id}`,
            type: (be.event_type as EventData['type']) || 'workshop',
            status: (be.status as EventData['status']) || 'upcoming',
            participationType: (be.settings?.participation_type as EventData['participationType']) || 'individual',
            entranceFee: be.settings?.entrance_fee || 'free',
            title: be.title,
            shortDescription: be.short_description,
            clubName: be.club_title || 'Campus Organization',
            tags: be.tags || ['Event'],
            date: dt.date,
            time: dt.time,
            location: be.details?.location || 'Main Auditorium',
            registrantCount: be.registrant_count || 0,
            isRegistered: Boolean(be.is_registered),
            imageUrl: be.details?.banner_url || undefined,
          };
        }));
    } catch { setEventsList([]); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadBackendEvents(); }, []);

  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>();
    eventsList.forEach((e) => e.tags?.forEach((t) => tags.add(t)));
    return ['All', ...Array.from(tags)];
  }, [eventsList]);

  const filteredEvents = useMemo(() => {
    let output = [...eventsList];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      output = output.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.clubName.toLowerCase().includes(q) ||
        e.shortDescription.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') output = output.filter((e) => e.status === statusFilter);
    if (selectedTag !== 'All') output = output.filter((e) => e.tags?.includes(selectedTag));

    output.sort((a, b) => {
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      return a.title.localeCompare(b.title);
    });
    return output;
  }, [eventsList, selectedTag, statusFilter, searchQuery, sortBy]);

  return (
    <div className="page-container">
      <Toast message={notification} />

      <header className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-5 h-5 text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-accent">Campus Events</span>
          </div>
          <h1 className="page-title">Discover What's Happening</h1>
          <p className="page-subtitle">
            Workshops, hackathons, and competitions hosted by campus clubs — register and participate.
          </p>
        </div>
      </header>

      <section className="filter-panel space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subText" />
            <input
              type="text"
              placeholder="Search events, clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap rounded-lg bg-primary p-1 border border-customBorder">
              {(['all', 'draft', 'upcoming', 'ongoing', 'completed'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md capitalize transition-all cursor-pointer ${
                    statusFilter === s ? 'bg-accent text-[#101614]' : 'text-subText hover:text-mainText'
                  }`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="input-field w-auto text-xs py-2"
            >
              <option value="date-asc">Soonest First</option>
              <option value="date-desc">Latest First</option>
              <option value="alphabetical">A–Z</option>
            </select>
          </div>
        </div>
        <div className="filter-chip-row">
          {allUniqueTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                selectedTag === tag
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'border-customBorder text-subText hover:text-mainText'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <main>
        {isLoading ? (
          <div className="empty-state">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
            <p className="text-subText text-sm">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <CalendarDays className="w-10 h-10 text-subText/30 mb-3" />
            <p className="text-subText text-sm">No events match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredEvents.map((event) => {
              const isUpcoming = event.status === 'upcoming';
              const image = event.imageUrl || CATEGORY_IMAGES[event.type];

              return (
                <article key={event.id} onClick={() => navigate(`/event/${event.rawId || event.id}`)} className="entity-card flex flex-col overflow-hidden cursor-pointer">
                  <div className="relative h-36 overflow-hidden">
                    <img src={image} alt="" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="status-pill bg-black/50 text-white border-white/10 backdrop-blur-sm">
                        {TYPE_LABELS[event.type]}
                      </span>
                      <span className={`status-pill ${isUpcoming ? 'status-upcoming' : 'status-completed'}`}>
                        {event.status}
                      </span>
                    </div>
                    <span className="absolute bottom-3 right-3 text-xs font-bold px-2 py-0.5 rounded-lg bg-black/50 text-white backdrop-blur-sm">
                      {event.entranceFee}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3
                      onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.rawId || event.id}`); }}
                      className="text-lg font-bold text-mainText hover:text-accent transition-colors cursor-pointer mb-1"
                    >
                      {event.title}
                    </h3>
                    <p className="text-sm text-subText line-clamp-2 leading-relaxed flex-1">
                      {event.shortDescription}
                    </p>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-subText">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span className="font-semibold text-mainText">{event.date}</span>
                        <Clock className="w-3 h-3 ml-1" /> {event.time}
                      </div>
                      <div className="flex items-center gap-1.5 text-subText">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="text-accent font-semibold">Hosted by {event.clubName}</div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {event.tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-footer border border-customBorder text-subText">
                          {tag}
                        </span>
                      ))}
                      {event.participationType === 'team' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400">
                          Team Event
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-5 flex gap-2">
                    {event.isRegistered ? (
                      <button disabled className="btn-secondary flex-1 opacity-70 cursor-default">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Registered
                      </button>
                    ) : isUpcoming ? (
                      <button onClick={(e) => { e.stopPropagation(); setActivePaymentEvent(event); }} className="btn-primary flex-1">
                        Register · {event.entranceFee}
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.rawId || event.id}`); }} className="btn-secondary flex-1">
                        View Results
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.rawId || event.id}`); }} className="btn-ghost px-3">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <PaymentModal
        isOpen={!!activePaymentEvent}
        onClose={() => setActivePaymentEvent(null)}
        title={activePaymentEvent?.title || ''}
        subtitle={`${activePaymentEvent?.clubName} · ${activePaymentEvent?.date}`}
        fee={activePaymentEvent?.entranceFee || 'Free'}
        type="event"
        participationType={activePaymentEvent?.participationType}
        onConfirm={async (teamName?: string) => {
          if (!activePaymentEvent) return;
          if (activePaymentEvent.rawId) {
            const res = await registerEventApi(activePaymentEvent.rawId, teamName);
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
