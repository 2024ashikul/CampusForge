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
        setTrendingUsers(users.filter((u) => u.student_id !== user?.student_id).slice(0, 3));
      } catch {
        // silent
      }
    }
    loadFeed();
    loadUsers();
  }, [user?.student_id]);

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
      media: attachments,
    });
    if (res) {
      await loadFeed();
    }
    setIsPostModalOpen(false);
  };

  const processedFeed = useMemo(() => {
    let output = [...feedPosts];
    if (activeFeedTab !== 'ALL') {
      output = output.filter((p) =>
        activeFeedTab === 'PROJECT' ? p.postType === 'project' : p.postType !== 'project'
      );
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
    <div className="min-h-screen bg-primary text-mainText px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-customBorder mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-0.5">CampusForge Hub</h1>
            <p className="text-subText text-xs">Live posts, projects, and peer connections from the campus network.</p>
          </div>
          <div className="relative w-full md:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-subText/50">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search posts, people, tags..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-footer border border-customBorder text-mainText rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent placeholder:text-subText/40"
            />
          </div>
        </header>

        {/* Create Post */}
        <div className="bg-card border border-customBorder rounded-2xl p-4 flex items-center justify-between shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-customBorder flex items-center justify-center text-accent font-black text-sm">
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
        <div className="flex justify-between items-center bg-footer border border-customBorder rounded-xl p-1 mb-6">
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
        <div className="space-y-2 mb-6">
          {backendOnline === false && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-900/20 border border-red-500/40 rounded-xl text-xs">
              <span className="text-red-400 shrink-0">⚡</span>
              <div>
                <span className="font-bold text-red-300">Backend offline. </span>
                <span className="text-red-400/80">
                  Run: <code className="font-mono bg-red-900/30 px-1 rounded">cd backend && python3 standalone_server.py</code>
                </span>
              </div>
            </div>
          )}
          {backendOnline === true && feedPosts.length > 0 && (
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

      {/* Modal for Creating New Post with images/video/links */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsPostModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-card border border-customBorder rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto">
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
  );
};

export default Home;