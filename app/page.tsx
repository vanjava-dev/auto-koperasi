import { redirect } from "next/navigation";

/**
 * Root page — redirect ke dashboard utama.
 * Pada Tahap 2 ini masih menggunakan placeholder hingga dashboard selesai dibangun.
 */
export default function RootPage() {
  redirect("/dashboard");
}
