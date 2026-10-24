# Unfinished Business

Paste a GitHub username. We find the dead project still worth reviving and tell you why.

Built by team **Ctrl Alt Elite** for Code Variant Build 01, problem statement PS 05: The Project Graveyard.

Live: https://botbender167.github.io/Ctrl-Alt-Elite-CodeVariant/

## The Canvas Protocol (surprise challenge)

There are no action buttons for the primary actions. Every one of them is done by dragging a card into a labelled **action zone**:

| Action | The card | The zone |
| --- | --- | --- |
| Scan a profile | Your ID card (type the username on it) | Your profile circle in the middle of the board |
| Open a project | A project note | **Examine** |
| Mark a project for later | A project note | **Keep** |
| Delete a project from the board | A project note | **Shred** (Undo in the toast, or "Bring back" in the dock) |
| Scan someone else | Your profile circle | **Switch profile** (you land back at the ID card) |
| Compare similar projects | A similar project | The **compare tray** in the case file |
| Save a verdict | A road (restart, continue, change, repurpose, archive) | The **verdict stamp** in the case file |
| Reopen or delete a saved verdict | An archive entry | **Reopen** or **Shred** on the archive page |

What is left as a plain control is navigation or preview only: Back and Next between case-file steps, Close, clicking a road to read why, the filter tabs and Undo.

It works without a mouse. Tab to a card, press **Enter** to pick it up, the **arrow keys** to choose a zone, **Enter** to drop it, **Escape** to cancel. Every step is announced to screen readers. On a phone, list rows carry a grip handle so the page still scrolls. The engine lives in [`src/features/dnd`](src/features/dnd) and is the only code that knows how dragging works.

## How it works for a first-time visitor

1. **The walk.** The page opens on a haunted house. Nothing plays by itself: you scroll, and the video moves forward (and back) with you. The door cracks and swings open (the real footage), the camera pushes into the doorway and the room fills the screen. Turn the sound on (top right, or the button on the first screen) for a low ambience that builds as you approach, one slight crack and creak as the door gives, and a lamp hum that stutters with the light. Switching it off silences it at once.
2. **The ID card.** Type a GitHub username on the card and drag it onto the empty circle in the middle of the board. That is the scan.
3. **The board.** Your profile sits in the middle and every project hangs off it by a red string, flying out of the circle as the board lands. Quiet projects that need a verdict sit to the left, dormant ones to the right, finished and alive ones at the edges, and inside each group the newest is nearest you. The pinning is a little messy on purpose. Point at a note and it unfolds in place into a card with what we know and what it is tied to; anything the card covers blurs, so only that project is readable. The lamp flickers the whole time.
4. **The case file.** Drag a note onto **Examine** and it opens like a folder. Three steps:
   1. **When it stopped.** A trail from the first commit to the last, and the silence since.
   2. **Built around it.** Similar projects that started after you stopped, with when each last moved. Drag up to three into the compare tray.
   3. **Your move.** Your project against the ones in your tray, then five roads, each scored with reasons and a first move. Drag the road you choose onto the verdict stamp to save it.
5. **Archive.** Saved verdicts live in the browser, with patterns across them.

Every label and score is a plain rule you can read in [`src/config/rules.ts`](src/config/rules.ts) and [`src/lib/rules.ts`](src/lib/rules.ts). There is no black box.

## Stack

| Choice | Why |
| --- | --- |
| Vite, React, TypeScript | A static single-page app. Nothing server-side has to be up for it to work. |
| React Router | Deep links such as `/u/octocat/some-repo` open straight into a result. |
| TanStack Query | Caching, request de-duplication and retries for GitHub calls. |
| Zustand (persisted) | A tiny store for the archive and settings, kept in `localStorage`. |
| Zod | Every GitHub response is validated before the app trusts it. |
| Tailwind CSS v4 | Design tokens live in `src/index.css`. |
| Motion | Animations that explain state changes. See "Motion" below. |
| Vitest | The rules engine and the proxy allow-list are pure functions with tests. |

## How GitHub is called

