import { apiClient } from './client';
import type {
  AddMemberPayload,
  CreateProjectPayload,
  ProjectItem,
  ProjectMemberItem,
  ProjectMemberRole,
  UpdateProjectPayload,
} from '../types/project';

export const projectApi = {
  async listMyProjects(): Promise<ProjectItem[]> {
    const { data } = await apiClient.get<ProjectItem[]>('/projects');
    return data;
  },

  async createProject(payload: CreateProjectPayload): Promise<ProjectItem> {
    const { data } = await apiClient.post<ProjectItem>('/projects', payload);
    return data;
  },

  async getProject(projectId: number): Promise<ProjectItem> {
    const { data } = await apiClient.get<ProjectItem>(`/projects/${projectId}`);
    return data;
  },

  async updateProject(projectId: number, payload: UpdateProjectPayload): Promise<ProjectItem> {
    const { data } = await apiClient.put<ProjectItem>(`/projects/${projectId}`, payload);
    return data;
  },

  async deleteProject(projectId: number): Promise<void> {
    await apiClient.delete(`/projects/${projectId}`);
  },

  async listMembers(projectId: number): Promise<ProjectMemberItem[]> {
    const { data } = await apiClient.get<ProjectMemberItem[]>(`/projects/${projectId}/members`);
    return data;
  },

  async addMember(projectId: number, payload: AddMemberPayload): Promise<ProjectMemberItem> {
    const { data } = await apiClient.post<ProjectMemberItem>(`/projects/${projectId}/members`, payload);
    return data;
  },

  async updateMemberRole(
    projectId: number,
    userId: number,
    role: ProjectMemberRole,
  ): Promise<ProjectMemberItem> {
    const { data } = await apiClient.patch<ProjectMemberItem>(
      `/projects/${projectId}/members/${userId}`,
      { role },
    );
    return data;
  },

  async removeMember(projectId: number, userId: number): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },
};
