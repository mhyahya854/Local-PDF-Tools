import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t bg-card mt-20">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-foreground">
              PDF<span className="text-red-600">Powerhouse</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Local-first PDF workflows with desktop-ready engine orchestration.
          </p>
        </div>

        {[
          {
            title: "App",
            items: [
              { label: "Tools", to: "/tools" },
              { label: "Jobs", to: "/jobs" },
              { label: "Settings", to: "/settings" },
            ],
          },
          {
            title: "Docs",
            items: [
              { label: "About", to: "/about" },
              { label: "Supported formats", to: "/tools" },
              { label: "Local-only notes", to: "/about" },
            ],
          },
          {
            title: "Project",
            items: [
              { label: "Licenses", to: "/about" },
              { label: "Report issue", to: "/about" },
              { label: "Privacy (local mode)", to: "/about" },
            ],
          },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{col.title}</h4>
            <ul className="space-y-2">
              {col.items.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PDF Powerhouse. All processing is local by design.
      </div>
    </div>
  </footer>
);

export default Footer;
