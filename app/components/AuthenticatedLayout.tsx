"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import FeedbackButton from "./FeedbackButton";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Lightweight non-blocking fallback auth check (defense-in-depth).
  // Middleware handles the real protection; this catches edge cases
  // like an expired session after the page was already served.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
      }
    });
  }, [router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  const links = [
    { href: "/dashboard", label: "Welcome" },
    { href: "/profile", label: "My Profile" },
    { href: "/dashboard/log", label: "New Log" },
    { href: "/dashboard/overview", label: "Log Overview" },
    { href: "/dashboard/settings", label: "Settings" },
  ];

  const isActive = (href: string) =>
    pathname === href || (href === "/profile" && pathname.startsWith("/profile"));

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border bg-surface/85 px-6 py-4 backdrop-blur-[24px] md:px-10">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/dashboard" className="font-serif text-xl font-semibold text-foreground">
            Living with Endo
          </a>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? "bg-foreground/[0.06] text-foreground"
                    : "text-muted hover:bg-foreground/[0.04] hover:text-foreground"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop sign out */}
            <button
              onClick={handleSignOut}
              className="hidden rounded-full border border-border px-4 py-2 text-sm text-muted transition-all hover:border-foreground/20 hover:text-foreground md:block"
            >
              Sign out
            </button>

            {/* Hamburger button (mobile) */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-foreground/[0.04] md:hidden"
              aria-label="Toggle menu"
            >
              <div className="flex flex-col justify-center gap-[5px]">
                <span className={`block h-[1.5px] w-5 bg-foreground transition-all duration-300 ${menuOpen ? "translate-y-[6.5px] rotate-45" : ""}`} />
                <span className={`block h-[1.5px] w-5 bg-foreground transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-[1.5px] w-5 bg-foreground transition-all duration-300 ${menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 md:hidden">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-foreground/[0.06] text-foreground"
                    : "text-muted hover:bg-foreground/[0.04] hover:text-foreground"
                }`}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={handleSignOut}
              className="mt-2 rounded-xl px-4 py-3 text-left text-sm text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        )}
      </nav>
      <main>{children}</main>
      <FeedbackButton />
    </div>
  );
}
