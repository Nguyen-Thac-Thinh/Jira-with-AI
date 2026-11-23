import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Crown,
  Settings,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { projectApi } from '../api/projectApi';
import type { ProjectItem, ProjectMemberItem, ProjectMemberRole } from '../types/project';
import { AppShell } from '../components/layout/AppShell';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const numericId = Number(projectId);

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Add member form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectMemberRole>('MEMBER');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  // Edit project settings state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // Delete confirmation modal
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!numericId) return;
    setLoading(true);
    Promise.all([projectApi.getProject(numericId), projectApi.listMembers(numericId)])
      .then(([proj, roster]) => {
        setProject(proj);
        setMembers(roster);
        setEditName(proj.name);
        setEditDesc(proj.description || '');
      })
      .catch(() => {
        setPageError('Project not found or you do not have access.');
      })
      .finally(() => setLoading(false));
  }, [numericId]);

  const isAdmin = project?.currentUserRole === 'ADMIN';

  const handleInviteMember = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project) return;
    setInviteError(null);
    setInviting(true);
    try {
      const added = await projectApi.addMember(project.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setMembers((prev) => [...prev, added]);
      setProject((prev) => (prev ? { ...prev, memberCount: prev.memberCount + 1 } : prev));
      setInviteEmail('');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setInviteError(String(err.response.data.message));
      } else {
        setInviteError('Could not add member. Verify the user has registered an account.');
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: ProjectMemberRole) => {
    if (!project) return;
    try {
      const updated = await projectApi.updateMemberRole(project.id, userId, newRole);
      setMembers((prev) => prev.map((m) => (m.userId === userId ? updated : m)));
    } catch {
      alert('Failed to update member role.');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!project) return;
    try {
      await projectApi.removeMember(project.id, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      setProject((prev) => (prev ? { ...prev, memberCount: Math.max(1, prev.memberCount - 1) } : prev));
    } catch {
      alert('Failed to remove member.');
    }
  };

  const handleSaveSettings = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project) return;
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      const updated = await projectApi.updateProject(project.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      setProject(updated);
      setSettingsMsg('Project settings saved.');
    } catch {
      setSettingsMsg('Failed to update project settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!project) return;
    setDeleting(true);
    try {
      await projectApi.deleteProject(project.id);
      deleteDialogRef.current?.close();
      navigate('/projects', { replace: true });
    } catch {
      setDeleting(false);
      alert('Could not delete project.');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-12 text-center text-sm text-slate-500">Loading project workspace...</div>
      </AppShell>
    );
  }

  if (pageError || !project) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-700">{pageError || 'Project unavailable'}</p>
          <Link
            to="/projects"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to projects
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          All Projects
        </Link>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-bold tracking-wider text-white shadow-sm">
              {project.projectKey}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <p className="text-sm text-slate-600">{project.description || 'No project description'}</p>
            </div>
          </div>

          <span className="inline-flex items-center self-start rounded-full bg-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-700">
            Your Role: {project.currentUserRole}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Team Members Roster (2 cols) */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <h2 className="text-lg font-bold text-slate-900">
                Team Members ({members.length})
              </h2>
            </div>
          </div>

          {isAdmin && (
            <form onSubmit={handleInviteMember} className="mb-6 rounded-xl bg-slate-50 p-4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                Add member by registered email
              </p>
              {inviteError && (
                <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {inviteError}
                </div>
              )}
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  aria-label="Teammate email address"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-blue-600"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as ProjectMemberRole)}
                  aria-label="Member role"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  {inviting ? 'Adding...' : 'Add member'}
                </button>
              </div>
            </form>
          )}

          <div
            tabIndex={0}
            role="region"
            aria-labelledby="roster-table-caption"
            className="table-wrapper rounded-xl border border-slate-200"
          >
            <table className="responsive-roster-table text-left text-sm">
              <caption id="roster-table-caption" className="sr-only">
                Project team members and permissions
              </caption>
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Member</th>
                  <th scope="col" className="px-4 py-3">Email</th>
                  <th scope="col" className="px-4 py-3">Role</th>
                  <th scope="col" className="px-4 py-3">Joined</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.userId} className="hover:bg-slate-50/80">
                    <th scope="row" className="px-4 py-3 font-semibold text-slate-900">
                      <span className="inline-flex items-center gap-1.5">
                        {m.fullName}
                        {m.owner && (
                          <span
                            title="Project Owner"
                            className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800"
                          >
                            <Crown className="h-3 w-3" aria-hidden="true" />
                            Owner
                          </span>
                        )}
                      </span>
                    </th>
                    <td className="px-4 py-3 text-slate-600">{m.email}</td>
                    <td className="px-4 py-3">
                      {isAdmin && !m.owner ? (
                        <select
                          aria-label={`Role for ${m.fullName}`}
                          value={m.role}
                          onChange={(e) =>
                            void handleRoleChange(m.userId, e.target.value as ProjectMemberRole)
                          }
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800"
                        >
                          <option value="MEMBER">MEMBER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      ) : (
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {m.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin && !m.owner ? (
                        <button
                          type="button"
                          onClick={() => void handleRemoveMember(m.userId)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Remove
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Project Settings panel (1 col) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-700" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-900">Workspace Settings</h2>
          </div>

          {isAdmin ? (
            <>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                {settingsMsg && (
                  <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                    {settingsMsg}
                  </p>
                )}

                <div>
                  <label htmlFor="edit-proj-name" className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Project Name
                  </label>
                  <input
                    id="edit-proj-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={150}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label htmlFor="edit-proj-desc" className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Description
                  </label>
                  <textarea
                    id="edit-proj-desc"
                    rows={3}
                    maxLength={2000}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingSettings ? 'Saving...' : 'Save changes'}
                </button>
              </form>

              <div className="mt-8 border-t border-red-100 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-600">
                  Danger Zone
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Deleting this project permanently removes all associated sprints, issues, and member assignments.
                </p>
                <button
                  type="button"
                  onClick={() => deleteDialogRef.current?.showModal()}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete project
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Only project administrators can modify project details or manage team members.
            </p>
          )}
        </section>
      </div>

      <dialog
        ref={deleteDialogRef}
        aria-labelledby="delete-project-dialog-title"
        className="m-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
      >
        <h2 id="delete-project-dialog-title" className="text-lg font-bold text-slate-900">
          Delete project {project.projectKey}?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Are you sure you want to permanently delete <strong>{project.name}</strong>? This action cannot be undone.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            autoFocus
            onClick={() => deleteDialogRef.current?.close()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleConfirmDelete()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? 'Deleting...' : 'Delete permanently'}
          </button>
        </div>
      </dialog>
    </AppShell>
  );
}
