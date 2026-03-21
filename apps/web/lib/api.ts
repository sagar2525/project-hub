export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiResponse<T> {
  data: T;
  message: string | string[];
  statusCode: number;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | object | null;
};

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary extends Project {
  ticketCount: number;
}

export interface ProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
}

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const body =
    options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body;

  if (body && !headers.has('Content-Type') && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    ...options,
    headers,
    body,
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(', ')
      : payload.message;
    throw new ApiError(message || `API request failed for ${path}`, response.status);
  }

  return payload.data;
}

export async function getProjects(status?: ProjectStatus): Promise<ProjectSummary[]> {
  const query = status ? `?status=${status}` : '';
  return request<ProjectSummary[]>(`/projects${query}`);
}

export async function getProjectById(projectId: string): Promise<Project> {
  return request<Project>(`/projects/${projectId}`);
}

export async function getTicketsByProject(projectId: string): Promise<Ticket[]> {
  return request<Ticket[]>(`/projects/${projectId}/tickets`);
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  return request<Project>('/projects', {
    method: 'POST',
    body: payload,
  });
}

export async function updateProject(
  projectId: string,
  payload: ProjectPayload,
): Promise<Project> {
  return request<Project>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function archiveProject(projectId: string): Promise<Project> {
  return request<Project>(`/projects/${projectId}`, {
    method: 'DELETE',
  });
}
