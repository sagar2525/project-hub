import Link from 'next/link';
import { ProjectForm } from '@/components/ProjectForm';

export default function NewProjectPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
          Day 7 Projects UI
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Create New Project</h2>
        <p className="mt-2 text-sm text-slate-600">
          Add a project from the UI and you will be redirected to its detail page after the API
          creates it.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <ProjectForm mode="create" />
      </div>

      <Link
        href="/"
        className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        Back to Dashboard
      </Link>
    </section>
  );
}
