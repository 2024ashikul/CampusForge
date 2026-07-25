// ─── Skill ────────────────────────────────────────────────────────────────────
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Skill {
  name: string;
  level: SkillLevel;
}

// ─── User / Student ───────────────────────────────────────────────────────────
export interface Socials {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  [key: string]: string | undefined;
}

// Department codes mapping (derived from student_id YYPPNNN)
export const DEPARTMENT_CODES: Record<string, string> = {
  "01": "Civil Engineering",
  "02": "Mechanical Engineering",
  "03": "Electrical Engineering",
  "04": "Computer Science & Engineering",
  "05": "Electronics & Communication Engineering",
  "06": "Chemical Engineering",
  "07": "Architecture",
  "08": "Business Administration",
  "09": "English",
  "10": "Mathematics & Physics",
};

export function deriveDepartment(studentId: string): string {
  if (studentId.length >= 4) {
    const code = studentId.slice(2, 4);
    return DEPARTMENT_CODES[code] ?? `Department ${code}`;
  }
  return "Unknown";
}

export interface BackendUser {
  student_id: string;          // YYPPNNN e.g. "2604001" — also the primary key
  name: string;
  email: string;
  department: string;          // derived from student_id by backend
  profile_pic?: string | null;
  bio?: string | null;
  skills?: Skill[];
  socials?: Socials | null;
  created_at: string;
}