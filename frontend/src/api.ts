import {
  User, Event, Team, Project, ProjectPublic, Rubric, JudgeScore,
  JudgeDashboardData, NormalizationRecord, RankComparisonRecord,
  Comment, AuditLog, Certificate
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  public setToken(token: string) {
    localStorage.setItem('token', token);
  }

  public clearToken() {
    localStorage.removeItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `Request failed: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {
        // Ignored
      }
      throw new Error(errorMsg);
    }

    // If 204 or empty response
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(username_or_email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async register(data: { email: string; username: string; full_name: string; password: string; role?: string; bio?: string }): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async listUsers(role?: string): Promise<User[]> {
    return this.request<User[]>(`/users${role ? `?role=${role}` : ''}`);
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Events
  async listEvents(): Promise<Event[]> {
    return this.request<Event[]>('/events');
  }

  async getEvent(id: string): Promise<Event> {
    return this.request<Event>(`/events/${id}`);
  }

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEventDetails(id: string, eventData: Partial<Event>): Promise<Event> {
    return this.request<Event>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(eventData),
    });
  }

  async createAnnouncement(eventId: string, data: { title: string; content: string; is_pinned: boolean }): Promise<any> {
    return this.request(`/events/${eventId}/announcements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAnnouncements(eventId: string): Promise<any[]> {
    return this.request<any[]>(`/events/${eventId}/announcements`);
  }

  async registerForEvent(eventId: string): Promise<any> {
    return this.request(`/events/${eventId}/register`, { method: 'POST' });
  }

  // Teams
  async listTeams(eventId?: string): Promise<Team[]> {
    return this.request<Team[]>(`/teams${eventId ? `?event_id=${eventId}` : ''}`);
  }

  async getMyTeam(eventId: string): Promise<Team | null> {
    return this.request<Team | null>(`/teams/my-team?event_id=${eventId}`);
  }

  async createTeam(data: { event_id: string; name: string; description?: string }): Promise<Team> {
    return this.request<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinTeam(invite_code: string): Promise<Team> {
    return this.request<Team>('/teams/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code }),
    });
  }

  async removeTeamMember(teamId: string, userId: string): Promise<any> {
    return this.request(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
  }

  // Projects & Submissions
  async listProjects(eventId?: string): Promise<Project[]> {
    return this.request<Project[]>(`/projects${eventId ? `?event_id=${eventId}` : ''}`);
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(projectData: Partial<Project>): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(projectData),
    });
  }

  async finalizeSubmission(projectId: string): Promise<any> {
    return this.request(`/submissions/${projectId}/finalize`, { method: 'POST' });
  }

  async getPublicGallery(eventId: string, params?: { q?: string; track_id?: string; tech?: string; seed?: string }): Promise<ProjectPublic[]> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.track_id) query.append('track_id', params.track_id);
    if (params?.tech) query.append('tech', params.tech);
    if (params?.seed) query.append('seed', params.seed);
    return this.request<ProjectPublic[]>(`/projects/gallery/${eventId}?${query.toString()}`);
  }

  // Rubrics & Judging
  async getRubric(eventId: string): Promise<Rubric> {
    return this.request<Rubric>(`/rubrics/${eventId}`);
  }

  async createRubric(rubricData: any): Promise<Rubric> {
    return this.request<Rubric>('/rubrics', {
      method: 'POST',
      body: JSON.stringify(rubricData),
    });
  }

  async getJudgeDashboard(eventId: string): Promise<JudgeDashboardData> {
    return this.request<JudgeDashboardData>(`/judges/dashboard/${eventId}`);
  }

  async assignJudgeAlgorithmic(data: { event_id: string; judges_per_project: number }): Promise<any> {
    return this.request('/assignments/algorithmic', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assignJudgeManual(data: { event_id: string; judge_id: string; project_id: string }): Promise<any> {
    return this.request('/assignments/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitScore(scoreReq: { assignment_id: string; criterion_scores: { criterion_id: string; raw_score: number }[]; feedback?: string; finalize: boolean }): Promise<JudgeScore> {
    return this.request<JudgeScore>('/scores', {
      method: 'POST',
      body: JSON.stringify(scoreReq),
    });
  }

  // Normalization
  async runNormalization(eventId: string): Promise<NormalizationRecord[]> {
    return this.request<NormalizationRecord[]>(`/normalization/${eventId}/run`, { method: 'POST' });
  }

  async getNormalizationResults(eventId: string): Promise<NormalizationRecord[]> {
    return this.request<NormalizationRecord[]>(`/normalization/${eventId}/results`);
  }

  async getNormalizationComparison(eventId: string): Promise<RankComparisonRecord[]> {
    return this.request<RankComparisonRecord[]>(`/normalization/${eventId}/comparison`);
  }

  // Voting & Comments
  async castVote(projectId: string): Promise<any> {
    return this.request('/votes', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    });
  }

  async getVotingStats(eventId: string): Promise<any> {
    return this.request(`/votes/stats/${eventId}`);
  }

  async getComments(projectId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/comments/project/${projectId}`);
  }

  async addComment(projectId: string, content: string): Promise<Comment> {
    return this.request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, content }),
    });
  }

  // Audit
  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/audit');
  }

  // Certificates
  async generateCertificate(data: { user_id: string; event_id: string; cert_type: string; achievement: string }): Promise<Certificate> {
    return this.request<Certificate>('/certificates/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyCertificate(identifier: string): Promise<{ valid: boolean; certificate?: Certificate; message: string }> {
    return this.request(`/certificates/verify/${identifier}`);
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return this.request<Certificate[]>(`/certificates/user/${userId}`);
  }

  // CSV Downloads
  getExportUrl(type: 'participants' | 'teams' | 'submissions' | 'scores' | 'rankings' | 'audit', eventId?: string): string {
    const token = this.getToken();
    const base = `${API_BASE}/exports/${type}${eventId && type !== 'audit' ? `/${eventId}` : ''}`;
    return base;
  }
}

export const api = new ApiClient();