- **Budget:** scanning a user costs 1 request. Opening a project costs about 7 (repo, commit totals read from the `Link` header, README, top-level tree, releases). The world check costs 1 to 3 search requests.
- **Layers of protection:** lazy loading, a 10 minute cache, request de-duplication, a limit of 4 parallel requests, typed errors, and a visible "requests left" notice when the quota is low.
- **More headroom:** paste a token in the app (stored only in the browser), or deploy with the serverless proxy below.

### Optional server-side proxy

`api/github.ts` is a Vercel function that forwards a short allow-list of read-only GitHub endpoints (see `api/_lib/allow.ts`), adds a server-side token and lets the CDN cache responses. It is off by default.

```bash
# Vercel project settings
GITHUB_TOKEN=<token with no scopes>
VITE_API_PROXY=/api/github
```

## Motion

Every animation answers one question, and stays under 500 ms. The two ambient glows are the only decoration.

| Where | What it does | Why it exists |
| --- | --- | --- |
| The walk | Scroll scrubs the video, a spring smooths the wheel | You walk up to the house yourself, nothing autoplays |
| The door | The room is drawn through a slit where the door is, and the slit widens to the whole screen | You step through the door into the investigation |
| Lamp | Two light layers flicker out of step with each other | Keeps the board feeling alive while you read it |
| Notes landing | Each note flies out of your profile and pins in, one after another | Shows that everything on the board is yours, and in what order |
| Red strings | Draw from your profile to each note as it lands | Connection: every project hangs off you |
| Pointing at a note | Its string pulls tight, the rest dim, and the note unfolds in place into its details; whatever it covers blurs | Shows what we know before you commit, and keeps only that project readable |
| Dragging | The card lifts, matching zones light up, the one under it grows | Tells you where it can go and where it will land |
| A drop | The card flies into the zone; a refused drop snaps back | Confirms it worked, or says it did not |
| Note to case file | The paper glides from the note into the folder | Keeps your place: this is the project you clicked |
| Steps | Slide in the direction you are travelling | Shows whether you went forward or back |
| Trail | Draws once, the dotted silence fades in last | Makes "how long ago" a visible distance |
| Cause, road and filter pills | A marker slides to the new choice | Shows what changed |
| Scores | Tick to their new value | Makes the verdict change after a search legible |

All motion respects `prefers-reduced-motion`: no scroll walk (the room is shown straight away), no flicker, near-instant drops. Only `transform` and `opacity` are animated.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run lint
npm run build
npm run deploy     # builds and publishes to GitHub Pages
```

## Structure

```text
api/                      serverless GitHub proxy and its allow-list
src/config/rules.ts       thresholds, weights, labels (change rules here)
src/lib/                  GitHub client, rules engine, relations, keyword extraction
src/room/                 the scroll-scrubbed video and the investigation room
src/features/dnd/         the drag-and-drop engine (pointer, keyboard, zones, announcements)
src/features/board/       profile hub, notes, red strings, layout, dock
src/features/case/        the four-step case file, compare tray, verdict stamp
src/pages/                Home, Board, Archive
src/components/           shared UI
public/                   intro video (1080p and 1440p), room image (2560 and 4K), ambience loop
```

## Known limits

- Commit history shows effort, not intent, so the cause of death is a suggestion.
- Similar repositories are evidence, not proof that an idea was taken.
- Public repositories only. Without a token GitHub allows 60 requests an hour per network.
- The intro video is a short third-party clip, trimmed to its first 4.9 seconds, with everything after the door opens removed. It is the team's 1440p upscale, re-encoded with a keyframe on every frame so scrolling can scrub it (1080p and 1440p versions are served by screen size). The ambience loop is its own soundtrack, looped seamlessly; the creak, wind, hum and card sounds are synthesised in the browser with Web Audio. Its licence is the open item to settle before this is more than a hackathon entry. The room artwork is supplied by the team; the 2560 and 4K renders keep its frame, lamp and desk and re-synthesise the cork grain at full resolution, so the lamp and frame are only as sharp as the original painting.
