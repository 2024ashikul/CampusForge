export type PostType = 'ClubAnnouncement' | 'EventAnnouncement' | 'UserPost' | 'Project' | 'ClubPost' | 'EventPost';
export type AttachmentType = 'PHOTO' | 'VIDEO' | 'FILE' | 'LINK';
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type AuthorType = 'STUDENT' | 'CLUB';

export interface Skill {
    name: string;
    level: SkillLevel;
}

interface Student {
    studentId: string;
    name: string;
    email: string;
    department: string;
    bio: string;
    skills: Skill[];
}


interface StudentDetails extends Student {
    posts: Post[],
    projects: Project[],
    enrolledClubs: Club[],
    enrolledEvents: Event[]
}

interface Club {
    name: string;
    tagline: string;
    description: string;
    bannerUrl: string;
    logoUrl: string;
    location: string;
    founded: string;
}

interface ClubDetails extends Club {
    members: Student[],
    posts: Post[],
    events: Event[],
}

interface Post {
    id: string;
    title: string;
    postType: PostType,
    markdownContent: string;
    createdAt: string;
    author: PostAuthor;
    attachments: PostAttachment[] | null;
    comments: PostComment[] | null;
    tags: string[] | null;
    reactions: PostReactionsMap | null;
}


export interface PostAuthor {
    id: string;
    name: string;
    avatar: string;
    association: AuthorType;
    roleTitle?: string;
}

export interface PostComment {
    id: string;
    postId: string;
    parentId: string | null;
    authorName: string;
    authorAvatar: string;
    content: string;
    createdAt: string;
    reactions: { [userId: string]: CommentReactionType };
}

export interface PostReactionsMap {
    [userId: string]: ReactionType;
}

export type ReactionType = 'LIKE' | 'DISLIKE' | 'STAR';
export type CommentReactionType = 'LIKE' | 'DISLIKE';
export interface PostAttachment {
    id: string;
    postId: string;
    type: AttachmentType;
    url: string;
    name?: string;
}





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
    id: string;
    type: 'workshop' | 'competition' | 'guest-speaker';
    status: 'upcoming' | 'completed';
    title: string;
    shortDescription: string,
    clubName: string;
    tags: [],
    date: string;
    time: string;
    location: string;
    virtualLink?: string | null;
    spotsLeft: number;
    totalSpots: number;
    registrants: { id: string; name: string; department: string; teamName: string }[];

    descriptionMarkdown: string;
    resultsSpreadsheetUrl?: string | null;

    announcements?: Announcement[] | null;
    discussion: DiscussionComment[] | null;
}