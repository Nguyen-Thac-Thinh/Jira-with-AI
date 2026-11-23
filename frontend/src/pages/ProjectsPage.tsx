import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FolderPlus, Layers, Shield, Users, X } from 'lucide-react';
import { projectApi } from '../api/projectApi';
import type { ProjectItem } from '../types/project';
import { AppShell } from '../components/layout/AppShell';

function deriveSuggestedKey(projectName: string): string {
  const words = projectName
    .trim()
    .replace(/[^A-Za-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) {
    return words[0].slice(0, 6).toUpperCase();
  }
  return words
    .map((w) => w[0])
    .join('')
    .slice(0, 8)
    .toUpperCase();
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createModalRef = useRef<HTMLDialogElement | null>(null);
  const [name, setName] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await projectApi.listMyProjects();
      setProjects(list);
    } catch {
      setErrorMsg('Unable to load your workspaces. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const openCreateModal = () => {
    setName('');
    setProjectKey('');
    setKeyManuallyEdited(false);
    setDescription('');
    setFormError(null);
    createModalRef.current?.showModal();
  };

  const closeCreateModal = () => {
    createModalRef.current?.close();
  };

  const handleCreateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const created = await projectApi.createProject({
        projectKey: projectKey.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setProjects((prev) => [created, ...prev]);
      closeCreateModal();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setFormError(String(err.response.data.message));
      } else {
        setFormError('Could not create project. Check that the project key is unique (2–10 alphanumeric chars).');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-600">
            Select a project workspace to manage sprints, Kanban tasks, team members, and AI estimations.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <FolderPlus className="h-4 w-4" aria-hidden="true" />
          Create project
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white p-6" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Layers className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">No projects yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Create your first Agile project workspace to invite teammates, plan sprints, and estimate story points with AI.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FolderPlus className="h-4 w-4" aria-hidden="true" />
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => (
            <Link
              key={proj.id}
              to={`/projects/${proj.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold tracking-wider text-blue-700">
                    {proj.projectKey}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      proj.currentUserRole === 'ADMIN'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Shield className="h-3 w-3" aria-hidden="true" />
                    {proj.currentUserRole}
                  </span>
                </div>

                <h2 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-blue-600">
                  {proj.name}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span>Lead: {proj.ownerName}</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {proj.memberCount} {proj.memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <dialog
        ref={createModalRef}
        aria-labelledby="create-project-dialog-title"
        className="m-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="create-project-dialog-title" className="text-lg font-bold text-slate-900">
            Create new project
          </h2>
          <button
            type="button"
            onClick={closeCreateModal}
            aria-label="Close create project dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleCreateSubmit} className="space-y-4 p-6">
          {formError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="proj-name" className="mb-1 block text-sm font-medium text-slate-700">
              Project name
            </label>
            <input
              id="proj-name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={150}
              autoFocus
              value={name}
              onChange={(e) => {
                const nextName = e.target.value;
                setName(nextName);
                if (!keyManuallyEdited) {
                  setProjectKey(deriveSuggestedKey(nextName));
                }
              }}
              placeholder="e.g. AgileFlow Core Engine"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label htmlFor="proj-key" className="mb-1 block text-sm font-medium text-slate-700">
              Project key
            </label>
            <span id="proj-key-hint" className="mb-1 block text-xs text-slate-500">
              2–10 uppercase letters/numbers, used as prefix for issues (e.g. AFLOW-1).
            </span>
            <input
              id="proj-key"
              name="projectKey"
              type="text"
              required
              minLength={2}
              maxLength={10}
              pattern="[A-Za-z][A-Za-z0-9]*"
              aria-describedby="proj-key-hint"
              value={projectKey}
              onChange={(e) => {
                setKeyManuallyEdited(true);
                setProjectKey(e.target.value.toUpperCase());
              }}
              placeholder="AFLOW"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono uppercase outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label htmlFor="proj-desc" className="mb-1 block text-sm font-medium text-slate-700">
              Description (optional)
            </label>
            <textarea
              id="proj-desc"
              name="description"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goals, scope, and team notes..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={closeCreateModal}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
      </dialog>
    </AppShell>
  );
}
