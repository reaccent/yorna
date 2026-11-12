import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { GITHUB_URL, ISSUES_URL, SYNC_DOC_URL } from "../content";
import { GitHubIcon, YornaMark } from "./brand";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/download", label: "Get started" },
];

function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-[15px] font-medium transition-colors ${
      isActive ? "bg-ink text-cream" : "text-ink hover:bg-ink/10"
    }`;

  return (
    <header className="border-ink bg-amber sticky top-0 z-40 border-b-2">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Yorna home">
          <YornaMark className="[&_rect]:fill-ink [&_path]:stroke-amber size-8" />
          <span className="font-display-tight text-[26px] leading-none font-bold">Yorna</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end className={linkCls}>
              {n.label}
            </NavLink>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="border-ink hover:bg-ink hover:text-cream ml-2 inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-[15px] font-semibold transition-colors"
          >
            <GitHubIcon className="size-4" /> GitHub
          </a>
        </nav>
        <button
          type="button"
          className="border-ink inline-flex size-10 items-center justify-center rounded-full border-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav className="container-page flex flex-col gap-1 pb-4 md:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end className={linkCls}>
              {n.label}
            </NavLink>
          ))}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={linkCls({ isActive: false })}>
            GitHub
          </a>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const cols = [
    {
      title: "Product",
      links: [
        { label: "Features", to: "/features" },
        { label: "Get started", to: "/download" },
        { label: "Sync guide", to: SYNC_DOC_URL },
      ],
    },
    {
      title: "Project",
      links: [
        { label: "Source on GitHub", to: GITHUB_URL },
        { label: "Report an issue", to: ISSUES_URL },
      ],
    },
  ];
  return (
    <footer className="on-ink bg-ink text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <YornaMark className="size-9" />
            <span className="font-display-tight text-3xl font-bold">Yorna</span>
          </Link>
          <p className="text-cream-soft mt-4 max-w-xs text-[15px] leading-6">
            The writing desk for YouTube scripts. Local-first, on macOS and Windows.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-cream-soft text-sm font-semibold">{c.title}</p>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  {/^https?:/.test(l.to) ? (
                    <a href={l.to} target="_blank" rel="noreferrer" className="hover:text-amber text-[15px]">
                      {l.label}
                    </a>
                  ) : (
                    <Link to={l.to} className="hover:text-amber text-[15px]">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-ink-line border-t">
        <div className="container-page text-cream-soft flex flex-col justify-between gap-2 py-6 text-sm sm:flex-row">
          <span>© {new Date().getFullYear()} Yorna</span>
          <span>No accounts. No servers. Your vault is yours.</span>
        </div>
      </div>
    </footer>
  );
}

export function Layout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="focus:bg-ink focus:text-cream sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
