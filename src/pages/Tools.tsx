import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolCard from "@/components/ToolCard";
import {
  filterTools,
  getOutputFormats,
  getToolsByOutput,
  getToolStatusLabel,
  toolRegistry,
} from "@/lib/toolRegistry";
import type { ToolStatus } from "@/types/tools";

const statusOptions: Array<ToolStatus | "all"> = ["all", "ready", "beta", "planned"];

const Tools = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<ToolStatus | "all">("all");

  const output = searchParams.get("output");
  const outputFormats = getOutputFormats();

  const filtered = useMemo(() => {
    const outputTools = getToolsByOutput(output ?? undefined);
    return filterTools(outputTools, {
      search,
      category,
      status,
    });
  }, [output, search, category, status]);

  const categories = useMemo(
    () => ["all", ...new Set(toolRegistry.map((tool) => tool.category))],
    [],
  );

  const outputLabel = outputFormats.find((fmt) => fmt.id === output)?.label;
  const heading = outputLabel ? `Tools that output ${outputLabel}` : "All PDF Tools";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="container mx-auto px-4 py-12">
        <h1 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          {heading}
        </h1>
        <p className="mb-8 text-center text-muted-foreground">
          {filtered.length} tool{filtered.length !== 1 ? "s" : ""} available
        </p>

        <div className="mb-8 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tools"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          />

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All categories" : item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ToolStatus | "all")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All statuses" : getToolStatusLabel(item)}
              </option>
            ))}
          </select>
        </div>

        {output && (
          <p className="mb-6 text-xs text-muted-foreground">
            Filtering by output extension <span className="font-medium text-foreground">.{output}</span>. Use All tools to clear.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-6 rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            No tools matched the current filters.
          </div>
        )}
      </section>

      <div className="flex-1" />
      <Footer />
    </div>
  );
};

export default Tools;
