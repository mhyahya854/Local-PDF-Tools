import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-10">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-foreground">About PDF Powerhouse</h1>
        <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
          PDF Powerhouse is designed for local-first document workflows. The goal is to route all
          conversion and editing operations through local engines in a desktop runtime.
        </p>

        <section className="mb-4 rounded-xl border bg-card p-5">
          <h2 className="mb-2 text-base font-semibold text-foreground">Offline Truths</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>PDF to Word/PowerPoint/Excel is best effort and may require manual cleanup.</li>
            <li>Request signatures from others is not an offline-native flow unless exported manually.</li>
            <li>HTML to PDF from URL is not offline unless the source is a local HTML file.</li>
          </ul>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-2 text-base font-semibold text-foreground">Build Priorities</h2>
          <p className="text-sm text-muted-foreground">
            The near-term roadmap focuses on reliable qpdf and LibreOffice-backed tools, then expands to OCR,
            overlay editing, and advanced best-effort conversions.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
