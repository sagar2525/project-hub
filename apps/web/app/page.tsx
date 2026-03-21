import Link from 'next/link';
import { DashboardFilters } from '@/components/DashboardFilters';
import { ProjectCard } from '@/components/ProjectCard';
import { getProjects } from '@/lib/api';

type DashboardSearchParams = Promise<{
  q?: string;
  status?: string;
}>;

interface DashboardPageProps {
  searchParams: DashboardSearchParams;
}

function normalizeStatusFilter(status?: string): 'ALL' | 'ACTIVE' | 'ARCHIVED' {
  if (status === 'ACTIVE' || status === 'ARCHIVED') {
    return status;
  }

  return 'ALL';
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const filters = await searchParams;
  const statusFilter = normalizeStatusFilter(filters.status);
  const query = filters.q?.trim() ?? '';

  try {
    const projects = await getProjects(statusFilter === 'ALL' ? undefined : statusFilter);
    const filteredProjects = query
      ? projects.filter((project) => {
          const haystack = `${project.name} ${project.description ?? ''}`.toLowerCase();
          return haystack.includes(query.toLowerCase());
        })
      : projects;

    return (
      <section>
        <header className="mb-6 rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Day 7 Frontend</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Projects Dashboard</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Search, filter, create, and open projects from a single dashboard backed by the
            NestJS API.
          </p>
          <Link
            href="/projects/new"
            className="mt-4 inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            New Project
          </Link>

          <DashboardFilters initialQuery={query} initialStatus={statusFilter} />
        </header>

        {filteredProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            {query || statusFilter !== 'ALL'
              ? 'No projects match the current search or status filter.'
              : 'No projects found yet. Create your first one from the dashboard.'}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                description={project.description}
                status={project.status}
                ticketCount={project.ticketCount}
              />
            ))}
          </div>
        )}
      </section>
    );
  } catch {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-xl font-semibold">Could not fetch projects</h2>
        <p className="mt-2 text-sm">
          Make sure the API is running at http://localhost:3001 and returning valid project data.
        </p>
      </section>
    );
  }
}
