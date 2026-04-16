import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JobProgressCard from "@/components/jobs/JobProgressCard";
import { Button } from "@/components/ui/button";
import { useJobStore } from "@/stores/useJobStore";

const Jobs = () => {
  const jobs = useJobStore((state) => state.jobs);
  const clearCompleted = useJobStore((state) => state.clearCompleted);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Jobs</h1>
            <p className="text-sm text-muted-foreground">
              Track active, completed, and failed conversion jobs.
            </p>
          </div>
          <Button variant="outline" onClick={clearCompleted}>
            Clear Completed
          </Button>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            No jobs yet. Run a tool to see progress and output history.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <JobProgressCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Jobs;
