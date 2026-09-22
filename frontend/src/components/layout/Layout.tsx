import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuthStore } from "@/store/auth";
import { useFavoritesStore } from "@/store/favorites";

export function Layout() {
  const userId = useAuthStore((s) => s.user?.id);
  const load = useFavoritesStore((s) => s.load);
  const reset = useFavoritesStore((s) => s.reset);

  useEffect(() => {
    if (userId) {
      load();
    } else {
      reset();
    }
  }, [userId, load, reset]);

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
