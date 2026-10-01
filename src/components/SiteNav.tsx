"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/plan/", label: "Plan" },
  { href: "/docs/", label: "How it works" },
];

export function SiteNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="nav-link"
          aria-current={pathname.startsWith(link.href.slice(0, -1)) ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
