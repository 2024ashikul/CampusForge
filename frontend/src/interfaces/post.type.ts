
export type PostType = 'post' | 'project' | 'announcement' | 'announcement_event';
export type PostStatus = 'draft' | 'published' | 'archived';
export type ReactionType = 'heart' | 'like' | 'fire' | 'clap';


export interface PostMedia {
  id?: number;
  media_type: 'photo' | 'video' | 'link';
  file_url: string;
  display_order: number;
}


export interface BackendComment {
  id: number;
  post_id: number;
  user_id: string;
  parent_id: number | null;    
  content: string;
  created_at: string;
  author_name?: string;
  author_pic?: string | null;
}


export interface ReactionCounts {
  heart?: number;
  like?: number;
  fire?: number;
  clap?: number;
  [key: string]: number | undefined;
}


export interface BackendPost {
  id: number;
  title: string;
  description: string;
  post_type: PostType;
  status: PostStatus;
  user_id: string | null;
  club_id: number | null;
  event_id?: number | null;
  tags?: string[] | null;
  media?: PostMedia[] | null;
  created_at: string;
  author_name?: string;
  author_association?: 'STUDENT' | 'CLUB';
  author_pic?: string | null;
  reaction_counts?: ReactionCounts | null;
  user_reaction?: ReactionType | null;
  comment_count?: number;
  email_notifications_queued?: boolean;
  notification_recipient_count?: number;
}


export type AuthorType = 'STUDENT' | 'CLUB';
export type AttachmentType = 'PHOTO' | 'VIDEO' | 'FILE' | 'LINK';

export interface PostAuthor {
  id: string;
  name: string;
  avatar: string;
  association: AuthorType;
  roleTitle?: string;
}

export interface PostAttachment {
  id: string;
  postId: string;
  type: AttachmentType;
  url: string;
  name?: string;
}

export interface PostComment {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface PostData {
  id: string;
  rawId: number;
  title: string;
  postType: PostType;
  status: PostStatus;
  markdownContent: string;
  createdAt: string;
  author: PostAuthor;
  attachments: PostAttachment[] | null;
  comments: PostComment[] | null;
  commentCount: number;
  tags: string[] | null;
  reactionCounts: ReactionCounts | null;
  userReaction: ReactionType | null;
  clubId: number | null;
  userId: string | null;
}
