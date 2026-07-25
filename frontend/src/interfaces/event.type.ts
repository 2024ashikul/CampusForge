// ─── Event JSON blobs ─────────────────────────────────────────────────────────
export interface EventDetails {
  location?: string | null;
  banner_url?: string | null;
  profile_picture_url?: string | null;
  virtual_link?: string | null;
  description_markdown?: string | null;
}

export interface EventSettings {
  participation_type?: 'individual' | 'team';
  entrance_fee?: string;          // 'free' or '$15' etc
  is_attendees_public?: boolean;
  is_results_public?: boolean;
}

// ─── Event response from API ──────────────────────────────────────────────────
export interface BackendEvent {
  id: number;
  title: string;
  short_description: string;
  event_type: string;             // 'workshop' | 'competition' | 'guest-speaker' | 'seminar'
  status: string;                 // 'upcoming' | 'ongoing' | 'completed'
  start_time: string;             // ISO datetime string e.g. "2026-08-15T18:00"
  end_time?: string | null;       // ISO datetime string e.g. "2026-08-15T21:00"
  club_id?: number | null;
  tags?: string[] | null;
  results?: string | null;
  details?: EventDetails | null;
  settings?: EventSettings | null;
  club_title?: string;
  registrant_count: number;
  is_registered?: boolean;
  user_role?: 'ADMIN' | 'ENROLLED' | 'EXTERNAL';
  registrant_role?: string | null;
  registrant_status?: string | null;
}

// ─── Helper to format start_time / end_time for display ──────────────────────
export function formatEventDateTime(isoString: string): { date: string; time: string } {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) throw new Error('invalid date');
    const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  } catch {
    return { date: isoString, time: '' };
  }
}

// ─── Legacy-compat interface (used by Event.tsx / Events.tsx pages) ───────────
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
  type: 'workshop' | 'competition' | 'guest-speaker' | 'seminar';
  status: 'upcoming' | 'ongoing' | 'completed';
  title: string;
  logoUrl?: string;
  bannerUrl?: string;
  shortDescription?: string;
  clubName: string;
  tagline?: string;
  tags?: string[];
  startTime: string;              // ISO datetime
  endTime?: string | null;        // ISO datetime
  location: string;
  virtualLink?: string | null;
  spotsLeft: number;
  totalSpots: number;
  entranceFee?: string;
  participationType?: 'individual' | 'team';
  isRegistered?: boolean;
  registrantCount?: number;
  registrants: Array<{ id: string; name: string; department: string; teamName: string }>;
  settings?: {
    isResultsPublished?: boolean;
    isDraft?: boolean;
    isParticipationPublic?: boolean;
    isDiscussionOpen?: boolean;
  };
  descriptionMarkdown: string;
  resultsSpreadsheetUrl?: string | null;
  announcements?: Announcement[] | null;
  discussion?: DiscussionComment[] | null;
}
