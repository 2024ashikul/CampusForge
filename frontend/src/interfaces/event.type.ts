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
    logoUrl :string,
    bannerUrl :string,
    shortDescription : string,
    clubName: string;
    tagline : string,
    tags : [],
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