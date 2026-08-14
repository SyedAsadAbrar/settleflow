export default function AuthLoading() {
  return (
    <div className="w-full animate-pulse space-y-5" aria-label="Loading" role="status">
      <div className="h-5 w-24 rounded bg-[#e6ece8]" />
      <div className="h-9 w-64 rounded bg-[#e6ece8]" />
      <div className="h-5 w-full rounded bg-[#e6ece8]" />
      <div className="h-10 rounded-lg bg-[#e6ece8]" />
      <div className="h-10 rounded-lg bg-[#e6ece8]" />
      <span className="sr-only">Loading sign-in page</span>
    </div>
  );
}
