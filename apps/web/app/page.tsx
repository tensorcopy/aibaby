const routes = [
  { method: "GET", path: "/api/babies", note: "Load the current owner-scoped baby profile" },
  { method: "POST", path: "/api/babies", note: "Create a baby profile" },
  { method: "PATCH", path: "/api/babies/:babyId", note: "Update a baby profile" },
  { method: "POST", path: "/api/uploads/presign", note: "Negotiate upload targets for meal photos" },
  { method: "POST", path: "/api/uploads/complete", note: "Mark uploaded assets as complete" },
  { method: "POST", path: "/api/messages/text-parse", note: "Parse a text meal note into a structured preview" },
  { method: "POST", path: "/api/meal-records/drafts", note: "Persist a generated draft meal record" },
  { method: "POST", path: "/api/meal-records/:mealRecordId/confirm", note: "Confirm or correct a generated draft" },
];

export default function HomePage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <section style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0369a1" }}>
            Local Dev Surface
          </p>
          <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.1 }}>AI Baby backend and mobile handoff are runnable locally.</h1>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#334155" }}>
            Start this app with <code>npm run dev:web</code>, then point Expo at the local API using <code>EXPO_PUBLIC_AIBABY_API_BASE_URL</code>.
          </p>
        </div>

        <div style={{ borderRadius: 20, border: "1px solid #cbd5e1", background: "#ffffff", padding: 20, display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Quick start</h2>
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8, lineHeight: 1.6 }}>
            <li>Run <code>npm install</code> from the repository root.</li>
            <li>Start the backend with <code>npm run dev:web</code>.</li>
            <li>Set <code>EXPO_PUBLIC_AIBABY_API_BASE_URL=http://&lt;your-lan-ip&gt;:3000</code> in <code>.env.local</code>.</li>
            <li>Set <code>EXPO_PUBLIC_AIBABY_OWNER_USER_ID</code> to a local dev user id.</li>
            <li>Start Expo with <code>npm run dev:mobile</code> and open the app in a simulator or Expo Go.</li>
          </ol>
        </div>

        <div style={{ borderRadius: 20, border: "1px solid #cbd5e1", background: "#ffffff", padding: 20, display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Available local API routes</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {routes.map((route) => (
              <div key={`${route.method}-${route.path}`} style={{ display: "grid", gap: 2, padding: 12, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", background: "#dbeafe", borderRadius: 999, padding: "4px 8px" }}>{route.method}</span>
                  <code style={{ fontSize: 14 }}>{route.path}</code>
                </div>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>{route.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
