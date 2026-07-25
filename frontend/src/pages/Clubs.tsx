import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClubsApi, joinClubApi, createClubApi, uploadFileApi } from '../services/api';
import { CheckCircle2, Loader2, Plus, Search, Users, Building2, ArrowRight, Calendar } from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';
import { Toast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';

export interface ClubData {
  rawId: number;
  id: string;
  category: 'technical' | 'cultural' | 'sports' | 'business';
  joinFormat: 'open' | 'interview' | 'portfolio-review';
  name: string;
  briefIntro: string;
  leadName: string;
  bannerUrl?: string;
  foundedDate: string;
  memberCount: number;
  eventCount: number;
  isJoined?: boolean;
}

type SortOption = 'member-count-desc' | 'alphabetical' | 'newest';

const JOIN_FORMAT_LABELS: Record<string, string> = {
  open: 'Open Join',
  interview: 'Interview Required',
  'portfolio-review': 'Portfolio Review',
};

export default function CampusForgeClubsPage() {
  const navigate = useNavigate();
  const [clubsList, setClubsList] = useState<ClubData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('member-count-desc');

  const [activePaymentClub, setActivePaymentClub] = useState<ClubData | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const [newClubTitle, setNewClubTitle] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubCategory, setNewClubCategory] = useState('technical');
  const [newClubBanner, setNewClubBanner] = useState('');
  const [newClubJoinFormat, setNewClubJoinFormat] = useState('open');
  const [isSubmittingClub, setIsSubmittingClub] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerFileRef = React.useRef<HTMLInputElement>(null);

  const loadBackendClubs = async () => {
    setIsLoading(true);
    try {
      const backendClubs = await getClubsApi();
      setBackendOnline(true);
      setClubsList(
        backendClubs.map((c) => ({
          rawId: c.id,
          id: `club-${c.id}`,
          category: (c.details?.category as ClubData['category']) || 'technical',
          joinFormat: (c.settings?.join_format as ClubData['joinFormat']) || 'open',
          name: c.title,
          briefIntro: c.description,
          leadName: c.details?.lead_name || 'Club Lead',
          bannerUrl: c.details?.banner_url || '',
          foundedDate: new Date(c.created_at).toISOString().split('T')[0],
          memberCount: c.member_count || 0,
          eventCount: c.event_count || 0,
          isJoined: Boolean(c.is_joined),
        }))
      );
    } catch {
      setBackendOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackendClubs();
  }, []);

  const categories = ['All', 'technical', 'cultural', 'sports', 'business'];

  const filteredClubs = useMemo(() => {
    let output = [...clubsList];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      output = output.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.briefIntro.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'All') {
      output = output.filter((c) => c.category === selectedCategory);
    }

    output.sort((a, b) => {
      if (sortBy === 'member-count-desc') return b.memberCount - a.memberCount;
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      return new Date(b.foundedDate).getTime() - new Date(a.foundedDate).getTime();
    });
    return output;
  }, [clubsList, selectedCategory, searchQuery, sortBy]);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingClub(true);
    try {
      let bannerUrl = newClubBanner;
      if (bannerFileRef.current?.files?.[0]) {
        setIsUploadingBanner(true);
        const upload = await uploadFileApi(bannerFileRef.current.files[0]);
        bannerUrl = upload.url;
      }
      const newClub = await createClubApi({
        title: newClubTitle,
        description: newClubDesc,
        details: {
          category: newClubCategory,
          banner_url: bannerUrl,
        },
        settings: {
          join_format: newClubJoinFormat as any,
        },
      });
      setNotification(`"${newClub.title}" created — you're the Admin!`);
      setIsCreateClubOpen(false);
      setNewClubTitle('');
      setNewClubDesc('');
      setNewClubBanner('');
      await loadBackendClubs();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification(err.message || 'Failed to create club.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsSubmittingClub(false);
      setIsUploadingBanner(false);
    }
  };

  return (
    <div className="page-container">
      <Toast message={notification} />

      {/* Header */}
      <header className="page-header flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-accent">Campus Clubs</span>
          </div>
          <h1 className="page-title text-2xl font-bold">Find Your Community</h1>
          <p className="page-subtitle text-xs text-subText mt-1">
            Browse student organizations, join clubs, and connect with peers who share your interests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsCreateClubOpen(true)} className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Create Club
          </button>
        </div>
      </header>

      {/* Search & Category Filter Bar */}
      <section className="filter-panel space-y-3 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subText" />
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-1.5 text-xs w-full"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="input-field w-full md:w-auto text-xs py-1.5"
          >
            <option value="member-count-desc">Most Members</option>
            <option value="alphabetical">A–Z</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        <div className="filter-chip-row">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-0.5 text-xs font-medium rounded-full border transition-all cursor-pointer capitalize ${
                selectedCategory === cat
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'border-customBorder text-subText hover:text-mainText hover:border-accent/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {backendOnline === false && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400">
          Backend offline — start the server to see live clubs.
        </div>
      )}

      {/* Grid */}
      <main>
        {isLoading ? (
          <div className="empty-state py-12 text-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-2" />
            <p className="text-subText text-xs">Loading clubs...</p>
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="empty-state py-12 text-center">
            <Building2 className="w-10 h-10 text-subText/30 mx-auto mb-2" />
            <p className="text-subText text-xs">No clubs match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClubs.map((club) => (
              <article
                key={club.id}
                onClick={() => navigate(`/club/${club.rawId}`)}
                className="entity-card flex flex-col justify-between rounded-xl border border-customBorder bg-secondary/30 hover:border-accent/30 transition-all overflow-hidden cursor-pointer"
              >
                <div>
                  {/* Banner Image with Overlay Club Title */}
                  <div className="relative h-28 w-full bg-slate-800">
                    <img
                      src={club.bannerUrl || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80'}
                      alt={club.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-3">
                      <div className="w-full flex items-center justify-between gap-2">
                        <h3
                          onClick={(e) => { e.stopPropagation(); navigate(`/club/${club.rawId}`); }}
                          className="text-base font-bold text-white hover:text-accent transition-colors cursor-pointer line-clamp-1"
                        >
                          {club.name}
                        </h3>
                        <span className={`category-badge category-${club.category} text-[10px] px-2 py-0.5 rounded capitalize shrink-0`}>
                          {club.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <p className="text-xs text-subText line-clamp-2 leading-relaxed mb-3">
                      {club.briefIntro}
                    </p>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-customBorder text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-subText block">Events</span>
                      <span className="font-medium text-mainText flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-subText" /> {club.eventCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-subText block">Members</span>
                      <span className="font-medium text-mainText flex items-center gap-1">
                        <Users className="w-3 h-3 text-subText" /> {club.memberCount}
                      </span>
                    </div>
                  </div>

                  {/* Compact Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {club.isJoined ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Joined
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setActivePaymentClub(club); }}
                        className="btn-primary text-xs px-2.5 py-1 rounded-md"
                      >
                        Join
                      </button>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/club/${club.rawId}`); }}
                      className="btn-ghost text-xs px-2 py-1 text-subText hover:text-mainText flex items-center gap-1"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <PaymentModal
        isOpen={!!activePaymentClub}
        onClose={() => setActivePaymentClub(null)}
        title={activePaymentClub?.name || ''}
        subtitle={JOIN_FORMAT_LABELS[activePaymentClub?.joinFormat || 'open']}
        fee="Free"
        type="club"
        onConfirm={async () => {
          if (!activePaymentClub) return;
          const res = await joinClubApi(activePaymentClub.rawId);
          setNotification(res.detail || `Joined ${activePaymentClub.name}!`);
          setActivePaymentClub(null);
          await loadBackendClubs();
          setTimeout(() => setNotification(null), 4000);
        }}
      />

      <Modal
        isOpen={isCreateClubOpen}
        onClose={() => setIsCreateClubOpen(false)}
        title={<><Plus className="w-4 h-4 text-accent inline mr-1.5" />Create a New Club</>}
      >
        <p className="text-xs text-subText mb-4">
          You'll become the <strong className="text-amber-400">Admin</strong> with full management access.
        </p>
        <form onSubmit={handleCreateClub} className="space-y-3 text-xs">
          <div>
            <label className="block text-subText font-medium mb-1">Club Name *</label>
            <input
              type="text"
              value={newClubTitle}
              onChange={(e) => setNewClubTitle(e.target.value)}
              placeholder="AI Research Lab"
              className="input-field w-full py-1.5 text-xs"
              required
            />
          </div>
          <div>
            <label className="block text-subText font-medium mb-1">Banner Image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newClubBanner}
                onChange={(e) => setNewClubBanner(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="input-field w-full py-1.5 text-xs"
              />
              <input
                ref={bannerFileRef}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsUploadingBanner(true);
                  try { setNewClubBanner((await uploadFileApi(file)).url); }
                  catch { setNotification('Banner upload failed. Please try again.'); }
                  finally { setIsUploadingBanner(false); e.target.value = ''; }
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bannerFileRef.current?.click()}
                disabled={isUploadingBanner}
                className="btn-ghost text-xs px-2 py-1 text-subText hover:text-mainText flex items-center gap-1"
              >
                {isUploadingBanner ? <Loader2 className="w-3 h-3 animate-spin" /> : '📁'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-subText font-medium mb-1">Category</label>
              <select
                value={newClubCategory}
                onChange={(e) => setNewClubCategory(e.target.value)}
                className="input-field w-full py-1.5 text-xs cursor-pointer"
              >
                <option value="technical">Technical</option>
                <option value="cultural">Cultural</option>
                <option value="sports">Sports</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div>
              <label className="block text-subText font-medium mb-1">Join Format</label>
              <select
                value={newClubJoinFormat}
                onChange={(e) => setNewClubJoinFormat(e.target.value)}
                className="input-field w-full py-1.5 text-xs cursor-pointer"
              >
                <option value="open">Open</option>
                <option value="interview">Interview</option>
                <option value="portfolio-review">Portfolio Review</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-subText font-medium mb-1">Description *</label>
            <textarea
              value={newClubDesc}
              onChange={(e) => setNewClubDesc(e.target.value)}
              rows={3}
              className="input-field w-full py-1.5 text-xs resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" disabled={isSubmittingClub} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
              {isSubmittingClub ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isSubmittingClub ? 'Creating...' : 'Create Club'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
