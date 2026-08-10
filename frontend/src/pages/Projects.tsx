import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket,
  Sparkles,
  Plus,
  Search,
  Users,
  Code2,
  Trophy,
  ChevronRight,
  ArrowRight,
  FolderGit2,
  Tag,
  Cpu,
  Loader2,
  X,
} from 'lucide-react';

import type { PostData } from '../interfaces/post.type';
import { PostForm } from '../components/Posts/PostForm';
import { PostCard } from '../components/Posts/PostCard';
import {
  getPostsApi,
  getUsersApi,
  mapBackendPostToPostData,
  type BackendUser,
} from '../services/api';
import { UserAvatar } from '../components/ui/UserAvatar';

type SortOption = 'newest' | 'popular' | 'alphabetical';
type CreatorFilter = 'all' | 'STUDENT' | 'CLUB';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setPosts] = useState<PostData[]>([]);
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const [postsData, usersData] = await Promise.all([
        getPostsApi({ post_type: 'project' }),
        getUsersApi().catch(() => []),
      ]);
      setBackendOnline(true);
      setPosts(postsData.map(mapBackendPostToPostData));
      setUsers(usersData);
    } catch {
      setBackendOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [creatorFilter, setCreatorFilter] = useState<CreatorFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    projects.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return ['All', ...Array.from(tagsSet)];
  }, [projects]);

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
        const aReactions = a.reactionCounts
          ? Object.values(a.reactionCounts).reduce((acc: number, c) => acc + (c || 0), 0)
          : 0;
        const bReactions = b.reactionCounts
          ? Object.values(b.reactionCounts).reduce((acc: number, c) => acc + (c || 0), 0)
          : 0;
        return bReactions - aReactions;
      }
      return 0;
    });

    return output;
  }, [projects, searchQuery, creatorFilter, selectedTag, sortBy]);

  const featuredProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const aReactions = a.reactionCounts
          ? Object.values(a.reactionCounts).reduce((acc: number, c) => acc + (c || 0), 0)
          : 0;
        const bReactions = b.reactionCounts
          ? Object.values(b.reactionCounts).reduce((acc: number, c) => acc + (c || 0), 0)
          : 0;
        return bReactions - aReactions;
      })
      .slice(0, 3);
  }, [projects]);

  const popularTags = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      p.tags?.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [projects]);

  const handleSaved = async () => {
    await loadProjects();
    setIsModalOpen(false);
  };

  return (
    <main className="min-h-screen bg-primary text-mainText">
      <div className="max-w-[1180px] mx-auto px-4 py-6 md:px-5 md:py-8">
        {/* Header Banner matching Home.tsx */}
        <section className="relative overflow-visible rounded-2xl border border-customBorder bg-card p-5 md:p-7 shadow-sm">
          <div
            className="absolute inset-0 pointer-events-none opacity-50 rounded-2xl"
            style={{
              background:
                'radial-gradient(circle at 92% 0%, rgba(139, 92, 246, 0.20), transparent 35%)',
            }}
          />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-[0.18em] mb-2">
                  <Rocket size={14} /> Campus Engineering Showcase
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Project Showcase
                </h1>
                <p className="text-subText text-sm mt-2 max-w-xl">
                  Explore student-built applications, research prototypes, and open-source software built across the campus.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary shrink-0 flex items-center gap-2"
              >
                <Plus size={16} /> Publish Project Showcase
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subText" size={17} />
                <input
                  type="text"
                  placeholder="Search projects by title, stack, developer, or keywords…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-customBorder bg-primary/70 pl-10 pr-9 py-2 text-xs text-mainText placeholder:text-subText/60 focus:border-accent focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-subText hover:text-mainText p-1"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <div className="inline-flex rounded-xl bg-primary p-1 border border-customBorder">
                  {(
                    [
                      { key: 'all', display: 'All' },
                      { key: 'STUDENT', display: 'Students' },
                      { key: 'CLUB', display: 'Clubs' },
                    ] as { key: CreatorFilter; display: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setCreatorFilter(opt.key)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        creatorFilter === opt.key
                          ? 'bg-card text-accent shadow-sm'
                          : 'text-subText hover:text-mainText'
                      }`}
                    >
                      {opt.display}
                    </button>
                  ))}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-xl border border-customBorder bg-primary px-3 py-2 text-xs text-mainText focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="alphabetical">Title (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Tag Pills Row */}
            {allUniqueTags.length > 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-customBorder/50">
                {allUniqueTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-accent/15 border-accent text-accent'
                        : 'border-customBorder bg-primary/40 text-subText hover:text-mainText hover:border-accent/30'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {backendOnline === false && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/20 border border-red-500/40 text-xs text-red-300">
            <span className="text-red-400 shrink-0">⚡</span>
            <span>Campus backend API is offline — start the server to view live projects.</span>
          </div>
        )}

        {/* Two-Column Grid matching Home.tsx */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 mt-6">
          {/* Main Column: Projects Feed */}
          <section className="min-w-0 space-y-4">
            <div className="flex items-center justify-between gap-3 mb-2 px-1">
              <div>
                <h2 className="font-bold text-base text-mainText">Project Showcases</h2>
                <p className="text-xs text-subText mt-0.5">
                  Showing {filteredAndSortedProjects.length} project showcase{filteredAndSortedProjects.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-ghost text-xs text-accent font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add project
              </button>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-customBorder bg-card py-16 flex flex-col items-center gap-3">
                <Loader2 className="text-accent animate-spin" size={27} />
                <span className="text-xs text-subText font-mono">Loading project showcases…</span>
              </div>
            ) : filteredAndSortedProjects.length === 0 ? (
              <div className="rounded-2xl border border-customBorder bg-card py-16 text-center">
                <FolderGit2 className="text-subText/30 mx-auto mb-3" size={32} />
                <p className="text-sm text-subText">
                  {searchQuery || selectedTag !== 'All'
                    ? 'No project showcases match your search filters.'
                    : 'No project showcases have been published yet.'}
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-ghost mt-3 text-accent text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  Publish the first project <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedProjects.map((project) => (
                  <PostCard
                    key={project.id}
                    postData={project}
                    onDeleted={(postId) =>
                      setPosts((current) => current.filter((p) => p.rawId !== postId))
                    }
                    onUpdated={(updated) =>
                      setPosts((current) =>
                        current.map((p) => (p.rawId === updated.rawId ? updated : p))
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Sidebar matching Home.tsx */}
          <aside className="space-y-4">
            {/* Featured Projects Card */}
            <section className="rounded-2xl border border-customBorder bg-card p-4">
              <div className="flex items-center justify-between mb-3 border-b border-customBorder pb-2.5">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Trophy size={14} /> Top Featured Projects
                  </h3>
                  <p className="text-[11px] text-subText mt-0.5">High engagement showcases</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {featuredProjects.length ? (
                  featuredProjects.map((proj) => {
                    const totalReactions = proj.reactionCounts
                      ? Object.values(proj.reactionCounts).reduce((acc: number, c) => acc + (c || 0), 0)
                      : 0;
                    return (
                      <div
                        key={proj.id}
                        onClick={() => {
                          if (proj.rawId) {
                            document.getElementById(`post-${proj.rawId}`)?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center',
                            });
                          }
                        }}
                        className="w-full text-left rounded-xl bg-footer/70 border border-customBorder p-3 hover:border-accent/40 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-mainText group-hover:text-accent transition-colors line-clamp-1">
                            {proj.title}
                          </h4>
                          <span className="text-[10px] font-bold text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-400/20 shrink-0">
                            🚀 {totalReactions}
                          </span>
                        </div>
                        <p className="text-[11px] text-subText line-clamp-2 mt-1">
                          {proj.markdownContent.replace(/[#*_`>\-]/g, '').trim()}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-customBorder/40 text-[10px] text-subText">
                          <span>by {proj.author.name}</span>
                          <span className="text-accent font-semibold group-hover:underline inline-flex items-center gap-0.5">
                            View <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-subText py-2">Featured projects will appear here.</p>
                )}
              </div>
            </section>

            {/* Popular Tech Stacks */}
            <section className="rounded-2xl border border-customBorder bg-card p-4">
              <div className="flex items-center justify-between mb-3 border-b border-customBorder pb-2.5">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Cpu size={14} /> Popular Tech Stacks
                  </h3>
                  <p className="text-[11px] text-subText mt-0.5">Trending technologies</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularTags.length ? (
                  popularTags.map(([tag, count]) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer font-mono ${
                        selectedTag === tag
                          ? 'bg-accent/20 border-accent text-accent font-bold'
                          : 'bg-primary/50 border-customBorder text-subText hover:text-mainText hover:border-accent/30'
                      }`}
                    >
                      #{tag} <span className="text-[10px] opacity-70">({count})</span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-subText py-2">Tech stacks will appear here.</p>
                )}
              </div>
            </section>

            {/* Student Developers */}
            <section className="rounded-2xl border border-customBorder bg-card p-4">
              <div className="flex items-center justify-between mb-3 border-b border-customBorder pb-2.5">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Code2 size={14} /> Student Builders
                  </h3>
                  <p className="text-[11px] text-subText mt-0.5">Campus project creators</p>
                </div>
                <button
                  onClick={() => navigate('/students')}
                  className="text-xs text-accent font-semibold hover:underline cursor-pointer"
                >
                  Discover
                </button>
              </div>
              <div className="space-y-2.5">
                {users.length ? (
                  users.slice(0, 4).map((person) => (
                    <button
                      key={person.student_id}
                      onClick={() => navigate(`/profile/${person.student_id}`)}
                      className="w-full flex items-center gap-3 text-left group p-1.5 rounded-xl hover:bg-footer transition-colors cursor-pointer"
                    >
                      <UserAvatar
                        name={person.name}
                        src={person.profile_pic}
                        className="h-8 w-8 rounded-lg text-[10px] font-bold shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold truncate group-hover:text-accent">
                          {person.name}
                        </span>
                        <span className="block text-[11px] text-subText truncate">
                          {person.department}
                        </span>
                      </span>
                      <ChevronRight size={14} className="text-subText shrink-0" />
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-subText py-2">Campus builders will appear here.</p>
                )}
              </div>
            </section>

            {/* Showcase Guidelines Callout */}
            <section className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-accent font-bold">
                <Sparkles size={14} /> Share Your Work
              </div>
              <p className="text-subText leading-relaxed">
                Building a course project, hackathon prototype, or open-source package? Share it with the campus to gather feedback and recruit collaborators.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-1 py-2 bg-accent text-primary font-bold rounded-xl text-xs hover:brightness-110 transition-all cursor-pointer shadow-sm"
              >
                + Publish Showcase
              </button>
            </section>
          </aside>
        </div>

        {/* Modal for Publishing Project */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsModalOpen(false)}
            />
            <div className="relative w-full max-w-2xl bg-card border border-customBorder rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col transform transition-all">
              <div className="p-6 overflow-y-auto bg-primary/30">
                <PostForm
                  modalTitle="Publish Project Showcase"
                  onClose={() => setIsModalOpen(false)}
                  postType="project"
                  onSaved={handleSaved}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Projects;
