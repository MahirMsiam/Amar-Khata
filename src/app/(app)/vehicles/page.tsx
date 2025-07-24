import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function VehiclesServerWrapper() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    await adminAuth.verifyIdToken(token!);
    // If valid, render the client page
    const VehiclesPage = (await import("./page.client")).default;
    return <VehiclesPage />;
  } catch {
    redirect("/login");
  }
}