import type { PostData, PostAttachment, BackendPost, PostMedia, BackendComment, ReactionType } from '../interfaces/post.type';
import type { BackendUser, Skill, SkillLevel, Socials } from '../interfaces/student.type';
import type { BackendClub, ClubDetails, ClubSettings } from '../interfaces/club.type';
import type { BackendEvent, EventDetails, EventSettings, EventData } from '../interfaces/event.type';
import { deriveDepartment } from '../interfaces/student.type';

export { type BackendPost, type BackendComment, type BackendClub, type BackendEvent, type BackendUser, type SkillLevel, type Skill };

export interface SkillSummary { skill: string; student_count: number; }
export interface SkillStudent {
  student_id: string; name: string; email: string; department: string;
  profile_pic?: string | null; bio?: string | null; skill: string; skill_level: SkillLevel;
}

export const API_BASE_URL = 'http://localhost:8000/api';



export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('campusforge-token');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: BackendUser;
}



export async function loginApi(student_id: string, email: string, password: string): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function registerApi(payload: {
  student_id: string;
  name: string;
  email: string;
  password: string;
  bio?: string;
  profile_pic?: string;
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
  const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function getDepartmentCodesApi(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE_URL}/auth/department-codes`);
  if (!res.ok) throw new Error('Failed to fetch department codes');
  return res.json();
}



export async function getPostsApi(filters?: {
  post_type?: string;
  club_id?: number;
  event_id?: number;
  user_id?: string;
  status?: string;
  tag?: string;
}): Promise<BackendPost[]> {
  const params = new URLSearchParams();
  if (filters?.post_type) params.append('post_type', filters.post_type);
  if (filters?.club_id)   params.append('club_id', filters.club_id.toString());
  if (filters?.event_id)  params.append('event_id', filters.event_id.toString());
  if (filters?.user_id)   params.append('user_id', filters.user_id);
  if (filters?.status)    params.append('status', filters.status);
  if (filters?.tag)       params.append('tag', filters.tag);

  const res = await fetch(`${API_BASE_URL}/posts?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function getPostByIdApi(postId: number): Promise<BackendPost> {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}




export const createPostApi = async (postPayload: any): Promise<BackendPost> => {
  
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(postPayload),
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        
        errorMsg = typeof errorJson.detail === 'object'
          ? JSON.stringify(errorJson.detail, null, 2)
          : errorJson.detail;
      }
    } catch {
      
    }
    throw new Error(errorMsg);
  }

  return await response.json();
};

export async function updatePostApi(postId: number, updates: {
  title?: string;
  description?: string;
  post_type?: string;
  status?: string;
  tags?: string[];
  media?: Omit<PostMedia, 'id'>[];
}): Promise<BackendPost> {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update post' }));
    throw new Error(err.detail || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function publishPostApi(postId: number): Promise<BackendPost> {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}/publish`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to publish post' }));
    throw new Error(err.detail || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function deletePostApi(postId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete post' }));
    throw new Error(err.detail || `HTTP error ${res.status}`);
  }
}



export async function getCommentsApi(postId: number): Promise<BackendComment[]> {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function createCommentApi(postId: number, payload: {
  content: string;
  parent_id?: number | null;
}): Promise<BackendComment> {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to post comment' }));
    throw new Error(err.detail || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function updateCommentApi(postId: number, commentId: number, content: string): Promise<BackendComment> {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update comment' }));
    throw new Error(err.detail || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function deleteCommentApi(postId: number, commentId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete comment' }));
    throw new Error(err.detail || `HTTP error ${res.status}`);
  }
}



export async function reactToPostApi(postId: number, reaction_type: ReactionType): Promise<void> {
  
  const res = await fetch(`${API_BASE_URL}/posts/${postId}/reactions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reaction_type }),
  });
  
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ detail: 'Failed to react' }));
    throw new Error(err.detail || `HTTP error ${res.status}`);
  }
}

