export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Skill {
  name: string;
  level: SkillLevel;
}

export interface Student {
  studentId: string;
  name: string;
  email: string;
  department: string;
  bio: string;
  socials: {
    github: string;
    linkedin: string;
    twitter: string;
    website: string;
  };
  skills: Skill[];
  posts: Array<{ id: string; title: string; excerpt: string; date: string; category: string }>;
  achievements: Array<{ id: string; title: string; issuer: string; date: string; description: string }>;
  projects: Array<{ id: string; title: string; description: string; tech: string[]; link: string }>;
  enrolledClubs: Array<{ id: string; name: string; role: string; logo: string }>;
  enrolledEvents: Array<{ id: string; title: string; clubName: string; date: string; location: string }>;
}