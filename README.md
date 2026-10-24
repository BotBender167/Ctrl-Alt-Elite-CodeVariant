# Unfinished Business

Paste a GitHub username. We find the dead project still worth reviving and tell you why.

Built by team **Ctrl Alt Elite** for Code Variant Build 01, problem statement PS 05: The Project Graveyard.

Live: https://botbender167.github.io/Ctrl-Alt-Elite-CodeVariant/

## What it does

1. **Scan.** Reads a user's public repositories and labels each one alive, dormant, abandoned or finished, with the evidence behind the label.
2. **Autopsy.** Opens one project and draws its trail: born, where most of the work happened, last breath, and how long it has been silent.
3. **World check.** Searches GitHub for similar projects that appeared after the last commit, using keywords from the README that you can edit.
4. **Verdict.** Scores five roads (restart, continue, change, repurpose, archive), each with the reasons behind its score. The cause of death is suggested from the history and can be overridden.
5. **Archive.** Saves verdicts in the browser and shows patterns across them.

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

Every animation answers one question, and stays under 500 ms. Ambient glows are the only decoration.

| Where | What it does | Why it exists |
| --- | --- | --- |
| Home to app | Camera dives into the valley | Shows you are going inside the world |
| Route changes | Rise in, leave quickly | Keeps place and never makes you wait |
| Trail | Draws once, dotted silence fades in last | Makes "how long ago" a visible distance |
| Filters and cause pills | A pill slides to the new choice | Shows what changed |
| Road signs | Fill glides, scores tick, "Best fit" moves | Makes the verdict change after the world check legible |
| Camp list | Rows glide when filtered | Shows where items went |

All motion respects `prefers-reduced-motion`. Only `transform` and `opacity` are animated.

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
api/                 serverless GitHub proxy and its allow-list
src/config/rules.ts  thresholds, weights, labels (change rules here)
src/lib/             GitHub client, rules engine, keyword extraction
src/pages/           Home, Camps, Project, Archive
src/components/      shared UI
src/world/           the painted background and camera
```

## Known limits

- Commit history shows effort, not intent, so the cause of death is a suggestion.
- Similar repositories are evidence, not proof that an idea was taken.
- Public repositories only. Without a token GitHub allows 60 requests an hour per network.
- The background painting is a supplied image.
