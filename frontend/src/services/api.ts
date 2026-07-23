import type { PostData, PostAttachment } from '../interfaces/post.type';

export const API_BASE_URL = 'http://localhost:8000/api';

// ─── Response Types ───────────────────────────────────────────────────────────

export interface BackendPost {
  id: number;
  title: string;
  description: string;
  post_type: string;
  status: string;
  user_id: number | null;
  club_id: number | null;
  tags?: string[] | null;
  attachments?: any[] | null;
  created_at: string;
  author_name?: string;
  author_association?: 'STUDENT' | 'CLUB';
}

export interface BackendClub {
  id: number;
  title: string;
  description: string;
  category: string;
  is_recruiting: number;
  join_format: string;
  membership_fee: string;
  lead_name: string;
  tags?: string[] | null;
  base_department: string;
  image_url?: string | null;
  created_at: string;
  member_count: number;
  is_joined?: boolean;
  user_role?: 'ADMIN' | 'ENROLLED' | 'EXTERNAL';
  member_role?: string | null;
  member_status?: string | null;
}

export interface BackendEvent {
  id: number;
  title: string;
  short_description: string;
  description_markdown?: string | null;
  event_type: string;
  status: string;
  participation_type: string;
  entrance_fee: string;
  date: string;
  time: string;
  location: string;
  virtual_link?: string | null;
  image_url?: string | null;
  club_id?: number | null;
  tags?: string[] | null;
  results?: string | null;
  created_at: string;
  club_title?: string;
  registrant_count: number;
  is_registered?: boolean;
  user_role?: 'ADMIN' | 'ENROLLED' | 'EXTERNAL';
  registrant_role?: string | null;
  registrant_status?: string | null;
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Skill {
  name: string;
  level: SkillLevel;
}

export interface BackendUser {
  id: number;
  name: string;
  email: string;
  department: string;
  profile_pic?: string;
  bio?: string;
  skills?: Skill[];
  is_active: number;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: BackendUser;
}

// ─── Auth Header Helper ───────────────────────────────────────────────────────

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('campusforge-token');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export async function loginApi(email: string, password: string): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function registerApi(payload: {
  name: string;
  email: string;
  password: string;
  department: string;
  bio?: string;
}): Promise<BackendUser> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

export async function getMeApi(): Promise<BackendUser> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

// ─── Posts API ────────────────────────────────────────────────────────────────

export async function getPostsApi(filters?: {
  post_type?: string;
  club_id?: number;
  user_id?: number;
}): Promise<BackendPost[]> {
  const params = new URLSearchParams();
  if (filters?.post_type) params.append('post_type', filters.post_type);
  if (filters?.club_id) params.append('club_id', filters.club_id.toString());
  if (filters?.user_id) params.append('user_id', filters.user_id.toString());

  const res = await fetch(`${API_BASE_URL}/posts?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function createPostApi(payload: {
  title: string;
  description: string;
  post_type: string;
  user_id?: number;
  club_id?: number;
  tags?: string[];
  attachments?: Omit<PostAttachment, 'id' | 'postId'>[];
}): Promise<BackendPost | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  } catch (error) {
    console.error('[API Error] Failed to create post.', error);
    return null;
  }
}

// ─── Clubs API ────────────────────────────────────────────────────────────────

export async function getClubsApi(): Promise<BackendClub[]> {
  const res = await fetch(`${API_BASE_URL}/clubs`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function getClubByIdApi(clubId: number): Promise<BackendClub> {
  const res = await fetch(`${API_BASE_URL}/clubs/${clubId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function createClubApi(payload: {
  title: string;
  description: string;
  category?: string;
  is_recruiting?: number;
  join_format?: string;
  membership_fee?: string;
  tags?: string[];
  base_department?: string;
  image_url?: string;
}): Promise<BackendClub> {
  const res = await fetch(`${API_BASE_URL}/clubs`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function updateClubApi(clubId: number, updates: Partial<BackendClub>): Promise<BackendClub> {
  const res = await fetch(`${API_BASE_URL}/clubs/${clubId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update club' }));
    throw new Error(err.detail || 'Failed to update club');
  }
  return res.json();
}

export async function joinClubApi(clubId: number, paymentMethod: string = "Demo Credit Card"): Promise<{ detail: string; is_joined: boolean; payment_status?: string; payment_method?: string }> {
  const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/join`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ payment_method: paymentMethod }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to join club' }));
    throw new Error(err.detail || 'Failed to join club');
  }
  return res.json();
}

export async function getClubMembersApi(clubId: number): Promise<Array<{
  id: number;
  user_id: number;
  name: string;
  email: string;
  department: string;
  profile_pic?: string;
  role: string;
  status: string;
  joined_at: string;
}>> {
  const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/members`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch club members');
  return res.json();
}

export async function updateClubMemberApi(clubId: number, memberId: number, updates: { role?: string; status?: string }): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/members/${memberId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update member' }));
    throw new Error(err.detail || 'Failed to update member');
  }
  return res.json();
}

// ─── Events API ───────────────────────────────────────────────────────────────

export async function getEventsApi(): Promise<BackendEvent[]> {
  const res = await fetch(`${API_BASE_URL}/events`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function getEventByIdApi(eventId: number): Promise<BackendEvent> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function createEventApi(eventData: Omit<BackendEvent, 'id' | 'created_at' | 'registrant_count'>): Promise<BackendEvent> {
  const res = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(eventData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create event' }));
    throw new Error(err.detail || 'Failed to create event');
  }
  return res.json();
}

export async function updateEventApi(eventId: number, updates: Partial<BackendEvent>): Promise<BackendEvent> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update event' }));
    throw new Error(err.detail || 'Failed to update event');
  }
  return res.json();
}

export async function publishEventResultsApi(eventId: number, resultsText: string): Promise<BackendEvent> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/results`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ results: resultsText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to publish results' }));
    throw new Error(err.detail || 'Failed to publish results');
  }
  return res.json();
}

export async function registerEventApi(
  eventId: number,
  teamName?: string,
  paymentMethod: string = "Demo Credit Card"
): Promise<{ detail: string; is_registered: boolean; payment_status?: string; payment_method?: string }> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ team_name: teamName, payment_method: paymentMethod }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to register for event' }));
    throw new Error(err.detail || 'Failed to register for event');
  }
  return res.json();
}

export async function getEventRegistrantsApi(eventId: number): Promise<Array<{
  id: number;
  user_id: number;
  name: string;
  email: string;
  department: string;
  team_name?: string;
  role: string;
  status: string;
  registered_at: string;
}>> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/registrants`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch event registrants');
  return res.json();
}

export async function updateEventRegistrantApi(eventId: number, registrantId: number, updates: { role?: string; status?: string }): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/registrants/${registrantId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update registrant' }));
    throw new Error(err.detail || 'Failed to update registrant');
  }
  return res.json();
}

// ─── Users API ────────────────────────────────────────────────────────────────

export async function getUsersApi(): Promise<BackendUser[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  } catch (error) {
    console.warn('[API Warning] Could not fetch users.', error);
    return [];
  }
}

export async function getUserByIdApi(userId: number): Promise<BackendUser | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  } catch (error) {
    console.warn('[API Warning] Could not fetch user by id.', error);
    return null;
  }
}

export async function updateUserApi(
  userId: number,
  updates: { bio?: string; profile_pic?: string; skills?: Skill[] }
): Promise<BackendUser | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  } catch (error) {
    console.error('[API Error] Failed to update user.', error);
    return null;
  }
}

// ─── Data Mapper ──────────────────────────────────────────────────────────────

export function mapBackendPostToPostData(bp: BackendPost): PostData {
  const isClub =
    bp.post_type === 'announcement' || bp.club_id !== null || bp.author_association === 'CLUB';
  const postTypeMapped =
    bp.post_type === 'project'
      ? 'PROJECT'
      : bp.post_type === 'announcement'
      ? 'ClubAnnouncement'
      : 'DISCUSSION';

  const mappedAttachments: PostAttachment[] = (bp.attachments || []).map((att: any, idx: number) => ({
    id: `att-${bp.id}-${idx}`,
    postId: `post-${bp.id}`,
    type: (att.type || 'LINK') as any,
    url: att.url || '',
    name: att.name || (att.type === 'PHOTO' ? 'Image Attachment' : att.type === 'VIDEO' ? 'Video Attachment' : 'Reference Link'),
  }));

  const defaultTags =
    bp.post_type === 'project'
      ? ['Project', 'Showcase']
      : bp.post_type === 'announcement'
      ? ['Announcement', 'Club']
      : ['General'];

  return {
    id: `post-${bp.id}`,
    title: bp.title,
    postType: postTypeMapped as any,
    markdownContent: bp.description,
    createdAt: new Date(bp.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    author: {
      id: bp.club_id ? `c-${bp.club_id}` : `u-${bp.user_id || 1}`,
      name: bp.author_name || (isClub ? 'Campus Club' : 'Campus Contributor'),
      avatar: isClub ? '🏛️' : '👨‍💻',
      association: isClub ? 'CLUB' : 'STUDENT',
      roleTitle: isClub ? 'Official Club Feed' : 'Student Developer',
    },
    attachments: mappedAttachments.length > 0 ? mappedAttachments : null,
    comments: [],
    tags: bp.tags && bp.tags.length > 0 ? bp.tags : defaultTags,
    reactions: {},
  };
}
