"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
      <img src="/logo.svg" alt="Amar Khata Logo" className="h-24 w-24" />
      <span className="text-3xl font-bold text-primary">আমার খাতা</span>
    </div>
  );
}
//PUSH