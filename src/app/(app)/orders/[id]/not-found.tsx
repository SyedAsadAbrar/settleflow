import Link from "next/link";

export default function OrderNotFound() {
  return <div className="card mx-auto max-w-lg px-6 py-16 text-center"><p className="text-sm font-semibold text-[#176b4d]">404</p><h1 className="mt-2 text-2xl font-bold">Order not found</h1><p className="mt-3 text-sm leading-6 text-[#66756e]">This order does not exist or does not belong to your account.</p><Link href="/dashboard" className="btn-primary mt-6">Back to orders</Link></div>;
}
