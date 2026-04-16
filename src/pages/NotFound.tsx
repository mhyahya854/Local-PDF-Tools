import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-sm">
        <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">That page does not exist in PDF Powerhouse.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Home
          </Link>
          <Link
            to="/tools"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground"
          >
            Browse Tools
          </Link>
          <Link
            to="/jobs"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground"
          >
            View Jobs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
