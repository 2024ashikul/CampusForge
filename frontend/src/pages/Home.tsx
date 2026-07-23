import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Users,
  MapPin,
  Flame,
  MessageSquare,
  Compass,
  CheckCircle2,
  Plus,
  ExternalLink,
  Search,
  WifiOff,
  Loader2,
} from 'lucide-react';

import type { PostData } from '../interfaces/post.type';
import type { ReactionType } from '../interfaces/post.type';
import { getPostsApi, createPostApi, getUsersApi, mapBackendPostToPostData, type BackendUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/Posts/PostCard';
import { PostForm } from '../components/Posts/PostForm';

function getUserInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export const Home: React.FC = () => {
  const { user } = useAuth();

  const [feedPosts, setFeedPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [trendingUsers, setTrendingUsers] = useState<BackendUser[]>([]);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [activeFeedTab, setActiveFeedTab] = useState<'ALL' | 'PROJECT' | 'DISCUSSION'>('ALL');
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const backendPosts = await getPostsApi();
      setBackendOnline(true);
      setFeedPosts(backendPosts.map(mapBackendPostToPostData));
    } catch {
      setBackendOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function loadUsers() {
      try {
        const users = await getUsersApi();
        setTrendingUsers(users.filter((u) => u.id !== user?.id).slice(0, 3));
      } catch {
        // silent
      }
    }
    loadFeed();
    loadUsers();
  }, [user?.id]);

  const handlePublish = async (
    title: string,
    markdown: string,
    association: 'STUDENT' | 'CLUB',
    attachments: any[],
    tags: string[]
  ) => {
    const postType = activeFeedTab === 'PROJECT' ? 'project' : 'general';
    const res = await createPostApi({
      title,
      description: markdown,
      post_type: postType,
      tags,
      attachments,
    });
    if (res) {
      await loadFeed();
    }
    setIsPostModalOpen(false);
  };

  const processedFeed = useMemo(() => {
    let output = [...feedPosts];
    if (activeFeedTab !== 'ALL') {
      output = output.filter((p) => p.postType === activeFeedTab);
    }
    if (globalSearch.trim() !== '') {
      const q = globalSearch.toLowerCase();
      output = output.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.markdownContent.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return output;
  }, [feedPosts, activeFeedTab, globalSearch]);

  return (
    <div className="min-h-screen bg-primary text-mainText px-4 py-8 md:px-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-customBorder">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">CampusForge Hub</h1>
            <p className="text-subText text-sm">
              Live posts, media showcases, and peer connections from the campus network.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-subText/60">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search posts, people, or tags..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-footer border border-customBorder text-mainText rounded-xl pl-9 pr-4 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-subText/40 shadow-inner"
            />
          </div>
        </header>

        {/* ── 3-Column Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

          {/* COLUMN 1: User card + tags */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent via-cyan-500 to-purple-600 border border-customBorder flex items-center justify-center text-primary font-black text-sm shadow-inner">
                  {user ? getUserInitials(user.name) : '??'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-mainText leading-none glow-text">
                    {user?.name || 'Loading...'}
                  </h3>
                  <span className="text-[10px] font-mono text-accent block mt-1">
                    {user?.email || ''}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-subText leading-relaxed mb-3">
                {user?.bio || user?.department || 'Campus member'}
              </p>
              {user?.skills && user.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {user.skills.slice(0, 3).map((sk) => (
                    <span key={sk.name} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
                      {sk.name}
                    </span>
                  ))}
                </div>
              )}
              <a
                href={user ? `/profile/${user.id}` : '#'}
                className="block text-center w-full py-2 bg-footer/80 hover:bg-primary border border-customBorder text-mainText hover:text-accent font-bold text-xs rounded-xl transition-all"
              >
                View My Profile Matrix
              </a>
            </div>

            <div className="bg-card border border-customBorder rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-subText text-[10px] font-bold uppercase tracking-wider">
                <Flame size={12} className="text-accent" />
                <span>Trending Topics</span>
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
          </div>

          {/* COLUMN 2: Feed */}
          <div className="lg:col-span-2 space-y-6">

            {/* Create Post Banner Button */}
            <div className="bg-card border border-customBorder rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 border border-customBorder flex items-center justify-center text-accent font-black text-sm">
                  {user ? getUserInitials(user.name) : '?'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-mainText">Share updates or upload media</h4>
                  <p className="text-[10px] text-subText">Post images, video embeds, markdown content, and tags.</p>
                </div>
              </div>
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="px-4 py-2 bg-accent text-primary font-black text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus size={15} strokeWidth={3} /> Create Post
              </button>
            </div>

            {/* Feed tabs */}
            <div className="flex justify-between items-center bg-footer border border-customBorder rounded-xl p-1">
              <div className="flex gap-1 w-full sm:w-auto">
                {(['ALL', 'PROJECT', 'DISCUSSION'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFeedTab(tab)}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeFeedTab === tab
                        ? 'bg-card text-accent shadow-sm'
                        : 'text-subText hover:text-mainText'
                    }`}
                  >
                    {tab === 'ALL' ? 'All Posts' : tab === 'PROJECT' ? 'Projects' : 'Discussions'}
                  </button>
                ))}
              </div>
              <span className="hidden sm:inline text-[10px] font-mono text-subText/60 px-2">
                {processedFeed.length} posts
              </span>
            </div>

            {/* Status banners */}
            <div className="space-y-2">
              {backendOnline === false && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-900/20 border border-red-500/40 rounded-xl text-xs">
                  <WifiOff size={14} className="text-red-400 shrink-0" />
                  <div>
                    <span className="font-bold text-red-300">Backend offline. </span>
                    <span className="text-red-400/80">
                      Run: <code className="font-mono bg-red-900/30 px-1 rounded">cd backend && python3 standalone_server.py</code>
                    </span>
                  </div>
                </div>
              )}
              {backendOnline === true && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-500/30 rounded-lg text-[10px] font-mono text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Live data · {feedPosts.length} posts loaded
                </div>
              )}
            </div>

            {/* Posts list rendering complete PostCards */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-card border border-customBorder rounded-2xl gap-3">
                  <Loader2 size={28} className="text-accent animate-spin" />
                  <p className="text-subText text-xs font-mono">Loading posts from backend...</p>
                </div>
              ) : processedFeed.length === 0 ? (
                <div className="text-center py-16 bg-card border border-customBorder rounded-2xl">
                  <Compass className="mx-auto text-subText/30 mb-2" size={32} />
                  <p className="text-subText text-xs font-mono">
                    {backendOnline ? 'No posts match the filter.' : 'Start the backend to see posts.'}
                  </p>
                </div>
              ) : (
                processedFeed.map((post) => (
                  <PostCard key={post.id} postData={post} />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: Rising Innovators */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-customBorder rounded-2xl p-4 space-y-3">
              <div className="text-subText text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users size={12} className="text-accent" />
                <span>Campus Members</span>
              </div>

              {trendingUsers.length === 0 ? (
                <p className="text-[11px] text-subText/60 font-mono italic">No members found.</p>
              ) : (
                <div className="space-y-3">
                  {trendingUsers.map((u) => (
                    <div key={u.id} className="p-3 bg-footer border border-customBorder rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 border border-customBorder flex items-center justify-center text-accent font-black text-xs flex-shrink-0">
                          {getUserInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-mainText leading-none truncate">{u.name}</h5>
                          <span className="text-[9px] font-mono text-subText/70 block mt-0.5 truncate">
                            {u.department}
                          </span>
                        </div>
                      </div>
                      {u.bio && (
                        <p className="text-[10px] text-subText line-clamp-2 leading-relaxed">{u.bio}</p>
                      )}
                      <a
                        href={`/profile/${u.id}`}
                        className="block text-center text-[10px] font-bold text-accent hover:underline pt-0.5"
                      >
                        View Profile →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border border-customBorder rounded-2xl p-4 space-y-2">
              <div className="text-subText text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Flame size={12} className="text-accent" />
                <span>Quick Links</span>
              </div>
              {[
                { label: '🏛️ Browse Clubs', href: '/clubs' },
                { label: '📅 Upcoming Events', href: '/events' },
                { label: '🚀 Active Projects', href: '/projects' },
                { label: '👥 All Students', href: '/students' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-2.5 bg-footer border border-customBorder rounded-xl text-xs text-subText hover:text-mainText hover:border-accent/30 transition-all group"
                >
                  <span>{link.label}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent">→</span>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Modal for Creating New Post with images/video/links */}
        {isPostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsPostModalOpen(false)}
            />
            <div className="relative w-full max-w-2xl bg-card border border-customBorder rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col transform transition-all">
              <div className="p-6 overflow-y-auto bg-primary/30">
                <PostForm
                  modalTitle="Create New Campus Post"
                  onClose={() => setIsPostModalOpen(false)}
                  onPublish={handlePublish}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Home;