export async function removeReactionApi(postId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/posts/${postId}/reactions`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to remove reaction' }));
    throw new Error(err.detail || `HTTP error ${res.status}`);
  }
}



export async function getClubsApi(): Promise<BackendClub[]> {
  const res = await fetch(`${API_BASE_URL}/clubs`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function getClubByIdApi(clubId: number): Promise<BackendClub> {
  const res = await fetch(`${API_BASE_URL}/clubs/${clubId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function createClubApi(payload: {
  title: string;
  description: string;
  details?: Partial<ClubDetails>;
  settings?: Partial<ClubSettings>;
}): Promise<BackendClub> {
  const res = await fetch(`${API_BASE_URL}/clubs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function updateClubApi(clubId: number, updates: {
  title?: string;
  description?: string;
  details?: Partial<ClubDetails>;
  settings?: Partial<ClubSettings>;
}): Promise<BackendClub> {
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

export async function joinClubApi(
  clubId: number
): Promise<{ detail: string; is_joined: boolean; status?: string }> {
  const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/join`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to join club' }));
    throw new Error(err.detail || 'Failed to join club');
  }
  return res.json();
}

export async function getClubMembersApi(clubId: number): Promise<Array<{
  user_id: string;
  name: string;
  email: string;
  student_id: string;
  department: string;
  profile_pic?: string;
  role: string;
  status: string;
  joined_at: string;
}>> {
  const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/members`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch club members');
  return res.json();
}

export async function updateClubMemberApi(
  clubId: number,
  userId: string,
  updates: { role?: string; status?: string }
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/members/${encodeURIComponent(userId)}`, {
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



export async function getEventsApi(): Promise<BackendEvent[]> {
  const res = await fetch(`${API_BASE_URL}/events`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function getEventByIdApi(eventId: number): Promise<BackendEvent> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function createEventApi(payload: {
  title: string;
  description: string;
  event_type: string;
  status?: string;
  start_time: string;
  end_time?: string;
  club_id?: number;
  details?: Partial<EventDetails>;
  settings?: Partial<EventSettings>;
}): Promise<BackendEvent> {
  const res = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create event' }));
    throw new Error(err.detail || 'Failed to create event');
  }
  return res.json();
}

export async function updateEventApi(eventId: number, updates: {
  title?: string;
  description?: string;
  event_type?: string;
  status?: string;
  start_time?: string;
  end_time?: string;
  details?: Partial<EventDetails>;
  settings?: Partial<EventSettings>;
}): Promise<BackendEvent> {
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

export async function deleteEventApi(eventId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete event' }));
    throw new Error(err.detail || 'Failed to delete event');
  }
}

export async function deleteClubApi(clubId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/clubs/${clubId}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete club' }));
    throw new Error(err.detail || 'Failed to delete club');
  }
}

export async function registerEventApi(
  eventId: number,
  teamName?: string,
  teamMembers: string[] = []
): Promise<{ detail: string; is_registered: boolean; status?: string }> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ team_name: teamName, team_members: teamMembers }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to register for event' }));
    throw new Error(err.detail || 'Failed to register for event');
  }
  return res.json();
}

export async function addTeamMembersApi(eventId: number, teamName: string, teamMembers: string[]): Promise<{ detail: string }> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/teams/${encodeURIComponent(teamName)}/members`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ team_members: teamMembers }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to add team members' }));
    throw new Error(err.detail || 'Failed to add team members');
  }
  return res.json();
}

export async function getEventRegistrantsApi(eventId: number): Promise<Array<{
  id: number;
  user_id: string;
  name: string;
  email: string;
  student_id: string;
  department: string;
  team_name?: string;
  role: string;
  status: string;
  registered_at: string;
}>> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/registrants`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch event registrants');
  return res.json();
}

export async function updateEventRegistrantApi(
  eventId: number,
  registrantId: number,
  updates: { role?: string; status?: string; team_name?: string }
): Promise<any> {
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

export async function addEventAdminApi(eventId: number, studentId: string, displayRole: string): Promise<{ detail: string }> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/admins`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ student_id: studentId, display_role: displayRole }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to add event admin' }));
    throw new Error(err.detail || 'Failed to add event admin');
  }
  return res.json();
}

export async function removeEventTeamApi(eventId: number, teamName: string): Promise<{ detail: string }> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/teams/${encodeURIComponent(teamName)}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to remove team' }));
    throw new Error(err.detail || 'Failed to remove team');
  }
  return res.json();
}



export async function getUsersApi(): Promise<BackendUser[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  } catch (error) {
    console.warn('[API Warning] Could not fetch users.', error);
    return [];
  }
}

export async function getSkillsApi(): Promise<SkillSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/skills`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  } catch (error) { console.warn('[API Warning] Could not fetch skills.', error); return []; }
}

export async function getStudentsBySkillApi(skill: string): Promise<SkillStudent[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/skills/${encodeURIComponent(skill)}`, { headers: getAuthHeaders() });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  } catch (error) { console.warn('[API Warning] Could not fetch students for skill.', error); return []; }
}

export async function getUserByIdApi(userId: string): Promise<BackendUser | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  } catch (error) {
    console.warn('[API Warning] Could not fetch user by id.', error);
    return null;
  }
}

export async function getUserClubsApi(userId: string): Promise<BackendClub[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/clubs`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  } catch (error) {
    console.warn('[API Warning] Could not fetch user clubs.', error);
    return [];
  }
}

