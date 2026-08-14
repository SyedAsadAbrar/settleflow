"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="relative">
      <button
        type="button"
        disabled={busy}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#66756e] hover:text-[#17251f] disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/auth/logout", { method: "POST" });
            if (!response.ok) throw new Error("Logout failed.");
            router.push("/login");
            router.refresh();
          } catch {
            setError("Could not log out. Please try again.");
            setBusy(false);
          }
        }}
      >
        <LogOut className="size-4" />
        <span className="hidden sm:inline">Log out</span>
      </button>
      {error ? <p role="alert" className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-rose-100 bg-white px-3 py-2 text-xs text-rose-700 shadow-sm">{error}</p> : null}
    </div>
  );
}
