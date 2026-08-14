"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f5f7f5", color: "#17251f" }}>
        <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: "24px" }}>
          <section style={{ maxWidth: "460px", border: "1px solid #dfe6e2", borderRadius: "12px", background: "white", padding: "24px", textAlign: "center" }}>
            <p style={{ color: "#176b4d", fontWeight: 600 }}>Something went wrong</p>
            <h1>SettleFlow could not load</h1>
            <p>Please try again. If the problem continues, return to the login page and start a new session.</p>
            <button type="button" onClick={reset}>Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