export async function getUserEventsApi(userId: string): Promise<BackendEvent[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/events`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  } catch (error) {
    console.warn('[API Warning] Could not fetch user events.', error);
    return [];
  }
}

export async function updateUserApi(userId: string, updates: {
  name?: string;
  bio?: string;
  profile_pic?: string;
  skills?: Skill[];
  socials?: Socials;
}): Promise<BackendUser | null> {
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

export async function uploadFileApi(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const token = localStorage.getItem('campusforge-token');
  const res = await fetch(`${API_BASE_URL}/uploads/file`, {
    method: 'POST',
    
    
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || `HTTP error ${res.status}`);
  }
  return res.json();
}




export function mapBackendPostToPostData(bp: BackendPost): PostData {
  const isClub = bp.author_association === 'CLUB' || bp.club_id !== null;

  const mappedAttachments: PostAttachment[] = (bp.media || []).map((m, idx) => ({
    id: `media-${bp.id}-${idx}`,
    postId: `post-${bp.id}`,
    type: (m.media_type.toUpperCase() as any) || 'LINK',
    url: m.file_url,
    name: m.media_type === 'photo' ? 'Image' : m.media_type === 'video' ? 'Video' : 'Link',
  }));

  return {
    id: `post-${bp.id}`,
    rawId: bp.id,
    title: bp.title,
    postType: bp.post_type,
    status: bp.status,
    markdownContent: bp.description,
    createdAt: new Date(bp.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    }),
    author: {
      id: bp.club_id ? `c-${bp.club_id}` : `u-${bp.user_id || 0}`,
      name: bp.author_name || (isClub ? 'Campus Club' : 'Campus Contributor'),
      avatar: bp.author_pic || (isClub ? '🏛️' : '👨‍💻'),
      association: isClub ? 'CLUB' : 'STUDENT',
      roleTitle: isClub ? 'Official Club Feed' : 'Student',
    },
    attachments: mappedAttachments.length > 0 ? mappedAttachments : null,
    comments: [],
    commentCount: bp.comment_count || 0,
    tags: bp.tags && bp.tags.length > 0 ? bp.tags : null,
    reactionCounts: bp.reaction_counts || null,
    userReaction: bp.user_reaction || null,
    clubId: bp.club_id,
    userId: bp.user_id,
  };
}


export function mapBackendEventToEventData(be: BackendEvent): EventData {
  const det = be.details || {};
  const set = be.settings || {};
  return {
    rawId: be.id,
    id: `event-${be.id}`,
    type: (be.event_type as any) || 'workshop',
    status: (be.status as any) || 'upcoming',
    title: be.title,
    shortDescription: be.description,
    clubName: be.club_title || 'Campus Organization',
    tags: be.details?.tags || [],
    startTime: be.start_time,
    endTime: be.end_time || null,
    location: det.location || 'TBA',
    virtualLink: det.virtual_link || null,
    bannerUrl: det.banner_url || undefined,
    entranceFee: set.entrance_fee || 'free',
    participationType: (set.participation_type as any) || 'individual',
    isRegistered: be.is_registered,
    registrantCount: be.registrant_count,
    registrants: [],
    spotsLeft: 50,
    totalSpots: 50,
    settings: {
      isResultsPublished: set.is_results_public,
      isParticipationPublic: set.is_attendees_public,
    },
    descriptionMarkdown: det.description_markdown || be.description,
    resultsSpreadsheetUrl: det.results || null,
  };
}


export function mapBackendClubToDisplay(bc: BackendClub) {
  const det = bc.details || {};
  const set = bc.settings || {};
  return {
    id: bc.id,
    title: bc.title,
    description: bc.description,
    imageUrl: det.banner_url || null,
    category: det.category || 'technical',
    leadName: det.lead_name || 'Club Lead',
    baseDepartment: det.base_department || 'Engineering',
    founded: det.founded || null,
    isRecruiting: set.is_recruiting ?? true,
    joinFormat: set.join_format || 'open',
    membershipFee: set.membership_fee || 'free',
    isResultsPublic: set.is_results_public ?? true,
    isOpen: set.is_open ?? true,
    paymentFee: set.payment_fee ?? 0,
    memberCount: bc.member_count,
    isJoined: bc.is_joined ?? false,
    userRole: bc.user_role || 'EXTERNAL',
    memberRole: bc.member_role || null,
    memberStatus: bc.member_status || null,
    createdAt: bc.created_at,
  };
}
