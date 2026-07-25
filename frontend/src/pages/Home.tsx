import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  Compass,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Users,
  WifiOff,
  X,
} from 'lucide-react';

import type { PostAttachment, PostData } from '../interfaces/post.type';
import type { BackendClub, BackendEvent, BackendUser } from '../services/api';
import {
  createPostApi,
  getClubsApi,
  getEventsApi,
  getPostsApi,
  getUsersApi,
  mapBackendPostToPostData,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/Posts/PostCard';
import { PostForm } from '../components/Posts/PostForm';
import { UserAvatar } from '../components/ui/UserAvatar';
import { formatEventDateTime } from '../interfaces/event.type';

type FeedTab = 'ALL' | 'PROJECT' | 'DISCUSSION';
type SearchKind = 'post' | 'student' | 'club' | 'event';

interface SearchResult {
  id: string;
  kind: SearchKind;
  title: string;
  detail: string;
  href: string;
}

const resultIcon: Record<SearchKind, React.ReactNode> = {
  post: <MessageSquare size={15} />,
  student: <Users size={15} />,
  club: <Building2 size={15} />,
  event: <CalendarDays size={15} />,
};

const resultLabel: Record<SearchKind, string> = {
  post: 'Post', student: 'Student', club: 'Club', event: 'Event',
};

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feedPosts, setFeedPosts] = useState<PostData[]>([]);
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [clubs, setClubs] = useState<BackendClub[]>([]);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [activeFeedTab, setActiveFeedTab] = useState<FeedTab>('ALL');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const loadDashboard = async () => {
    setIsLoading(true);
    const [postsResult, usersResult, clubsResult, eventsResult] = await Promise.allSettled([
      getPostsApi(), getUsersApi(), getClubsApi(), getEventsApi(),
    ]);
    if (postsResult.status === 'fulfilled') {
      setFeedPosts(postsResult.value.map(mapBackendPostToPostData));
      setBackendOnline(true);
    } else {
      setBackendOnline(false);
    }
    if (usersResult.status === 'fulfilled') setUsers(usersResult.value);
    if (clubsResult.status === 'fulfilled') setClubs(clubsResult.value);
    if (eventsResult.status === 'fulfilled') setEvents(eventsResult.value);
    setIsLoading(false);
  };

  useEffect(() => { loadDashboard(); }, []);

  const handlePublish = async (
    title: string,
    markdown: string,
    _association: 'STUDENT' | 'CLUB',
    attachments: Omit<PostAttachment, 'id' | 'postId'>[],
    tags: string[],
  ) => {
    await createPostApi({
      title,
      description: markdown,
      post_type: activeFeedTab === 'PROJECT' ? 'project' : 'general',
      tags,
      media: attachments,
    });
    setIsPostModalOpen(false);
    await loadDashboard();
  };

  const processedFeed = useMemo(() => {
    let output = [...feedPosts];
    if (activeFeedTab !== 'ALL') {
      output = output.filter((post) => activeFeedTab === 'PROJECT' ? post.postType === 'project' : post.postType !== 'project');
    }
    const query = globalSearch.trim().toLowerCase();
    if (query) {
      output = output.filter((post) =>
        post.title.toLowerCase().includes(query) ||
        post.markdownContent.toLowerCase().includes(query) ||
        post.author.name.toLowerCase().includes(query) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }
    return output;
  }, [feedPosts, activeFeedTab, globalSearch]);

  const searchResults = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    if (!query) return [];
    const matches = (values: Array<string | undefined | null>) => values.some((value) => value?.toLowerCase().includes(query));
    return [
      ...feedPosts.filter((post) => matches([post.title, post.markdownContent, post.author.name, ...(post.tags || [])])).map((post) => ({
        id: `post-${post.id}`, kind: 'post' as const, title: post.title, detail: `by ${post.author.name}`, href: '#feed',
      })),
      ...users.filter((person) => matches([person.name, person.department, person.bio, ...(person.skills || []).map((skill) => skill.name)])).map((person) => ({
        id: `student-${person.student_id}`, kind: 'student' as const, title: person.name, detail: person.department, href: `/profile/${person.student_id}`,
      })),
      ...clubs.filter((club) => matches([club.title, club.description, club.details?.category, club.details?.base_department])).map((club) => ({
        id: `club-${club.id}`, kind: 'club' as const, title: club.title, detail: `${club.member_count} members`, href: `/club/${club.id}`,
      })),
      ...events.filter((event) => matches([event.title, event.short_description, event.club_title, event.details?.location, ...(event.tags || [])])).map((event) => ({
        id: `event-${event.id}`, kind: 'event' as const, title: event.title, detail: event.club_title || event.event_type, href: `/event/${event.id}`,
      })),
    ].slice(0, 8);
  }, [globalSearch, feedPosts, users, clubs, events]);

  const upcomingEvents = useMemo(() => events
    .filter((event) => event.status === 'upcoming' || event.status === 'ongoing')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 3), [events]);
  const suggestedClubs = useMemo(() => [...clubs].sort((a, b) => b.member_count - a.member_count).slice(0, 3), [clubs]);
  const peopleToMeet = useMemo(() => users.filter((person) => person.student_id !== user?.student_id).slice(0, 4), [users, user?.student_id]);
  const selectSearchResult = (result: SearchResult) => {
    if (result.href === '#feed') document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' });
    else navigate(result.href);
    setGlobalSearch('');
  };

  return (
    <main className="min-h-screen bg-primary text-mainText">
      <div className="max-w-[1180px] mx-auto px-4 py-6 md:px-5 md:py-8">
        <section className="relative overflow-visible rounded-2xl border border-customBorder bg-card p-5 md:p-7 shadow-sm">
          <div className="absolute inset-0 pointer-events-none opacity-50" style={{ background: 'radial-gradient(circle at 92% 0%, rgba(46,207,139,.20), transparent 32%)' }} />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-[0.18em] mb-2"><Sparkles size={14} /> Campus workspace</div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Good to see you, {user?.name?.split(' ')[0] || 'there'}.</h1>
                <p className="text-subText text-sm mt-2 max-w-xl">Find collaborators, catch the next event, and keep your campus work moving from one place.</p>
              </div>
              <button onClick={() => setIsPostModalOpen(true)} className="btn-primary shrink-0"><Plus size={16} /> Create post</button>
            </div>

            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subText" size={19} />
              <input
                autoComplete="off"
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Escape') setGlobalSearch(''); if (event.key === 'Enter' && searchResults[0]) selectSearchResult(searchResults[0]); }}
                placeholder="Search posts, people, clubs, events, and skills…"
                className="w-full rounded-xl border border-customBorder bg-primary/70 pl-10 pr-9 py-2.5 text-xs text-mainText placeholder:text-subText/60 focus:border-accent focus:outline-none"
              />
              {globalSearch && <button onClick={() => setGlobalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-subText hover:text-mainText p-1"><X size={17} /></button>}
              {globalSearch && (
                <div className="absolute z-30 top-[calc(100%+8px)] w-full rounded-xl border border-customBorder bg-card shadow-2xl overflow-hidden">
                  {searchResults.length ? searchResults.map((result) => (
                    <button key={result.id} onClick={() => selectSearchResult(result)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-footer transition-colors border-b border-customBorder last:border-0">
                      <span className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">{resultIcon[result.kind]}</span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold truncate">{result.title}</span><span className="block text-xs text-subText truncate">{resultLabel[result.kind]} · {result.detail}</span></span>
                      <ChevronRight size={16} className="text-subText" />
                    </button>
                  )) : <div className="p-5 text-center text-sm text-subText">No campus matches for “{globalSearch}”.</div>}
                </div>
              )}
            </div>

          </div>
        </section>

        {backendOnline === false && <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/20 border border-red-500/40 text-sm text-red-300"><WifiOff size={17} /> Campus data is offline. Start the backend to load your live workspace.</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 mt-6">
          <section id="feed" className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div><h2 className="font-bold text-lg">Your campus feed</h2><p className="text-xs text-subText mt-0.5">Updates, discussions, and work worth seeing.</p></div>
              <button onClick={() => setIsPostModalOpen(true)} className="btn-ghost"><Plus size={15} /> Post</button>
            </div>
            <div className="flex gap-1 rounded-xl border border-customBorder bg-footer p-1 mb-4 overflow-x-auto">
              {(['ALL', 'PROJECT', 'DISCUSSION'] as FeedTab[]).map((tab) => <button key={tab} onClick={() => setActiveFeedTab(tab)} className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeFeedTab === tab ? 'bg-card text-accent shadow-sm' : 'text-subText hover:text-mainText'}`}>{tab === 'ALL' ? 'All activity' : tab === 'PROJECT' ? 'Projects' : 'Discussions'}</button>)}
              <span className="ml-auto py-1.5 px-2 text-[11px] text-subText whitespace-nowrap">{processedFeed.length} posts</span>
            </div>
            <div className="space-y-4">
              {isLoading ? <div className="rounded-2xl border border-customBorder bg-card py-16 flex flex-col items-center gap-3"><Loader2 className="text-accent animate-spin" size={27} /><span className="text-xs text-subText">Loading your campus feed…</span></div>
                : processedFeed.length ? processedFeed.map((post) => <PostCard key={post.id} postData={post} />)
                  : <div className="rounded-2xl border border-customBorder bg-card py-16 text-center"><Compass className="text-subText/30 mx-auto mb-3" size={32} /><p className="text-sm text-subText">{globalSearch ? 'No feed posts match your search.' : 'Your feed is ready for the first update.'}</p><button onClick={() => setIsPostModalOpen(true)} className="btn-ghost mt-3 text-accent">Create a post <ArrowRight size={14} /></button></div>}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-customBorder bg-card p-4">
              <div className="flex items-center justify-between mb-3"><div><h2 className="font-bold text-sm">Coming up</h2><p className="text-[11px] text-subText">Make room for what’s next.</p></div><button onClick={() => navigate('/events')} className="text-xs text-accent font-semibold hover:underline">View all</button></div>
              <div className="space-y-2">
                {upcomingEvents.length ? upcomingEvents.map((event) => { const date = formatEventDateTime(event.start_time); return <button key={event.id} onClick={() => navigate(`/event/${event.id}`)} className="w-full text-left rounded-xl bg-footer/70 border border-customBorder p-3 hover:border-accent/50 transition-colors"><div className="flex gap-3"><div className="w-10 shrink-0 rounded-lg bg-accent/10 text-accent flex flex-col items-center justify-center"><span className="text-[10px] font-bold uppercase">{date.date.split(' ')[1] || 'Event'}</span><span className="text-sm font-bold leading-none">{date.date.split(' ')[2] || ''}</span></div><div className="min-w-0"><p className="text-xs font-bold truncate">{event.title}</p><p className="text-[11px] text-subText mt-1 flex items-center gap-1 truncate"><Clock3 size={11} /> {date.time || 'Time TBA'}</p>{event.details?.location && <p className="text-[11px] text-subText mt-0.5 flex items-center gap-1 truncate"><MapPin size={11} /> {event.details.location}</p>}</div></div></button>; }) : <p className="text-xs text-subText py-3">No upcoming events yet.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-customBorder bg-card p-4">
              <div className="flex items-center justify-between mb-3"><div><h2 className="font-bold text-sm">Explore communities</h2><p className="text-[11px] text-subText">Find your next team.</p></div><button onClick={() => navigate('/clubs')} className="text-xs text-accent font-semibold hover:underline">All clubs</button></div>
              <div className="space-y-3">{suggestedClubs.length ? suggestedClubs.map((club) => <button key={club.id} onClick={() => navigate(`/club/${club.id}`)} className="w-full flex items-center gap-3 text-left group"><span className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><Building2 size={17} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold truncate group-hover:text-accent">{club.title}</span><span className="block text-[11px] text-subText">{club.member_count} members · {club.event_count || 0} events</span></span><ChevronRight size={15} className="text-subText" /></button>) : <p className="text-xs text-subText py-2">Communities will appear here.</p>}</div>
            </section>

            <section className="rounded-2xl border border-customBorder bg-card p-4">
              <div className="flex items-center justify-between mb-3"><div><h2 className="font-bold text-sm">People to meet</h2><p className="text-[11px] text-subText">Build your campus circle.</p></div><button onClick={() => navigate('/students')} className="text-xs text-accent font-semibold hover:underline">Discover</button></div>
              <div className="space-y-3">{peopleToMeet.map((person) => <button key={person.student_id} onClick={() => navigate(`/profile/${person.student_id}`)} className="w-full flex items-center gap-3 text-left group"><UserAvatar name={person.name} src={person.profile_pic} className="h-8 w-8 rounded-lg text-[10px] font-bold" /><span className="min-w-0"><span className="block text-xs font-bold truncate group-hover:text-accent">{person.name}</span><span className="block text-[11px] text-subText truncate">{person.department}</span></span></button>)}{!peopleToMeet.length && <p className="text-xs text-subText py-2">New people will appear here.</p>}</div>
            </section>
          </aside>
        </div>
      </div>

      {isPostModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPostModalOpen(false)} /><div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-customBorder bg-card shadow-2xl p-6"><PostForm modalTitle="Create New Campus Post" onClose={() => setIsPostModalOpen(false)} onPublish={handlePublish} /></div></div>}
    </main>
  );
};

export default Home;
