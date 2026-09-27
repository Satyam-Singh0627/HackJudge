export type UserRole = 'ADMIN' | 'ORGANIZER' | 'JUDGE' | 'PARTICIPANT';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  bio?: string;
  is_active: boolean;
  created_at: string;
}

export interface Track {
  id: string;
  event_id: string;
  name: string;
  description?: string;
}

export interface Prize {
  id: string;
  event_id: string;
  track_id?: string;
  title: string;
  description?: string;
  amount_usd?: number;
  cash_value?: number;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  reg_start_date: string;
  reg_end_date: string;
  submission_start_date: string;
  submission_end_date: string;
  judging_start_date: string;
  judging_end_date: string;
  results_date: string;
  min_team_size: number;
  max_team_size: number;
  voting_enabled: boolean;
  votes_per_user: number;
  hide_live_voting_results: boolean;
  tracks: Track[];
  prizes: Prize[];
}

export interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: User;
}

export interface Team {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  leader_id: string;
  invite_code: string;
  created_at: string;
  members: TeamMember[];
}

export interface SubmissionVersion {
  id: string;
  version_number: number;
  payload_snapshot: string;
  created_at: string;
}

export interface Submission {
  id: string;
  project_id: string;
  status: string;
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
  versions: SubmissionVersion[];
}

export interface Project {
  id: string;
  team_id: string;
  event_id: string;
  track_id?: string;
  title: string;
  tagline?: string;
  description: string;
  github_url?: string;
  demo_url?: string;
  video_url?: string;
  technologies?: string;
  logo_url?: string;
  is_published: boolean;
  submission_status?: string;
  created_at?: string;
  updated_at?: string;
  team?: Team;
  track?: Track;
  submission?: Submission;
}

export interface ProjectPublic {
  id: string;
  event_id: string;
  track_id?: string;
  title: string;
  tagline?: string;
  description: string;
  github_url?: string;
  demo_url?: string;
  video_url?: string;
  technologies?: string;
  team_name?: string;
  track_name?: string;
  submission_status?: string;
  votes_count: number;
  vote_count?: number;
  created_at: string;
}

export interface RubricCriterion {
  id: string;
  rubric_id: string;
  name: string;
  description?: string;
  weight: number;
  max_score: number;
  sort_order: number;
  is_active: boolean;
}

export interface Rubric {
  id: string;
  event_id: string;
  name: string;
  version: number;
  criteria: RubricCriterion[];
}

export interface CriterionScore {
  id: string;
  criterion_id: string;
  criterion_name?: string;
  raw_score: number;
  max_score: number;
  weight: number;
  weighted_score: number;
}

export interface JudgeScore {
  id: string;
  assignment_id: string;
  judge_id: string;
  project_id: string;
  rubric_id: string;
  raw_total_score: number;
  weighted_total_score: number;
  feedback?: string;
  is_finalized: boolean;
  submitted_at: string;
  criterion_scores: CriterionScore[];
}

export interface AssignedProject {
  assignment_id: string;
  project_id: string;
  title: string;
  project_title?: string;
  team_name?: string;
  tagline?: string;
  description: string;
  track_name?: string;
  github_url?: string;
  demo_url?: string;
  video_url?: string;
  technologies?: string;
  assignment_status: string;
  status?: string;
  is_evaluated: boolean;
  is_finalized: boolean;
  score?: {
    score_id: string;
    raw_total: number;
    weighted_total: number;
    feedback?: string;
    is_finalized: boolean;
    submitted_at?: string;
  };
}

export interface JudgeDashboardData {
  event_id: string;
  judge_id: string;
  judge_name: string;
  total_assigned: number;
  completed: number;
  pending: number;
  progress_percentage: number;
  assigned_projects: AssignedProject[];
}

export interface NormalizationRecord {
  id: string;
  event_id: string;
  project_id: string;
  project_title: string;
  track_name?: string;
  evaluations_count: number;
  raw_average_score: number;
  normalized_z_score: number;
  normalized_final_score: number;
  raw_rank: number;
  normalized_rank: number;
  rank?: number;
  normalized_score?: number;
  created_at?: string;
  computed_at: string;
  project?: Project;
}

export interface RankComparisonRecord {
  project_id: string;
  project_title: string;
  team_name?: string;
  track_name?: string;
  evaluations_count: number;
  raw_average: number;
  raw_rank: number;
  normalized_score: number;
  normalized_rank: number;
  rank_delta: number;
}

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  username?: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  username?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  event_id: string;
  user_id: string;
  recipient_name: string;
  cert_type: string;
  achievement: string;
  issue_date: string;
  verification_hash: string;
  event_title?: string;
}
