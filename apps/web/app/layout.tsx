import type { ReactNode } from "react";

export const metadata = {
  title: "AI Baby Local Dev",
  description: "Local development surface for the AI Baby MVP backend and shell.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "ui-sans-serif, system-ui, sans-serif", background: "#f8fafc", color: "#0f172a" }}>
        {children}
      </body>
    </html>
  );
}
