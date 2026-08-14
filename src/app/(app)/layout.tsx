import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUserId } from "@/lib/auth/session";
import { getUserById } from "@/modules/users/service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const user = await getUserById(userId);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[#dfe6e2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-5">
            <span className="hidden text-sm text-[#66756e] md:inline">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main>
    </div>
  );
}
