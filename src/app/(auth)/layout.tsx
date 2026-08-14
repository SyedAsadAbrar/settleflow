import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_1fr]">
      <section className="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-16">
        <Logo />
        <div className="mx-auto flex w-full max-w-[420px] flex-1 items-center py-12">{children}</div>
        <p className="text-xs text-[#819089]">Financial operations, without the ambiguity.</p>
      </section>
      <aside className="relative hidden overflow-hidden bg-[#123f31] p-14 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-32 -top-24 size-[440px] rounded-full border border-white/10" />
        <div className="absolute -right-12 top-16 size-[250px] rounded-full border border-white/10" />
        <div className="relative max-w-lg">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">Orders & settlements</p>
          <blockquote className="text-4xl font-medium leading-[1.18] tracking-[-0.035em]">
            One clear view of what is billed, paid, and still outstanding.
          </blockquote>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6 text-sm text-emerald-50/80">
            <span>Accurate totals</span><span>Partial payments</span><span>Audit-ready</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
