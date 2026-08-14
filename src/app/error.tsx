"use client";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="card max-w-md p-6 text-center">
        <p className="text-sm font-semibold text-[#176b4d]">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-bold">We couldn&apos;t load this page</h1>
        <p className="mt-3 text-sm leading-6 text-[#66756e]">Please try again. If the problem continues, return to the login page and start a new session.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" className="btn-primary" onClick={reset}>Try again</button>
          <a className="btn-secondary" href="/login">Log in</a>
        </div>
      </section>
    </main>
  );
}
