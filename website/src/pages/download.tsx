import { Apple, ArrowUpRight, Globe, Monitor, Terminal } from "lucide-react";
import type { ReactNode } from "react";
import { GitHubIcon } from "../components/brand";
import { ButtonLink, CodeBlock, Eyebrow } from "../components/ui";
import { CLONE_COMMAND, GITHUB_URL, ISSUES_URL, SYNC_DOC_URL } from "../content";

const TAURI_PREREQS = "https://tauri.app/start/prerequisites/";

const PLATFORMS = [
  {
    icon: <Apple className="size-5" />,
    name: "macOS",
    status: "First-class",
    tone: "bg-mint",
    needs: "Xcode Command Line Tools",
    bundle: ".dmg / .app",
  },
  {
    icon: <Monitor className="size-5" />,
    name: "Windows",
    status: "First-class",
    tone: "bg-mint",
    needs: "WebView2 and the MSVC build tools",
    bundle: ".msi / .exe",
  },
  {
    icon: <Terminal className="size-5" />,
    name: "Linux",
    status: "Works, less polished",
    tone: "bg-amber",
    needs: "libwebkit2gtk-4.1-dev and related packages",
    bundle: ".AppImage / .deb",
  },
];

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="border-ink grid gap-5 border-t-2 py-10 md:grid-cols-[220px_1fr] md:gap-10">
      <div>
        <span className="font-display-tight text-amber-deep text-6xl leading-none font-extrabold">{n}</span>
        <h3 className="font-display-tight mt-3 text-2xl font-bold">{title}</h3>
      </div>
      <div className="text-ink-soft min-w-0 space-y-4 text-[15px] leading-7">{children}</div>
    </li>
  );
}

const VAULT_PATHS = [
  { os: "macOS", path: "~/Library/Application Support/app.yorna.desktop/vault" },
  { os: "Windows", path: "%APPDATA%\\app.yorna.desktop\\vault" },
  { os: "Linux", path: "~/.local/share/app.yorna.desktop/vault" },
];

export function Download() {
  return (
    <>
      <section className="border-ink bg-amber border-b-2 pt-14 pb-16 sm:pt-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <Eyebrow>Get started</Eyebrow>
            <h1 className="font-display-tight mt-3 text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.94] font-extrabold">
              Clone it. Run it. Start writing.
            </h1>
          </div>
          <div>
            <p className="text-ink/80 text-[17px] leading-7">
              Yorna is an early version, so there are no ready-made installers yet. You build it from the source on
              GitHub — clone, install, run. It takes a few minutes the first time.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to={GITHUB_URL}>
                <GitHubIcon className="size-4" /> Open the repository
              </ButtonLink>
              <ButtonLink to="#steps" variant="outline">
                Read the steps
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper py-14">
        <div className="container-page grid gap-4 md:grid-cols-3">
          {PLATFORMS.map((p) => (
            <div key={p.name} className="border-ink rounded-2xl border-2 p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2.5 text-lg font-semibold">
                  {p.icon} {p.name}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.tone}`}>{p.status}</span>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="text-ink-soft">System packages</dt>
                  <dd className="font-medium">{p.needs}</dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Builds</dt>
                  <dd className="font-mono font-medium">{p.bundle}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section id="steps" className="bg-paper scroll-mt-20 pb-10">
        <div className="container-page">
          <ol>
            <Step n={1} title="Install the tools">
              <p>
                You need <strong className="text-ink">Node.js 20+</strong> and, for the desktop app,{" "}
                <strong className="text-ink">Rust stable (1.85+)</strong> plus the Tauri system packages for your OS
                listed above.
              </p>
              <CodeBlock
                label="check versions"
                code={"node --version   # v20 or newer\nrustc --version  # 1.85 or newer"}
              />
              <p>
                Missing something? Follow the{" "}
                <a
                  href={TAURI_PREREQS}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink font-semibold underline underline-offset-4"
                >
                  Tauri prerequisites guide
                </a>{" "}
                for your system.
              </p>
            </Step>
            <Step n={2} title="Clone and install">
              <CodeBlock code={`${CLONE_COMMAND}\ncd yorna\nnpm install`} />
            </Step>
            <Step n={3} title="Run the desktop app">
              <CodeBlock code="npm run desktop" />
              <p>
                A Yorna window opens. Your first profile and a sample script are created in the vault folder for your OS
                — <strong className="text-ink">Settings → Vault → Show</strong> opens it.
              </p>
            </Step>
            <Step n={4} title="Build an installer (optional)">
              <CodeBlock code="npm run desktop:build" />
              <p>
                Produces a native bundle for the OS you build on (for example a{" "}
                <code className="text-ink font-mono">.dmg</code> on macOS or an{" "}
                <code className="text-ink font-mono">.msi</code> on Windows) that you can install like any other app.
                Builds aren't code-signed yet, so your OS may ask you to confirm the first launch.
              </p>
            </Step>
          </ol>
        </div>
      </section>

      <section className="border-ink bg-paper-2 border-t-2 py-16 sm:py-20">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <div className="border-ink bg-paper rounded-2xl border-2 p-7">
            <span className="bg-sky inline-flex size-11 items-center justify-center rounded-xl">
              <Globe className="size-5" />
            </span>
            <h2 className="font-display-tight mt-5 text-2xl font-bold">Just want to look around?</h2>
            <p className="text-ink-soft mt-2 text-[15px] leading-7">
              Skip Rust entirely and run the interface in your browser. Data is kept in the browser's storage instead of
              a folder, and local image previews only work in the desktop app.
            </p>
            <div className="mt-5">
              <CodeBlock code={"npm install\nnpm run web   # http://127.0.0.1:43127"} />
            </div>
          </div>
          <div className="border-ink bg-paper rounded-2xl border-2 p-7">
            <h2 className="font-display-tight text-2xl font-bold">Where your work lives</h2>
            <p className="text-ink-soft mt-2 text-[15px] leading-7">
              By default the vault sits in your user folder. Move it anywhere — including Google Drive, Dropbox, iCloud
              Drive or OneDrive — from <strong className="text-ink">Settings → Vault → Change folder…</strong>
            </p>
            <dl className="divide-line border-line mt-5 divide-y border-y">
              {VAULT_PATHS.map((v) => (
                <div key={v.os} className="grid gap-1 py-3 sm:grid-cols-[90px_1fr] sm:gap-4">
                  <dt className="text-sm font-semibold">{v.os}</dt>
                  <dd className="text-ink-soft font-mono text-[13px] break-all">{v.path}</dd>
                </div>
              ))}
            </dl>
            <a
              href={SYNC_DOC_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold underline underline-offset-4"
            >
              Set up sync between computers <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="on-ink bg-ink text-cream py-16 sm:py-20">
        <div className="container-page flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <h2 className="font-display-tight text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.02] font-bold">
              Yorna is built in the open.
            </h2>
            <p className="text-cream-soft mt-3 text-[17px] leading-7">
              Read the code, follow along as it grows, and tell us what's missing from your writing routine.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to={GITHUB_URL} variant="amber">
              <GitHubIcon className="size-4" /> Star on GitHub
            </ButtonLink>
            <ButtonLink to={ISSUES_URL} variant="outline-cream">
              Report an issue
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
