import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClubsApi, joinClubApi, createClubApi, type BackendClub } from '../services/api';
import { CreditCard, CheckCircle2, ShieldCheck, Loader2, Sparkles, X, Plus } from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';

export interface ClubData {
  rawId: number;
  id: string;
  category: 'technical' | 'cultural' | 'sports' | 'business';
  isRecruiting: boolean;
  joinFormat: 'open' | 'interview' | 'portfolio-review';
  membershipFee: string;
  name: string;
  briefIntro: string;
  leadName: string;
  tags: string[];
  foundedDate: string;
  baseDepartment: string;
  memberCount: number;
  isJoined?: boolean;
}

type SortOption = 'member-count-desc' | 'alphabetical' | 'newest';
type StatusFilter = 'all' | 'recruiting' | 'closed';

export default function CampusForgeClubsPage() {
  const navigate = useNavigate();
  const [clubsList, setClubsList] = useState<ClubData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Filtering & Sorting
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('member-count-desc');

  // Payment Modal State
  const [activePaymentClub, setActivePaymentClub] = useState<ClubData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bkash' | 'campus_credit'>('credit_card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Create Club Modal State
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const [newClubTitle, setNewClubTitle] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubCategory, setNewClubCategory] = useState('technical');
  const [newClubDept, setNewClubDept] = useState('Engineering');
  const [newClubFee, setNewClubFee] = useState('free');
  const [newClubJoinFormat, setNewClubJoinFormat] = useState('open');
  const [isSubmittingClub, setIsSubmittingClub] = useState(false);

  const loadBackendClubs = async () => {
    setIsLoading(true);
    try {
      const backendClubs = await getClubsApi();
      setBackendOnline(true);
      const mappedClubs: ClubData[] = backendClubs.map((c) => ({
        rawId: c.id,
        id: `club-${c.id}`,
        category: (c.category as any) || 'technical',
        isRecruiting: Boolean(c.is_recruiting),
        joinFormat: (c.join_format as any) || 'open',
        membershipFee: c.membership_fee || 'free',
        name: c.title,
        briefIntro: c.description,
        leadName: c.lead_name || 'Alex Rivera',
        tags: c.tags || ['Community', 'Tech'],
        foundedDate: new Date(c.created_at).toISOString().split('T')[0],
        baseDepartment: c.base_department || 'Engineering',
        memberCount: c.member_count || 42,
        isJoined: Boolean(c.is_joined),
      }));
      setClubsList(mappedClubs);
    } catch {
      setBackendOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackendClubs();
  }, []);

  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    clubsList.forEach((club) => {
      if (Array.isArray(club.tags)) {
        club.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return ['All', ...Array.from(tagsSet)];
  }, [clubsList]);

  const filteredAndSortedClubs = useMemo(() => {
    let output = [...clubsList];

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      output = output.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.briefIntro.toLowerCase().includes(q) ||
          c.baseDepartment.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'recruiting') {
      output = output.filter((c) => c.isRecruiting);
    } else if (statusFilter === 'closed') {
      output = output.filter((c) => !c.isRecruiting);
    }

    if (selectedTag !== 'All') {
      output = output.filter((c) => c.tags?.includes(selectedTag));
    }

    output.sort((a, b) => {
      if (sortBy === 'member-count-desc') return b.memberCount - a.memberCount;
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      if (sortBy === 'newest') return new Date(b.foundedDate).getTime() - new Date(a.foundedDate).getTime();
      return 0;
    });

    return output;
  }, [clubsList, selectedTag, statusFilter, searchQuery, sortBy]);

  const metrics = useMemo(() => {
    return {
      total: clubsList.length,
      recruiting: clubsList.filter((c) => c.isRecruiting).length,
      totalMembers: clubsList.reduce((sum, c) => sum + c.memberCount, 0),
    };
  }, [clubsList]);

  const handleOpenJoinModal = (club: ClubData) => {
    if (club.isJoined) return;
    setActivePaymentClub(club);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentClub) return;
    setIsProcessing(true);

    try {
      const methodName =
        paymentMethod === 'credit_card'
          ? 'Demo Credit Card'
          : paymentMethod === 'bkash'
          ? 'bKash Mobile Wallet'
          : 'Campus Credit Account';

      const res = await joinClubApi(activePaymentClub.rawId, methodName);
      setNotification(res.detail || `Successfully joined ${activePaymentClub.name}!`);
      setActivePaymentClub(null);
      await loadBackendClubs();
    } catch (err: any) {
      alert(err.message || 'Failed to join club');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingClub(true);
    try {
      const newClub = await createClubApi({
        title: newClubTitle,
        description: newClubDesc,
        category: newClubCategory,
        base_department: newClubDept,
        membership_fee: newClubFee,
        join_format: newClubJoinFormat,
        is_recruiting: 1,
      });
      setNotification(`Club "${newClub.title}" created! You are the Admin.`);
      setIsCreateClubOpen(false);
      setNewClubTitle('');
      setNewClubDesc('');
      setNewClubCategory('technical');
      setNewClubDept('Engineering');
      setNewClubFee('free');
      setNewClubJoinFormat('open');
      await loadBackendClubs();
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification(err.message || 'Failed to create club. Make sure you are logged in.');
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsSubmittingClub(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-mainText px-4 py-8 md:px-8 max-w-[1400px] mx-auto transition-colors duration-200">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-accent text-primary px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" /> {notification}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-customBorder pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">CampusForge Clubs</h1>
          <p className="text-subText text-sm">Browse, evaluate, and join registered student operations and field ecosystems.</p>
        </div>

        <button
          onClick={() => setIsCreateClubOpen(true)}
          className="px-5 py-2.5 bg-accent text-primary font-black rounded-xl text-xs hover:brightness-110 transition-all cursor-pointer flex items-center gap-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Club
        </button>

        <div className="flex flex-wrap items-center gap-2 bg-card border border-customBorder rounded-xl p-2.5 shadow-sm max-w-max">
          <div className="px-3 py-1 bg-footer rounded-lg text-center">
            <span className="block text-[10px] text-subText font-bold uppercase tracking-wider">Total Clubs</span>
            <span className="text-sm font-black text-mainText">{metrics.total}</span>
          </div>
          <div className="w-px h-6 bg-customBorder" />
          <div className="px-3 py-1 bg-footer rounded-lg text-center">
            <span className="block text-[10px] text-accent font-bold uppercase tracking-wider">Recruiting</span>
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
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search via club title, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-primary border border-customBorder text-mainText rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-subText/50"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
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
      {backendOnline === true && clubsList.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-green-900/20 border border-green-500/30 rounded-lg text-[10px] font-mono text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          Live from CampusForge API · {clubsList.length} clubs loaded
        </div>
      )}

      {/* Main Full-Width Stack List View */}
      <main>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-card border border-customBorder rounded-xl gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
            <p className="text-subText text-xs font-mono">Loading clubs from API...</p>
          </div>
        ) : filteredAndSortedClubs.length === 0 ? (
          <div className="text-center py-16 bg-card border border-customBorder rounded-xl">
            <p className="text-subText text-sm">
              {backendOnline ? 'No clubs match your filters.' : 'Start the backend server to see clubs.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAndSortedClubs.map((club) => {
              const isHiring = club.isRecruiting;

              return (
                <article
                  key={club.id}
                  className="group bg-card border border-customBorder rounded-xl overflow-hidden shadow-sm hover:border-accent/40 transition-all duration-300 hover:shadow-md flex flex-col md:flex-row"
                >
                  <div className="relative w-full md:w-1/4 lg:w-1/5 min-h-[140px] md:min-h-full bg-footer overflow-hidden border-b md:border-b-0 md:border-r border-customBorder/60 flex-shrink-0 flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/40 group-hover:scale-105 transition-transform duration-500" />
                    
                    <div className="relative z-10 text-center space-y-1">
                      <div className="w-12 h-12 rounded-xl bg-primary border border-customBorder flex items-center justify-center mx-auto shadow-xs font-black text-accent tracking-tighter text-lg uppercase">
                        {club.name.charAt(0)}
                      </div>
                      <span className="block text-[10px] uppercase font-black tracking-widest text-subText/60 pt-1">
                        {club.category}
                      </span>
                    </div>
                    
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-xs backdrop-blur-xs ${
                          isHiring
                            ? 'bg-accent text-white'
                            : 'bg-black/60 text-neutral-400 border border-white/10'
                        }`}
                      >
                        {isHiring ? 'Recruiting' : 'Closed'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
                    <div className="space-y-2 flex-1 max-w-xl">
                      <div>
                        <h3
                          onClick={() => navigate(`/club/${club.rawId}`)}
                          className="text-xl font-bold text-mainText tracking-tight group-hover:text-accent transition-colors duration-200 cursor-pointer"
                        >
                          {club.name}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-subText line-clamp-2 leading-relaxed">
                        {club.briefIntro}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {club.tags?.map((tag) => (
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
                      <div className="flex flex-col gap-3 min-w-[220px] text-xs">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-subText/50 tracking-wider">Base Dept</span>
                          <span className="text-mainText font-semibold block truncate max-w-[240px]">{club.baseDepartment}</span>
                        </div>
                        
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-subText/50 tracking-wider">Active Members / Fee</span>
                          <span className="text-mainText font-medium block">
                            {club.memberCount} enrolled units • <strong className="text-accent uppercase">{club.membershipFee}</strong>
                          </span>
                        </div>

                        <div>
                          <span className="block text-[10px] uppercase font-bold text-subText/50 tracking-wider">Lead Operator</span>
                          <span className="text-accent font-semibold block truncate max-w-[240px]">{club.leadName}</span>
                        </div>
                      </div>

                      <div className="w-full sm:w-36 flex flex-col gap-2 flex-shrink-0">
                        {club.isJoined ? (
                          <button disabled className="w-full bg-green-900/30 border border-green-500/40 text-green-400 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1 cursor-default">
                            <CheckCircle2 size={14} /> Joined
                          </button>
                        ) : isHiring ? (
                          <button
                            onClick={() => handleOpenJoinModal(club)}
                            className="w-full bg-accent text-primary hover:opacity-90 text-xs font-black py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-sm cursor-pointer text-center"
                          >
                            Join ({club.membershipFee})
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/club/${club.rawId}`)}
                            className="w-full bg-primary border border-customBorder text-subText hover:text-mainText text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-center"
                          >
                            View Roster
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/club/${club.rawId}`)}
                          className="w-full text-[11px] text-subText hover:text-mainText font-medium text-center hover:underline cursor-pointer"
                        >
                          View Club Page →
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

      {/* --- Payment & Registration Modal --- */}
      <PaymentModal
        isOpen={!!activePaymentClub}
        onClose={() => setActivePaymentClub(null)}
        title={activePaymentClub?.name || ''}
        subtitle={`Department: ${activePaymentClub?.baseDepartment || 'General'} | Entry: ${activePaymentClub?.joinFormat || 'Open'}`}
        fee={activePaymentClub?.membershipFee || 'Free'}
        type="club"
        onConfirm={async (method) => {
          if (!activePaymentClub) return;
          const res = await joinClubApi(activePaymentClub.rawId, method);
          setNotification(res.detail || `Successfully joined ${activePaymentClub.name}!`);
          setActivePaymentClub(null);
          await loadBackendClubs();
          setTimeout(() => setNotification(null), 4000);
        }}
      />

      {/* --- Create Club Modal --- */}
      {isCreateClubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCreateClubOpen(false)} />
          <div className="relative w-full max-w-lg bg-card rounded-2xl p-6 border border-accent/30 shadow-2xl z-10 space-y-5">
            <div className="flex justify-between items-center border-b border-customBorder pb-3">
              <h3 className="text-base font-bold text-mainText flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent" /> Create a New Club
              </h3>
              <button onClick={() => setIsCreateClubOpen(false)} className="text-subText hover:text-mainText text-lg cursor-pointer">✕</button>
            </div>
            <p className="text-xs text-subText">You will automatically become the <strong className="text-amber-300">Admin</strong> of this club.</p>
            <form onSubmit={handleCreateClub} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-bold text-subText uppercase mb-1">Club Name *</label>
                  <input
                    type="text"
                    value={newClubTitle}
                    onChange={(e) => setNewClubTitle(e.target.value)}
                    placeholder="e.g. AI Research Lab"
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Category</label>
                  <select
                    value={newClubCategory}
                    onChange={(e) => setNewClubCategory(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    <option value="technical">Technical</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={newClubDept}
                    onChange={(e) => setNewClubDept(e.target.value)}
                    placeholder="Engineering"
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Membership Fee</label>
                  <input
                    type="text"
                    value={newClubFee}
                    onChange={(e) => setNewClubFee(e.target.value)}
                    placeholder="free"
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block font-bold text-subText uppercase mb-1">Join Format</label>
                  <select
                    value={newClubJoinFormat}
                    onChange={(e) => setNewClubJoinFormat(e.target.value)}
                    className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    <option value="open">Open (Anyone can join)</option>
                    <option value="interview">Interview Required</option>
                    <option value="portfolio-review">Portfolio Review</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-subText uppercase mb-1">Description *</label>
                <textarea
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  placeholder="Describe what your club is about, its mission, and activities..."
                  className="w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-accent"
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-customBorder">
                <button type="button" onClick={() => setIsCreateClubOpen(false)} className="px-4 py-2 bg-footer text-mainText rounded-xl font-bold cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClub}
                  className="px-6 py-2.5 bg-accent text-primary font-black rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-lg disabled:opacity-60 flex items-center gap-2"
                >
                  {isSubmittingClub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isSubmittingClub ? 'Creating...' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}