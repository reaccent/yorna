import type { Shot } from "./components/ui";

export const GITHUB_URL = "https://github.com/reaccent/yorna";
export const ISSUES_URL = `${GITHUB_URL}/issues`;
export const SYNC_DOC_URL = `${GITHUB_URL}/blob/main/docs/sync.md`;
export const CLONE_COMMAND = "git clone https://github.com/reaccent/yorna.git";

/** Captured from the app by `npm run capture:product`. */
export const SHOTS = {
  calendar: {
    src: "/product/calendar.webp",
    alt: "Yorna's calendar: a month grid with worked days marked by stars, colored reminder dots, 63% of the month left to work and an Upcoming list.",
  },
  calendarHover: {
    src: "/product/calendar-hover.webp",
    alt: "Hovering a calendar day opens a small panel listing that day's reminders with an option to add one.",
  },
  board: {
    src: "/product/board.webp",
    alt: "The Notes board with To do, In progress and Done columns of video scripts, each card showing an excerpt, last edit and word count.",
  },
  editor: {
    src: "/product/editor.webp",
    alt: "A script open in the editor with headings, a numbered list of beats and a B-roll checklist, while a session runs: the star ring is 57% full with 12:46 left.",
  },
  sessionDialog: {
    src: "/product/session-dialog.webp",
    alt: "The “How long will you work?” dialog with 15, 30, 60 minute and Custom options and a Start session button.",
    width: 896,
    height: 770,
    crop: true,
  },
  profiles: {
    src: "/product/profiles.webp",
    alt: "The “Who's writing?” screen listing three profiles — Yehor, Ana and Shorts — with a field to create a new one.",
    width: 1024,
    height: 1156,
    crop: true,
  },
} satisfies Record<string, Shot>;

export const PROVIDERS = ["Google Drive", "Dropbox", "iCloud Drive", "OneDrive"] as const;

export const VAULT_TREE = `vault/
├── yorna.json        board, reminders, sessions, settings
├── notes/
│   ├── ep-14.html    one file per script
│   └── ep-13.html
├── sounds/
│   └── finish.mp3    your goal sound
└── profiles/
    └── ana-…/        same layout per profile`;
