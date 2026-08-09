
export interface ClubDetails {
  founded?: string | null;
  lead_name?: string | null;
  base_department?: string | null;
  category?: string | null;      
  banner_url?: string | null;
  profile_picture_url?: string | null;
}

export interface ClubSettings {
  is_recruiting?: boolean;
  join_format?: 'open' | 'interview' | 'portfolio-review';
  membership_fee?: string;       
  is_results_public?: boolean;
  is_open?: boolean;
  payment_fee?: number;
}


export interface BackendClub {
  id: number;
  title: string;
  description: string;
  details?: ClubDetails | null;
  settings?: ClubSettings | null;
  created_at: string;
  member_count: number;
  event_count?: number;
  is_joined?: boolean;
  user_role?: 'ADMIN' | 'ENROLLED' | 'EXTERNAL';
  member_role?: string | null;
  member_status?: string | null;
}
