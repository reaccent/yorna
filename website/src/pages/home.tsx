import {
  ArrowRight,
  CalendarDays,
  FolderSync,
  HardDrive,
  KanbanSquare,
  Music2,
  PenLine,
  Timer,
  Users,
} from "lucide-react";
import { GitHubIcon, ReminderDots, StarGlyph } from "../components/brand";
import { ButtonLink, CheckList, Eyebrow, IconTile, Screenshot } from "../components/ui";
import { GITHUB_URL, PROVIDERS, SHOTS, VAULT_TREE } from "../content";

function Hero() {
  return (
    <section className="bg-amber relative">
      <div className="container-page pt-10 sm:pt-14">
        <div className="flex flex-wrap items-center gap-3">
          <ReminderDots onAmber />
          <span className="text-sm font-semibold">Desktop app for YouTube creators · macOS &amp; Windows</span>
        </div>

        <h1 className="mt-4 flex items-start">
          <span className="font-display-tight text-[clamp(6.5rem,24vw,19rem)] leading-[0.82] font-extrabold">
            Yorna
          </span>
          <StarGlyph className="text-ink mt-[2vw] ml-2 size-[clamp(2.5rem,7vw,5.5rem)] shrink-0" />
          <span className="sr-only"> — the writing desk for YouTube scripts</span>
        </h1>

        <div className="mt-8 grid gap-8 pb-14 md:grid-cols-[1.1fr_1fr] md:items-end md:gap-14 lg:pb-16">
          <p className="font-display-tight text-[clamp(1.9rem,4.2vw,3.25rem)] leading-[1.02] font-bold">
            The writing desk for YouTube scripts.
          </p>
          <div>
            <p className="text-ink/80 text-[17px] leading-7">
              Plan uploads on a reminder calendar, move scripts from idea to done on a Kanban board, and write in timed
              sessions. Everything is saved as plain files on your computer.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to="/download">
                Get started <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink to={GITHUB_URL} variant="outline">
                <GitHubIcon className="size-4" /> View on GitHub
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="bg-paper absolute inset-x-0 top-1/2 bottom-0" aria-hidden="true" />
        <div className="container-page relative">
          <Screenshot {...SHOTS.calendar} eager />
        </div>
      </div>
    </section>
  );
}

const FACTS = [
  { value: "3", label: "places: Calendar, Notes, Settings" },
  { value: "30 min", label: "default session — or 15, 60, custom" },
  { value: "0", label: "accounts, servers or tracking" },
  { value: "100%", label: "plain files in a folder you own" },
];

