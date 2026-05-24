import React, { useState, useMemo } from 'react';

import type { PostData, PostAttachment, AuthorType } from '../interfaces/post.type';
import { PostForm } from '../components/Posts/PostForm';
import { PostCard } from '../components/Posts/PostCard';

// Comprehensive mock data matching the core interface specification
const DUMMY_PROJECTS: PostData[] = [
  {
    id: 'project-1',
    title: 'Autonomous Solar Rover Ecosystem',
    postType: 'PROJECT',
    markdownContent: 'An automated navigation and battery-monitoring array utilizing lightweight RTOS microkernels.',
    createdAt: '2 days ago',
    author: {
      id: 'u-1',
      name: 'Robotics & Automation Society',
      avatar: '🤖',
      association: 'CLUB',
      roleTitle: 'Core Engineering Group'
    },
    attachments: [
      { id: 'a-1', postId: 'project-1', type: 'LINK', url: 'https://github.com/campusforge/solar-rover', name: 'Firmware Repository' }
    ],
    comments: [],
    tags: ['Hardware', 'C++', 'RTOS'],
    reactions: { 'user-1': 'LIKE', 'user-2': 'STAR' }
  },
  {
    id: 'project-2',
    title: 'Distributed Compute Ledger Paradigm',
    postType: 'PROJECT',
    markdownContent: 'P2P network layer optimization protocols running containerized sandboxes across client devices.',
    createdAt: '5 days ago',
    author: {
      id: 'u-2',
      name: 'Alex Rivera',
      avatar: '👨‍💻',
      association: 'STUDENT',
      roleTitle: 'Student Contributor'
    },
    attachments: null,
    comments: [],
    tags: ['Web3', 'Go', 'Docker'],
    reactions: { 'user-3': 'LIKE' }
  }
];

type SortOption = 'newest' | 'popular' | 'alphabetical';
type CreatorFilter = 'all' | 'STUDENT' | 'CLUB';

export const Projects: React.FC = () => {
  // --- Core Lifecycle States ---
  const [projects, setPosts] = useState<PostData[]>(DUMMY_PROJECTS);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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

    // 1. Text Query Matching
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      output = output.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.markdownContent.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q)
      );
    }

    // 2. Creator Channel Separation
    if (creatorFilter !== 'all') {
      output = output.filter((p) => p.author.association === creatorFilter);
    }

    // 3. Taxonomy Tag Filtering
    if (selectedTag !== 'All') {
      output = output.filter((p) => p.tags?.includes(selectedTag));
    }

    // 4. Mathematical & Chronological Sorting Logic
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
  const handlePublish = (
    title: string,
    markdown: string,
    association: 'STUDENT' | 'CLUB',
    attachments: Omit<PostAttachment, 'id' | 'postId'>[],
    tags: string[]
  ) => {
    const newId = `project-${Date.now()}`;
    const newProject: PostData = {
      id: newId,
      title,
      postType: 'PROJECT',
      markdownContent: markdown,
      createdAt: 'Just now',
      author: {
        id: 'u-current',
        name: association === 'CLUB' ? 'AI Development Guild' : 'Alex Rivera',
        avatar: association === 'CLUB' ? '🏰' : '👨‍💻',
        association,
        roleTitle: association === 'CLUB' ? 'Lead Chapter' : 'Student Contributor',
      },
      attachments: attachments.map((a, i) => ({ ...a, id: `a-${newId}-${i}`, postId: newId })),
      comments: [],
      tags: tags,
      reactions: {},
    };

    setPosts([newProject, ...projects]);
    setIsModalOpen(false); // Close modal automatically upon state insertion
  };

  return (
    <div className=" min-h-screen bg-primary text-mainText px-4 py-8  md:px-8 transition-colors duration-200">
      <div className="mx-auto">
        
        {/* --- Header & Compact Metrics Block Section --- */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-customBorder pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">Project Registry</h1>
            <p className="text-subText text-sm">Explore, filter, and review active student engineering systems.</p>
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

            {/* Launch Modal Action Trigger Trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-accent text-primary text-xs font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md cursor-pointer flex items-center gap-2 whitespace-nowrap h-fit"
            >
              <span>🚀</span> Upload Project
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
                placeholder="Search via developers, structural keywords..."
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
              Rendered Manifest Items ({filteredAndSortedProjects.length})
            </h2>
          </div>

          {filteredAndSortedProjects.length === 0 ? (
            <div className="text-center py-16 bg-card border border-customBorder rounded-xl">
              <p className="text-subText text-sm font-mono">No verified deployment specs match your parameters.</p>
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
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setIsModalOpen(false)}
            />
            
            {/* Active Modal Form Payload Container */}
            <div className="relative w-full max-w-2xl bg-card border border-customBorder rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Control Panel Header */}
              <div className="px-6 py-4 bg-footer border-b border-customBorder flex justify-between items-center">
                <div>
                  <h3 className="text-md font-bold text-mainText">Upload New Project</h3>
                  <p className="text-xs text-subText">Populate system manifests to broadcast codebases across the network.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-subText hover:text-mainText hover:bg-footer border border-transparent hover:border-customBorder transition-all cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Scrolling Content Shell Form Container */}
              <div className="p-6 overflow-y-auto bg-primary/30">
                <PostForm onPublish={handlePublish} />
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Projects;