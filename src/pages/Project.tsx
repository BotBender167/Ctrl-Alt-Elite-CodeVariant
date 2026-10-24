import {
  ArrowLeft,
  Binoculars,
  CheckCircle,
  FolderSimple,
  GithubLogo,
  Plus,
  Star,
  X,
} from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorPanel } from '../components/ErrorPanel'
import { Page, Reveal } from '../components/Page'
import { RoadPanel } from '../components/RoadPanel'
import { StatusChip } from '../components/StatusChip'
import { Trail } from '../components/Trail'
import { CAUSE_LABEL, CAUSES } from '../config/rules'
import type { Cause, Road } from '../config/rules'
import { daysBetween, daysBetweenDates, fmtDate, fmtStars } from '../lib/format'
import { extractKeywords, readmeLooksWip, salvageModules, summarize } from '../lib/keywords'
import { useProject, useWorld } from '../lib/queries'
import { classifyDeep, scoreRoads, suggestCause } from '../lib/rules'
import type { ProjectData } from '../lib/types'
import { useArchive } from '../store'

function ProjectView({ data, user }: { data: ProjectData; user: string }) {
  const { meta, stats, readme, tree, hasRelease } = data
  const saved = useArchive((s) => s.entries[`${meta.owner.login}/${meta.name}`.toLowerCase()])
  const save = useArchive((s) => s.save)

  const daysSilent = daysBetween(meta.pushed_at ?? meta.created_at)
  const cls = classifyDeep(meta, { hasRelease, wip: readmeLooksWip(readme), burstShare: stats?.burstShare ?? null })
  const lifeDays = stats ? daysBetweenDates(stats.firstDate, stats.lastDate) : null
  const summary = summarize(readme, meta.description)
  const modules = useMemo(() => salvageModules(tree), [tree])

  const defaultKeywords = useMemo(
    () => extractKeywords({ name: meta.name, topics: meta.topics, description: meta.description, readme }),
    [meta, readme],
  )
  const [custom, setCustom] = useState<string[] | null>(null)
  const [newWord, setNewWord] = useState('')
  const keywords = custom ?? defaultKeywords

  const [scouted, setScouted] = useState(false)
  const world = useWorld(data, keywords, scouted)
  const similar = world.data
  const similarCount = similar ? similar.length : null

  const suggested = suggestCause({
    lifeDays,
    burstShare: stats?.burstShare ?? null,
    sizeKb: meta.size,
    lastMessage: stats?.lastMessage ?? '',
    similarCount,
    daysSilent,
  })
  const [pickedCause, setPickedCause] = useState<Cause | null>(null)
  const cause = pickedCause ?? suggested.cause

  const roads = scoreRoads({
    status: cls.status,
    daysSilent,
    totalCommits: stats?.total ?? null,
    similarCount,
    topSimilarStars: similar?.[0]?.stargazers_count ?? 0,
    salvageCount: modules.length,
  })
  const [pickedRoad, setPickedRoad] = useState<Road | null>(null)
  const road = pickedRoad ?? roads[0]?.road ?? 'archive'

  function addKeyword(e: FormEvent): void {
    e.preventDefault()
    const w = newWord.trim().toLowerCase()
    if (w && !keywords.includes(w)) setCustom([...keywords, w])
    setNewWord('')
  }

  function handleSave(): void {
    save({
      key: `${meta.owner.login}/${meta.name}`.toLowerCase(),
      owner: meta.owner.login,
      repo: meta.name,
      savedAt: new Date().toISOString(),
      status: cls.status,
      cause,
      road,
      lifeDays,
      burstShare: stats?.burstShare ?? null,
      daysSilent,
      totalCommits: stats?.total ?? null,
    })
  }

  return (
    <Page className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-28 pt-28 sm:px-6">
      <Reveal>
        <Link to={`/u/${user}`} className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-cream">
          <ArrowLeft size={16} weight="bold" /> Back to the camps
        </Link>
        <div className="mt-2 flex flex-wrap items-end gap-x-5 gap-y-2">
          <h1 className="break-all text-[clamp(52px,9vw,96px)]">{meta.name}</h1>
          <div className="pb-2">
            <StatusChip status={cls.status} />
          </div>
        </div>
        {summary && <p className="mt-3 max-w-3xl text-lg text-cream/90">{summary}</p>}
        <a
          href={meta.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-mist hover:text-cream"
        >
          <GithubLogo size={18} weight="duotone" /> {meta.full_name}
        </a>
      </Reveal>

      <Reveal index={1} className="panel mt-6 p-5 sm:p-6">
        <h2 className="text-[44px]">The trail</h2>
        {stats ? (
          <Trail meta={meta} stats={stats} daysSilent={daysSilent} />
        ) : (
          <p className="mt-3 text-mist">This repository has no commits to read, so there is no trail to draw.</p>
        )}
        <div className="mt-2 border-t border-line pt-4">
          <p className="text-sm font-medium text-cream">Why we call it {cls.status}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-mist">
            {cls.evidence.map((line) => (
              <li key={line} className="flex gap-2">
                <CheckCircle size={18} weight="duotone" className="mt-0.5 flex-none text-accent" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Reveal index={2} className="panel p-5 sm:p-6">
            <h2 className="text-[44px]">The story</h2>
            <p className="mt-2 text-sm font-medium text-cream">Here is what we think you were building</p>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Keywords">
              {keywords.map((k) => (
                <li key={k} className="flex items-center gap-1 rounded-full bg-cream/10 py-1 pl-3 pr-1.5 text-sm">
                  {k}
                  <button
                    type="button"
                    aria-label={`Remove ${k}`}
                    className="grid h-6 w-6 place-items-center rounded-full text-mist hover:bg-cream/15 hover:text-cream"
                    onClick={() => setCustom(keywords.filter((w) => w !== k))}
                  >
                    <X size={14} weight="bold" />
                  </button>
                </li>
              ))}
              {keywords.length === 0 && <li className="text-sm text-mist">No keywords found. Add a few to search with.</li>}
            </ul>
            <form onSubmit={addKeyword} className="mt-3 flex gap-2">
              <label htmlFor="kw" className="sr-only">
                Add a keyword
              </label>
              <input id="kw" className="field !h-10 !text-base" value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="Add a keyword" />
              <button type="submit" className="btn ghost small" aria-label="Add keyword">
                <Plus size={18} weight="bold" />
              </button>
            </form>

            <p className="mt-6 text-sm font-medium text-cream">Why did it stop?</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Cause of death">
              {CAUSES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={cause === c}
                  className={`btn small ${cause === c ? '' : 'ghost'}`}
                  onClick={() => setPickedCause(c)}
                >
                  {CAUSE_LABEL[c]}
                  {c === suggested.cause && <span className="text-xs opacity-70">Suggested</span>}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-mist">
              {cause === suggested.cause ? suggested.why : 'You chose this one. You know the project better than we do.'}
            </p>
          </Reveal>

          <Reveal index={3} className="panel p-5 sm:p-6">
            <h2 className="text-[44px]">The world check</h2>
            <p className="mt-2 text-mist">
              We search GitHub for projects like yours that were created after your last commit ({fmtDate(stats?.lastDate ?? meta.pushed_at ?? meta.created_at)}).
            </p>
            {!scouted && (
              <button type="button" className="btn mt-4" disabled={keywords.length === 0} onClick={() => setScouted(true)}>
                <Binoculars size={22} weight="duotone" /> Scout the world
              </button>
            )}
            {scouted && world.isFetching && (
              <div className="mt-4 space-y-2" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-16" />
                ))}
              </div>
            )}
            {scouted && world.isError && (
              <div className="mt-4">
                <ErrorPanel error={world.error} subject="that search" onRetry={() => void world.refetch()} />
              </div>
            )}
            {scouted && !world.isFetching && similar && (
              <div className="mt-4">
                <p className="font-medium text-cream">
                  {similar.length === 0
                    ? 'Nothing like it has appeared since. The road looks open.'
                    : `${similar.length} similar project${similar.length === 1 ? '' : 's'} appeared after you stopped.`}
                </p>
                <ul className="mt-3 space-y-2">
                  {similar.map((r) => (
                    <li key={r.id}>
                      <a
                        href={r.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl bg-cream/[0.07] p-3 transition-colors duration-150 hover:bg-cream/[0.13]"
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate font-semibold">{r.full_name}</span>
                          <span className="flex flex-none items-center gap-1 text-sm text-mist">
                            <Star size={16} weight="fill" className="text-accent" /> {fmtStars(r.stargazers_count)}
                          </span>
                        </span>
                        {r.description && <span className="mt-1 line-clamp-2 block text-sm text-mist">{r.description}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-mist/80">Similar is not the same idea. Use this as evidence and judge for yourself.</p>
              </div>
            )}
          </Reveal>

          <Reveal index={4} className="panel p-5 sm:p-6">
            <h2 className="text-[44px]">Worth keeping</h2>
            {modules.length > 0 ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {modules.map((m) => (
                  <li key={m} className="flex items-center gap-2 rounded-xl bg-cream/[0.07] px-3 py-2">
                    <FolderSimple size={22} weight="duotone" className="text-accent" /> {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-mist">No separate folders to lift out. This looks like a single-piece project.</p>
            )}
          </Reveal>
        </div>

        <Reveal index={3} className="lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-5">
            <h2 className="text-[44px]">Choose your road</h2>
            <div className="mt-4">
              <RoadPanel roads={roads} chosen={road} onChoose={setPickedRoad} />
            </div>
            <button type="button" className="btn mt-5 w-full" onClick={handleSave}>
              {saved ? 'Update my archive entry' : 'Save to my archive'}
            </button>
            {saved && (
              <p className="mt-3 flex items-center gap-2 text-sm text-teal" role="status">
                <CheckCircle size={18} weight="duotone" /> Saved on {fmtDate(saved.savedAt)}.{' '}
                <Link to="/archive" className="underline underline-offset-2">
                  Open archive
                </Link>
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </Page>
  )
}

export default function Project() {
  const { user = '', repo = '' } = useParams()
  const query = useProject(user, repo)

  if (query.isError) {
    return (
      <Page className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-24 pt-32">
        <ErrorPanel error={query.error} subject={`${user}/${repo}`} onRetry={() => void query.refetch()} />
      </Page>
    )
  }
  if (!query.data) {
    return (
      <Page className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-32 sm:px-6">
        <div className="space-y-4" aria-hidden="true">
          <div className="skeleton h-24 max-w-md" />
          <div className="skeleton h-72" />
          <div className="skeleton h-56" />
        </div>
        <p className="sr-only" role="status">
          Reading the repository
        </p>
      </Page>
    )
  }
  return <ProjectView data={query.data} user={user} />
}
