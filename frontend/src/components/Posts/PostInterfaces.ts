export type AuthorType = 'STUDENT' | 'CLUB';
export type AttachmentType = 'PHOTO' | 'VIDEO' | 'FILE' | 'LINK';
export type ReactionType = 'LIKE' | 'DISLIKE' | 'STAR';
export type CommentReactionType = 'LIKE' | 'DISLIKE';

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
  reactions: { [userId: string]: CommentReactionType }; // Added comment reaction map track block
}

export interface PostReactionsMap {
  [userId: string]: ReactionType;
}

export interface PostData {
  id: string;
  title: string;
  markdownContent: string; 
  createdAt: string;
  author: PostAuthor;
  attachments: PostAttachment[]; 
  comments: PostComment[]; 
  tags: string[];
  reactions: PostReactionsMap; 
}