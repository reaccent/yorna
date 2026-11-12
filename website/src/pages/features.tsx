import {
  CalendarDays,
  FileText,
  FolderSync,
  HardDrive,
  ImageIcon,
  KanbanSquare,
  Settings2,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { CheckList, Eyebrow, IconTile, Screenshot, type Shot } from "../components/ui";
import { PROVIDERS, SHOTS, SYNC_DOC_URL } from "../content";
import { FinalCta } from "./home";

interface Feature {
  id: string;
  icon: LucideIcon;
  color: string;
  title: string;
  lead: string;
  points: ReactNode[];
  shot?: Shot;
}

const FEATURES: Feature[] = [
  {
    id: "calendar",
    icon: CalendarDays,
    color: "bg-sky",
    title: "Calendar & reminders",
    lead: "A real month grid for the things that keep a channel on schedule: upload days, filming, sponsor deadlines.",
    points: [
      "Monday-first month view with small colored dots per reminder; hover a day to list them",
      "New reminder bar: date, one of six colors, optional time, repeat and title",
      "Repeat once, daily, weekly on that weekday, or monthly on that day (clamped to short months)",
      "Click any reminder to edit it; checking off a repeating reminder completes just that day",
      "Timed reminders play a sound inside Yorna when they're due",
      "Side panel: % of the month left to work, plus worked and not-worked days",
    ],
    shot: SHOTS.calendar,
  },
  {
    id: "notes",
    icon: KanbanSquare,
    color: "bg-amber",
    title: "Notes board",
    lead: "Scripts live on a Kanban board — organized like a notes app, moved like a pipeline.",
    points: [
      "Three columns: To do, In progress, Done",
      "Drag and drop between columns, or move from a card's menu",
      "Quick add in every column, search across scripts, delete with confirmation",
      "Each card shows an excerpt, last edit and word count",
    ],
    shot: SHOTS.board,
  },
  {
    id: "editor",
    icon: FileText,
    color: "bg-coral",
    title: "Script editor",
    lead: "Every card opens into a focused document with the formatting a script actually needs.",
    points: [
      "Three heading levels, bold, italic, underline, strikethrough and highlight",
      "Bulleted, numbered and check lists, quotes, dividers, links and inline code",
      "Status picker, created date, word count and estimated read-aloud time",
      "Saves to your vault as you type",
    ],
    shot: SHOTS.editor,
  },
  {
    id: "images",
    icon: ImageIcon,
    color: "bg-rose",
    title: "Image references",
    lead: "Point to a thumbnail draft or B-roll still without stuffing it into your notes.",
    points: [
      "The image button links a local file (with a native file picker) or a URL",
      "Only the reference is stored, so scripts stay small and portable",
      "Pasting or dropping image files into a script is blocked on purpose",
    ],
  },
  {
    id: "sessions",
    icon: Timer,
    color: "bg-mint",
    title: "Sessions",
    lead: "The habit loop: commit to a length, write until the star fills, and the day counts.",
    points: [
      "Opening a script asks how long you'll work — 30 minutes by default; 15, 60 or Custom",
      "The star ring fills as you go; the top-right star shows minutes left",
      "Pause, resume or end early from the star",
      "A day counts as worked only when a session finishes",
      "Finishing plays the goal sound — in the app, not as a system notification",
    ],
    shot: SHOTS.sessionDialog,
  },
  {
    id: "profiles",
    icon: Users,
    color: "bg-sky",
    title: "Profiles",
    lead: "Separate desks for separate writers or channels on the same computer.",
    points: [
      "Each profile has its own scripts, reminders, sessions, settings and goal sound",
      "With one profile Yorna opens straight to the calendar",
      "With two or more, launch asks “Who's writing?” — switch any time from the avatar",
    ],
    shot: SHOTS.profiles,
  },
  {
    id: "sync",
    icon: FolderSync,
    color: "bg-mint",
    title: "Folder sync",
    lead: "Sync the way Obsidian does: put the vault in a folder your cloud app already syncs.",
    points: [
      <>Works with {PROVIDERS.join(", ").replace(/, ([^,]*)$/, " and $1")} through their desktop apps</>,
      "Settings → Vault → Change folder… moves your vault or opens one that's already there",
      "Changes from your other computer appear on their own; overlapping saves merge and finished sessions are never lost",
      "Conflict copies made by your sync app are listed so you can tidy up",
      <>
        Step-by-step setup in the{" "}
        <a href={SYNC_DOC_URL} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
          sync guide
        </a>
      </>,
    ],
  },
  {
    id: "vault",
    icon: HardDrive,
    color: "bg-amber",
    title: "Local-first vault",
    lead: "No account, no server. Your work is a folder of plain files.",
    points: [
      "One HTML file per script, one JSON file for board, reminders, sessions and settings",
      "Each save goes to a temp file first, so an interrupted save doesn't leave a half-written script",
      "Settings → Vault → Show opens the folder; Use default moves you back",
      "Vaults from older versions open unchanged",
    ],
  },
  {
    id: "settings",
    icon: Settings2,
    color: "bg-coral",
    title: "Settings",
    lead: "Everything in one screen, nothing buried.",
    points: [
      "Profiles, default session length and goal-sound volume",
      "Upload, preview or reset a custom goal sound",
      "Vault folder, sync status and conflict copies",
      "App version and a link to the source on GitHub",
    ],
  },
];

const NOT_YET = [
  "A mobile app — Yorna is built for writing at a desk",
  "Signing in to Google Drive inside Yorna — sync runs through the provider's desktop app instead",
  "Signed installers and auto-update",
  "Full Linux polish — it runs, but macOS and Windows come first",
];

function FeatureBlock({ f, index }: { f: Feature; index: number }) {
  const Icon = f.icon;
  const flip = index % 2 === 1;
  return (
    <section id={f.id} className="border-ink scroll-mt-24 border-t-2 py-16 sm:py-20">
      <div
        className={`container-page grid gap-10 ${f.shot ? "lg:grid-cols-[1fr_1.25fr] lg:items-center" : "lg:grid-cols-[1fr_1.25fr]"}`}
      >
        <div className={flip && f.shot ? "lg:order-2" : ""}>
          <IconTile icon={<Icon className="size-5" />} color={f.color} />
          <h2 className="font-display-tight mt-5 text-[clamp(1.9rem,3.6vw,2.75rem)] leading-[1.05] font-bold">
            {f.title}
          </h2>
          <p className="text-ink-soft mt-3 text-[17px] leading-7">{f.lead}</p>
          <div className={`mt-6 ${f.shot ? "" : "lg:hidden"}`}>
            <CheckList items={f.points} />
          </div>
        </div>
        {f.shot ? (
          <Screenshot {...f.shot} className={flip ? "lg:order-1" : ""} />
        ) : (
          <div className="border-ink bg-paper hidden rounded-2xl border-2 p-8 lg:block">
            <CheckList items={f.points} />
          </div>
        )}
      </div>
    </section>
  );
}

export function Features() {
  return (
    <>
      <section className="bg-paper pt-14 pb-14 sm:pt-20">
        <div className="container-page">
          <Eyebrow className="text-ink-soft">Features</Eyebrow>
          <h1 className="font-display-tight mt-3 max-w-4xl text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.96] font-extrabold">
            Everything Yorna does, on one page.
          </h1>
          <p className="text-ink-soft mt-6 max-w-2xl text-lg leading-8">
            A calendar to plan, a board to organize, an editor to write and sessions to finish — in a desktop app that
            keeps your work in plain files.
          </p>
          <nav className="mt-10 flex flex-wrap gap-2" aria-label="Feature sections">
            {FEATURES.map((f) => (
              <a
                key={f.id}
                href={`#${f.id}`}
                className="border-ink hover:bg-ink hover:text-cream rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors"
              >
                {f.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {FEATURES.map((f, i) => (
        <FeatureBlock key={f.id} f={f} index={i} />
      ))}

      <section className="on-ink bg-ink text-cream py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.25fr]">
          <div>
            <Eyebrow className="text-amber">Honest roadmap</Eyebrow>
            <h2 className="font-display-tight mt-3 text-[clamp(1.9rem,3.6vw,2.75rem)] leading-[1.05] font-bold">
              Not in Yorna yet.
            </h2>
            <p className="text-cream-soft mt-3 text-[17px] leading-7">
              Yorna is an early version. Here's what it deliberately doesn't do today.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {NOT_YET.map((n) => (
              <li key={n} className="bg-ink-2 rounded-xl p-5 text-[15px] leading-6">
                {n}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
