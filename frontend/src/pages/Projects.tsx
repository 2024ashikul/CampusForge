import React, { useState, useMemo, useEffect } from 'react';

import type { PostData, PostAttachment } from '../interfaces/post.type';
import { PostForm } from '../components/Posts/PostForm';
import { PostCard } from '../components/Posts/PostCard';
import { getPostsApi, createPostApi, mapBackendPostToPostData } from '../services/api';
import { useAuth } from '../context/AuthContext';

type SortOption = 'newest' | 'popular' | 'alphabetical';
type CreatorFilter = 'all' | 'STUDENT' | 'CLUB';

export const Projects: React.FC = () => {
  const { user } = useAuth();

  // --- Core Lifecycle States ---
  const [projects, setPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await getPostsApi({ post_type: 'project' });
      setBackendOnline(true);
      setPosts(data.map(mapBackendPostToPostData));
    } catch {
      setBackendOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // --- Search & Filtering Workspace States ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [creatorFilter, setCreatorFilter] = useState<CreatorFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // --- Dynamic Unique Taxonomy Tag Extraction ---
  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    projects.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return ['All', ...Array.from(tagsSet)];
  }, [projects]);

  // --- Metrics Aggregator Block ---
  const metrics = useMemo(() => {
    return {
      total: projects.length,
      studentInitiatives: projects.filter((p) => p.author.association === 'STUDENT').length,
      clubDeployments: projects.filter((p) => p.author.association === 'CLUB').length,
    };
  }, [projects]);

  // --- Data Transformation Pipeline (Filter & Sort) ---
  const filteredAndSortedProjects = useMemo(() => {
    let output = [...projects];

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      output = output.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.markdownContent.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q)
      );
    }

    if (creatorFilter !== 'all') {
      output = output.filter((p) => p.author.association === creatorFilter);
    }

    if (selectedTag !== 'All') {
      output = output.filter((p) => p.tags?.includes(selectedTag));
    }

    output.sort((a, b) => {
      if (sortBy === 'newest') return b.id.localeCompare(a.id);
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
      if (sortBy === 'popular') {
        const aReactions = a.reactions ? Object.keys(a.reactions).length : 0;
        const bReactions = b.reactions ? Object.keys(b.reactions).length : 0;
        return bReactions - aReactions;
      }
      return 0;
    });

    return output;
  }, [projects, searchQuery, creatorFilter, selectedTag, sortBy]);

  // --- Handle Form Submissions via Modal Workspace ---
  const handlePublish = async (
    title: string,
    markdown: string,
    association: 'STUDENT' | 'CLUB',
    attachments: Omit<PostAttachment, 'id' | 'postId'>[],
    tags: string[]
  ) => {
    const backendResult = await createPostApi({
      title,
      description: markdown,
      post_type: 'project',
      tags,
      attachments,
    });

    if (backendResult) {
      await loadProjects();
    } else {
      const newId = `project-local-${Date.now()}`;
      const newProject: PostData = {
        id: newId,
        title,
        postType: 'PROJECT',
        markdownContent: markdown,
        createdAt: 'Just now',
        author: {
          id: user ? `u-${user.id}` : 'u-current',
          name: user ? user.name : 'Student Contributor',
          avatar: '👨‍💻',
          association,
          roleTitle: user ? user.department : 'Student Contributor',
        },
        attachments: attachments.map((a, i) => ({ ...a, id: `a-${newId}-${i}`, postId: newId })),
        comments: [],
        tags: tags.length > 0 ? tags : ['Project', 'Showcase'],
        reactions: {},
      };
      setPosts((prev) => [newProject, ...prev]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-primary text-mainText px-4 py-8 md:px-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        
        {/* --- Header & Compact Metrics Block Section --- */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-customBorder pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">Project Showcase</h1>
            <p className="text-subText text-sm">Explore, filter, and review active student engineering systems & software projects.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Inline Numeric Counter Panel */}
            <div className="flex items-center gap-2 bg-card border border-customBorder rounded-xl p-2.5 shadow-sm">
              <div className="px-3 py-1 bg-footer rounded-lg text-center">
                <span className="block text-[10px] text-subText font-bold uppercase tracking-wider">Total</span>
                <span className="text-sm font-black text-mainText">{metrics.total}</span>
              </div>
              <div className="w-px h-6 bg-customBorder" />
              <div className="px-3 py-1 bg-footer rounded-lg text-center">
                <span className="block text-[10px] text-accent font-bold uppercase tracking-wider">Students</span>
                <span className="text-sm font-black text-accent">{metrics.studentInitiatives}</span>
              </div>
              <div className="w-px h-6 bg-customBorder" />
              <div className="px-3 py-1 bg-footer rounded-lg text-center">
                <span className="block text-[10px] text-subText font-bold uppercase tracking-wider">Clubs</span>
                <span className="text-sm font-black text-subText">{metrics.clubDeployments}</span>
              </div>
            </div>

            {/* Launch Modal Action Trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-accent text-primary text-xs font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md cursor-pointer flex items-center gap-2 whitespace-nowrap h-fit"
            >
              <span>🚀</span> Publish Project Showcase
            </button>
          </div>
        </header>

        {/* --- Unified Horizontal Control Workspace --- */}
        <section className="bg-footer border border-customBorder rounded-xl p-5 mb-8 space-y-4">
          
          {/* Main Input Controls Row */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search projects via title, developer, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-primary border border-customBorder text-mainText rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-subText/50"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Creator Classification Toggle Segments */}
              <div className="inline-flex rounded-lg bg-primary p-1 border border-customBorder">
                {([
                  { key: 'all', display: 'All' },
                  { key: 'STUDENT', display: 'Students' },
                  { key: 'CLUB', display: 'Clubs' }
                ] as { key: CreatorFilter; display: string }[]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setCreatorFilter(opt.key)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      creatorFilter === opt.key
                        ? 'bg-card text-accent shadow-sm'
                        : 'text-subText hover:text-mainText'
                    }`}
                  >
                    {opt.display}
                  </button>
                ))}
              </div>

              {/* Functional Sorting Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-primary border border-customBorder text-mainText rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              >
                <option value="newest">Upload Order: Newest</option>
                <option value="popular">Engagement: Highly Rated</option>
                <option value="alphabetical">Title Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Metadata Taxonomy Tag Bar Selection */}
          <div className="border-t border-customBorder/50 pt-3">
            <span className="block text-subText text-[11px] font-bold uppercase tracking-wider mb-2">
              Filter by Engineering Meta Tag
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

        {/* --- Main Centered Content Stream Pipeline --- */}
        <main className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-bold text-subText uppercase tracking-[0.2em]">
              Projects Showcase Feed ({filteredAndSortedProjects.length})
            </h2>
          </div>

          {/* Backend Status Indicator */}
          {backendOnline === false && (
            <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-900/20 border border-red-500/40 rounded-xl text-xs">
              <span className="text-red-400 shrink-0">⚡</span>
              <div>
                <span className="font-bold text-red-300">Backend API is offline.</span>
                <span className="text-red-400/80 ml-1">Run: <code className="font-mono bg-red-900/30 px-1 rounded">cd backend && python3 standalone_server.py</code></span>
              </div>
            </div>
          )}
          {backendOnline === true && projects.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-green-900/20 border border-green-500/30 rounded-lg text-[10px] font-mono text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Live from CampusForge API · {projects.length} project showcases loaded
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-card border border-customBorder rounded-xl gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
              <p className="text-subText text-xs font-mono">Loading project showcases from API...</p>
            </div>
          ) : filteredAndSortedProjects.length === 0 ? (
            <div className="text-center py-16 bg-card border border-customBorder rounded-xl">
              <p className="text-subText text-sm font-mono">
                {backendOnline ? 'No projects match your filters.' : 'Start the backend to see projects.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedProjects.map((project) => (
                <PostCard key={project.id} postData={project} />
              ))}
            </div>
          )}
        </main>

        {/* --- Pop-up Dialog Workflow Workbench Modal --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop Layer Blur Effect Overlay */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsModalOpen(false)}
            />
            
            {/* Active Modal Form Payload Container */}
            <div className="relative w-full max-w-2xl bg-card border border-customBorder rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col transform transition-all">
              
              <div className="p-6 overflow-y-auto bg-primary/30">
                <PostForm 
                  modalTitle="Publish Project Showcase" 
                  onClose={() => setIsModalOpen(false)} 
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

export default Projects;