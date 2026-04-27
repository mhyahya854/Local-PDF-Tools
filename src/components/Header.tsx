import { Link } from "react-router-dom";
import { FileText, Globe, Menu, Moon, Sun, WifiOff, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { useSettings } from "@/providers/SettingsProvider";
import { useEngines } from "@/providers/EngineProvider";

const navItems = [
  { label: "Tools", to: "/tools" },
  { label: "Jobs", to: "/jobs" },
  { label: "Settings", to: "/settings" },
  { label: "About", to: "/about" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme, setTheme } = useSettings();
  const { isDesktop } = useEngines();
  const isDarkTheme = resolvedTheme === "dark";

  function toggleTheme() {
    setTheme(isDarkTheme ? "light" : "dark");
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            PDF<span className="text-red-600">Powerhouse</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeClassName="text-foreground"
            >
              {item.label}
            </NavLink>
          ))}

          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300">
            {isDesktop ? <WifiOff className="mr-1 h-3.5 w-3.5" /> : <Globe className="mr-1 h-3.5 w-3.5" />}
            {isDesktop ? "Offline" : "Web preview"}
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button asChild size="sm" className="bg-red-600 text-white hover:bg-red-700">
            <Link to="/tools">Get Started</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-controls="mobile-navigation"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-navigation" className="border-t bg-card px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="text-sm font-medium text-muted-foreground"
                activeClassName="text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}

            <Badge className="w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300">
              {isDesktop ? <WifiOff className="mr-1 h-3.5 w-3.5" /> : <Globe className="mr-1 h-3.5 w-3.5" />}
              {isDesktop ? "Offline" : "Web preview"}
            </Badge>

            <Button asChild size="sm" className="w-full bg-red-600 text-white hover:bg-red-700">
              <Link to="/tools" onClick={() => setMobileOpen(false)}>
                Get Started
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
