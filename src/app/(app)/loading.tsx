export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading" role="status">
      <div className="h-9 w-40 rounded bg-[#e6ece8]" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-xl bg-[#e6ece8]" />
        <div className="h-28 rounded-xl bg-[#e6ece8]" />
        <div className="h-28 rounded-xl bg-[#e6ece8]" />
      </div>
      <div className="h-80 rounded-xl bg-[#e6ece8]" />
      <span className="sr-only">Loading your orders</span>
    </div>
  );
}