function Facts() {
  return (
    <section className="bg-paper">
      <div className="container-page grid grid-cols-2 gap-px overflow-hidden py-12 md:grid-cols-4">
        {FACTS.map((f) => (
          <div key={f.label} className="border-ink border-l-2 py-2 pr-4 pl-5">
            <p className="font-display-tight text-4xl font-bold">{f.value}</p>
            <p className="text-ink-soft mt-1 text-sm leading-5">{f.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: <CalendarDays className="size-5" />,
    color: "bg-sky",
    title: "Plan",
    body: "Put upload days, sponsor deadlines and filming slots on a month calendar. Color-code them, give them a time, repeat them weekly.",
  },
  {
    icon: <KanbanSquare className="size-5" />,
    color: "bg-amber",
    title: "Write",
    body: "Every video is a card on a To do → In progress → Done board. Open it and you're in a clean script editor.",
  },
  {
    icon: <Timer className="size-5" />,
    color: "bg-mint",
    title: "Finish",
    body: "Each time you open a script, pick how long you'll work. Finish the session and today counts on your calendar.",
  },
];

function Steps() {
  return (
    <section className="bg-paper pb-20 sm:pb-28">
      <div className="container-page">
        <div className="max-w-2xl">
          <Eyebrow className="text-ink-soft">How it works</Eyebrow>
          <h2 className="font-display-tight mt-3 text-[clamp(2.2rem,5vw,3.75rem)] leading-[1.02] font-bold">
            Built around how a video actually gets made.
          </h2>
        </div>
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-ink bg-paper rounded-2xl border-2 p-6">
              <div className="flex items-center justify-between">
                <IconTile icon={s.icon} color={s.color} />
                <span className="text-ink-soft font-mono text-sm">0{i + 1}</span>
              </div>
              <h3 className="font-display-tight mt-6 text-3xl font-bold">{s.title}</h3>
              <p className="text-ink-soft mt-2 text-[15px] leading-6">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function BoardSection() {
  return (
    <section className="border-ink bg-paper-2 border-t-2 py-20 sm:py-28">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1fr_1.35fr]">
        <div>
          <Eyebrow className="text-ink-soft">Notes</Eyebrow>
          <h2 className="font-display-tight mt-3 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.04] font-bold">
            Your whole channel on one board.
          </h2>
          <p className="text-ink-soft mt-5 text-[17px] leading-7">
            Ideas, drafts and finished scripts sit in three columns. Drag a card when it moves forward, search
            everything, and open any card into a proper document — not a sticky note.
          </p>
          <div className="mt-7">
            <CheckList
              items={[
                "Drag and drop between To do, In progress and Done",
                "Headings, lists, checklists, quotes, highlight, links and code",
                "Word count and read-aloud time on every script",
                "Link reference images by file path or URL — no pasted thumbnails bloating your notes",
              ]}
            />
          </div>
        </div>
        <Screenshot {...SHOTS.board} />
      </div>
    </section>
  );
}

function SessionSection() {
  return (
    <section className="on-ink bg-ink text-cream py-20 sm:py-28">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Eyebrow className="text-amber">Sessions</Eyebrow>
            <h2 className="font-display-tight mt-3 text-[clamp(2.4rem,5.6vw,4.5rem)] leading-[0.98] font-bold">
              A day counts
              <br />
              when you <span className="text-amber">finish</span>.
            </h2>
          </div>
          <p className="text-cream-soft text-[17px] leading-7">
            Open a script and Yorna asks how long you'll work — 30 minutes by default, or 15, 60 or custom. A star ring
            fills as you write and the top bar counts down. When time's up, a goal sound plays and the day is marked
            worked. Stop early and it isn't. That's the whole trick.
          </p>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <Screenshot {...SHOTS.editor} className="border-ink-line" />
          <div className="flex flex-col gap-5">
            <Screenshot {...SHOTS.sessionDialog} className="border-ink-line" />
            <div className="bg-amber text-ink flex items-start gap-4 rounded-2xl p-6">
              <Music2 className="mt-0.5 size-6 shrink-0" />
              <p className="text-[15px] leading-6 font-medium">
                Sounds play inside Yorna, never as system notifications. Upload your own goal sound and set the volume
                in Settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CalendarSection() {
  return (
    <section className="bg-paper py-20 sm:py-28">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1.35fr_1fr]">
        <Screenshot {...SHOTS.calendarHover} className="order-2 lg:order-1" />
        <div className="order-1 lg:order-2">
          <Eyebrow className="text-ink-soft">Calendar</Eyebrow>
          <h2 className="font-display-tight mt-3 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.04] font-bold">
            See what's left of the month, not just what's on it.
          </h2>
          <p className="text-ink-soft mt-5 text-[17px] leading-7">
            Reminders show up as small colored dots. Hover a day to see them. The side panel tells you how much of the
            month is still yours to work, next to worked and not-worked days.
          </p>
          <div className="mt-7">
            <CheckList
              items={[
                "Six reminder colors and optional times — timed reminders chime when due",
                "Repeat once, daily, weekly or monthly; check off a single occurrence",
                "Monday-first month grid with an Upcoming list",
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function VaultSection() {
  return (
    <section className="border-ink bg-mint border-y-2 py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <Eyebrow>Local-first</Eyebrow>
          <h2 className="font-display-tight mt-3 text-[clamp(2rem,4.6vw,3.5rem)] leading-[1.02] font-bold">
            Your scripts are files, not rows in someone else's database.
          </h2>
          <p className="text-ink/80 mt-5 text-[17px] leading-7">
            Yorna keeps everything in a vault folder on your computer: one HTML file per script and a JSON file for your
            board, reminders and sessions. Open it in Finder or Explorer any time. Back it up however you like.
          </p>
          <div className="border-ink bg-paper mt-8 rounded-2xl border-2 p-6">
            <div className="flex items-center gap-3">
              <FolderSync className="size-5" />
              <p className="font-semibold">Sync through the folder you already use</p>
            </div>
            <p className="text-ink-soft mt-2 text-[15px] leading-6">
              Move the vault into a synced folder and open it on your other computer. Yorna picks up changes, merges
              overlapping saves without losing finished sessions, and lists conflict copies. It never asks for your
              password.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <li key={p} className="bg-ink text-cream rounded-full px-3 py-1 text-sm font-medium">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="on-ink border-ink bg-ink text-cream overflow-hidden rounded-2xl border-2">
          <div className="border-ink-line flex items-center gap-2 border-b px-5 py-3">
            <HardDrive className="text-amber size-4" />
            <span className="text-cream-soft font-mono text-sm">My Drive/Yorna</span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7 sm:text-sm">
            <code>{VAULT_TREE}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

const EXTRAS = [
  {
    icon: <Users className="size-5" />,
    color: "bg-rose",
    title: "Profiles",
    body: "Share a computer or run a second channel. Each profile gets its own scripts, reminders, sessions and settings. One profile? Yorna skips the picker.",
  },
  {
    icon: <PenLine className="size-5" />,
    color: "bg-sky",
    title: "Quick capture",
    body: "Type a title on the calendar and press Enter to start a new note. Jump back to the last script you edited in one click.",
  },
  {
    icon: <Music2 className="size-5" />,
    color: "bg-amber",
    title: "Your goal sound",
    body: "Swap the built-in chime for any sound you like. It's stored in your vault, so it follows you between computers.",
  },
];

function Extras() {
  return (
    <section className="bg-paper py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <Eyebrow className="text-ink-soft">And the small things</Eyebrow>
          <h2 className="font-display-tight mt-3 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.04] font-bold">
            Made for one writer. Or a few.
          </h2>
          <div className="mt-10 space-y-6">
            {EXTRAS.map((e) => (
              <div key={e.title} className="flex gap-4">
                <IconTile icon={e.icon} color={e.color} />
                <div>
                  <h3 className="text-lg font-semibold">{e.title}</h3>
                  <p className="text-ink-soft mt-1 text-[15px] leading-6">{e.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Screenshot {...SHOTS.profiles} />
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="border-ink bg-amber border-t-2 py-20 sm:py-24">
      <div className="container-page flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        <h2 className="font-display-tight max-w-3xl text-[clamp(2.4rem,6vw,5rem)] leading-[0.98] font-extrabold">
          Write your next video in Yorna.
        </h2>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/download">
            Get started <ArrowRight className="size-4" />
          </ButtonLink>
          <ButtonLink to={GITHUB_URL} variant="outline">
            <GitHubIcon className="size-4" /> GitHub
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function Home() {
  return (
    <>
      <Hero />
      <Facts />
      <Steps />
      <BoardSection />
      <SessionSection />
      <CalendarSection />
      <VaultSection />
      <Extras />
      <FinalCta />
    </>
  );
}
