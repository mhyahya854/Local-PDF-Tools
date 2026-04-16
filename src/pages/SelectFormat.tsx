import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowRight, FileText, icons } from "lucide-react";
import { getOutputFormats } from "@/lib/toolRegistry";

const SelectFormat = () => {
  const navigate = useNavigate();
  const formats = getOutputFormats();

  const handleSelect = (formatId: string) => {
    navigate(`/tools?output=${formatId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="flex-1 container mx-auto px-4 py-16 md:py-24 flex flex-col items-center">
        <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl text-center">
          What format do you need?
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-center mb-12">
          Choose the final output format, then browse tools that can produce it.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-5xl">
          {formats.map((fmt) => {
            const Icon = icons[fmt.icon as keyof typeof icons] ?? FileText;
            const disabled = fmt.availableCount === 0;

            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => handleSelect(fmt.id)}
                disabled={disabled}
                className={`group flex flex-col items-center gap-4 rounded-2xl border-2 border-border bg-card p-8 transition-all duration-200 ${
                  disabled
                    ? "cursor-not-allowed opacity-60"
                    : `cursor-pointer hover:scale-105 hover:shadow-xl ${fmt.hoverClass}`
                }`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-xl ${fmt.colorClass} text-white transition-transform duration-200 ${
                    disabled ? "" : "group-hover:scale-110"
                  }`}
                >
                  <Icon className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{fmt.label}</div>
                  <div className="text-sm text-muted-foreground">{fmt.description}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {fmt.availableCount}/{fmt.toolCount} available now
                  </div>
                  {disabled && (
                    <div className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      Coming soon
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => navigate("/tools")}
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center transition-all duration-200 hover:border-primary/50 hover:bg-muted/40"
          >
            <div className="rounded-full bg-muted p-3">
              <ArrowRight className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">All tools</div>
              <div className="text-sm text-muted-foreground">Browse every tool in the registry</div>
            </div>
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SelectFormat;
