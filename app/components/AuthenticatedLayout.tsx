"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Desktop links */}
          <div className="hidden md:flex md:gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium ${
                  pathname === link.href || (link.href === "/profile" && pathname.startsWith("/profile"))
                    ? "text-foreground underline decoration-accent-clay underline-offset-4"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Hamburger button (mobile) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col justify-center gap-1 md:hidden"
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-5 bg-foreground transition-transform ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-foreground transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-foreground transition-transform ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </button>

          {/* Desktop sign out */}
          <button
            onClick={handleSignOut}
            className="hidden text-sm text-muted hover:text-foreground md:block"
          >
            Sign out
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="flex flex-col gap-3 pt-4 pb-2 md:hidden">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium ${
                  pathname === link.href || (link.href === "/profile" && pathname.startsWith("/profile"))
                    ? "text-foreground underline decoration-accent-clay underline-offset-4"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={handleSignOut}
              className="text-left text-sm text-muted hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        )}
      </nav>
      <main>{children}</main>
    </div>
  );
}
