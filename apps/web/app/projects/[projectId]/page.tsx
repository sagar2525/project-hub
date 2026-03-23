import Link from 'next/link';
import { ProjectDetailActions } from '@/components/ProjectDetailActions';
import { TicketBoard } from '@/components/TicketBoard';
import { ApiError, getProjectById, getTicketsByProject } from '@/lib/api';

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  try {
    const project = await getProjectById(projectId);
    const ticketsResult = await getTicketsByProject(projectId)
      .then((tickets) => ({ tickets, error: null }))
      .catch(() => ({ tickets: [], error: 'Could not load tickets right now.' }));

    return (
      <section className="space-y-4">
        <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Project Detail</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{project.name}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {project.description || 'No description available.'}
              </p>
              <p className="mt-3 text-sm text-slate-700">Status: {project.status}</p>
            </div>
            <div className="md:w-[340px]">
              <ProjectDetailActions project={project} />
            </div>
          </div>
        </header>

        <div>
          {ticketsResult.error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <h3 className="text-lg font-semibold">Could not load tickets</h3>
              <p className="mt-2 text-sm">{ticketsResult.error}</p>
            </div>
          ) : (
            <TicketBoard projectId={project.id} initialTickets={ticketsResult.tickets} />
          )}
        </div>

        <Link href="/" className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
          Back to Dashboard
        </Link>
      </section>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status !== 404) {
      return (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="text-xl font-semibold">Could not load project</h2>
          <p className="mt-2 text-sm">The API did not return project data successfully.</p>
          <Link href="/" className="mt-3 inline-flex rounded-md border border-amber-400 px-3 py-1.5 text-sm hover:bg-amber-100">
            Back to Dashboard
          </Link>
        </section>
      );
    }

    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <p className="mt-2 text-sm">Please check the project URL or create a project from the dashboard.</p>
        <Link href="/" className="mt-3 inline-flex rounded-md border border-amber-400 px-3 py-1.5 text-sm hover:bg-amber-100">
          Back to Dashboard
        </Link>
      </section>
    );
  }
}
