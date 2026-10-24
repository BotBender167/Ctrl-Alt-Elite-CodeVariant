# Unfinished Business

Paste a GitHub username. We find the dead project still worth reviving and tell you why.

Built by team **Ctrl Alt Elite** for Code Variant Build 01, problem statement PS 05: The Project Graveyard.

Live: https://botbender167.github.io/Ctrl-Alt-Elite-CodeVariant/

## How it works for a first-time visitor

1. **Home.** One field. Type a GitHub username over the opening video (a haunted house, then the graveyard where dead projects rest).
2. **The board.** The video crossfades into an investigation room. Every project is a note pinned to a cork board with a rubber stamp for its status and a handwritten "last seen". Red strings link projects that share something, and pointing at one explains why. The most urgent projects are on the first page.
3. **The case file.** Click a note and it opens like a folder. Four steps, one question each:
   1. **When it stopped.** A trail from the first commit to the last, and the silence since.
   2. **Why.** Every plausible reason, ranked from the evidence. Pick the one that feels true.
   3. **Built around it.** Similar projects that appeared after you stopped. Add up to three to compare.
   4. **Your move.** Your project against the ones you picked, then five roads (restart, continue, change, repurpose, archive), each scored with reasons and a first move. Save the verdict.
4. **Archive.** Saved verdicts live in the browser, with patterns across them.

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
| Video to room | Slow crossfade, the room settles in | Feels like walking through a door |
| Notes landing | Each note pins in, one after another | Shows what is on the board and in what order |
| Red strings | Draw in after the notes land | Shows that two projects belong together |
| Note to case file | The paper glides from the note into the folder | Keeps your place: this is the project you clicked |
| Steps | Slide in the direction you are travelling | Shows whether you went forward or back |
| Trail | Draws once, the dotted silence fades in last | Makes "how long ago" a visible distance |
| Cause, road and filter pills | A marker slides to the new choice | Shows what changed |
| Scores | Tick to their new value | Makes the verdict change after a search legible |

All motion respects `prefers-reduced-motion` (the video becomes a still). Only `transform` and `opacity` are animated.

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
src/room/                 the video and the investigation room
src/features/board/       notes, red strings, dock
src/features/case/        the four-step case file and the comparison table
src/pages/                Home, Board, Archive
src/components/           shared UI
public/                   graveyard video, room image
```

## Known limits

- Commit history shows effort, not intent, so the cause of death is a suggestion.
- Similar repositories are evidence, not proof that an idea was taken.
- Public repositories only. Without a token GitHub allows 60 requests an hour per network.
- The video and the room artwork are supplied by the team (the video was edited: trimmed, watermark removed, muted and compressed).
