import type { Metadata } from "next";
import { OrderForm } from "@/components/order-form";

export const metadata: Metadata = { title: "Create order" };

export default function NewOrderPage() {
  return <OrderForm />;
}
