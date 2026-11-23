export type ProjectMemberRole = 'ADMIN' | 'MEMBER';

export interface ProjectItem {
  id: number;
  projectKey: string;
  name: string;
  description: string | null;
  ownerId: number;
  ownerName: string;
  currentUserRole: ProjectMemberRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMemberItem {
  userId: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: ProjectMemberRole;
  owner: boolean;
  joinedAt: string;
}

export interface CreateProjectPayload {
  projectKey: string;
  name: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name: string;
  description?: string;
}

export interface AddMemberPayload {
  email: string;
  role: ProjectMemberRole;
}
