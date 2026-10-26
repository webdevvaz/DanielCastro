/** A heading and content placeholder in the shape of a page section, while its data loads. */
export function SectionSkeleton({ blocks = 3 }: { blocks?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton" style={{ width: 120, height: 12 }} />
      <div className="skeleton" style={{ width: "min(520px, 80%)", height: 52, marginTop: 20 }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginTop: 40,
        }}
      >
        {Array.from({ length: blocks }, (_, index) => (
          <div className="skeleton" key={index} style={{ height: 300 }} />
        ))}
      </div>
    </div>
  );
}

/** A public page while its data loads: the page frame around a section placeholder. */
export function PagePending() {
  return (
    <main className="page">
      <div className="wrap">
        <SectionSkeleton />
      </div>
    </main>
  );
}
