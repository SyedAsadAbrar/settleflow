import Link from "next/link";

export function Logo() {
  return (
    <Link href="/dashboard" className="inline-flex items-center gap-2.5 text-lg font-bold tracking-[-0.02em] text-[#17251f]">
      <span className="grid size-8 place-items-center rounded-lg bg-[#176b4d] text-sm text-white">S</span>
      SettleFlow
    </Link>
  );
}
