import { Binoculars, Signpost } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorPanel } from '../components/ErrorPanel'
import { Page, Reveal } from '../components/Page'
import { EASE_OUT } from '../lib/motion'
import { RoadPanel } from '../components/RoadPanel'
import { StatusChip } from '../components/StatusChip'
import { Trail } from '../components/Trail'
import { CAUSE_LABEL, CAUSES } from '../config/rules'
import type { Cause, Road } from '../config/rules'
import { useTitle } from '../hooks/useTitle'
import { daysBetween, daysBetweenDates, fmtDate, fmtStars } from '../lib/format'
import { extractKeywords, readmeLooksWip, salvageModules, summarize } from '../lib/keywords'
import { useProject, useWorld } from '../lib/queries'
import { classifyDeep, scoreRoads, suggestCause } from '../lib/rules'
import type { ProjectData } from '../lib/types'
import { useArchive } from '../store'

function ProjectView({ data, user }: { data: ProjectData; user: string }) {
  const { meta, stats, readme, tree, hasRelease } = data
  useTitle(meta.name)
  const reduce = useReducedMotion()
  const saved = useArchive((s) => s.entries[`${meta.owner.login}/${meta.name}`.toLowerCase()])
  const save = useArchive((s) => s.save)
  const glide = reduce ? { duration: 0 } : { type: 'spring' as const, duration: 0.35, bounce: 0.1 }

  const [daysSilent] = useState(() => daysBetween(meta.pushed_at ?? meta.created_at))
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

  const [justSaved, setJustSaved] = useState(false)
  useEffect(() => {
    if (!justSaved) return
    const id = window.setTimeout(() => setJustSaved(false), 1800)
    return () => window.clearTimeout(id)
  }, [justSaved])

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
      status: cls.status,
      cause,
      road,
      lifeDays,
      burstShare: stats?.burstShare ?? null,
      daysSilent,
      totalCommits: stats?.total ?? null,
    })
    setJustSaved(true)
  }

  return (
    <Page className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-28 pt-28 sm:px-6">
      <Reveal>
        <Link to={`/u/${user}`} className="text-sm text-mist transition-colors duration-150 hover:text-cream">
          Back to the camps
        </Link>
        <h1 className="mt-2 break-all text-[clamp(52px,9vw,96px)]">{meta.name}</h1>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-lg">
          <StatusChip status={cls.status} />
          {summary && <span className="max-w-3xl text-cream/90">{summary}</span>}
        </p>
        <a
          href={meta.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-mist underline decoration-cream/30 underline-offset-4 hover:text-cream"
        >
          {meta.full_name} on GitHub
        </a>
      </Reveal>

      <Reveal index={1} className="panel mt-6 overflow-hidden">
        <section className="p-5 sm:p-6">
          <h2 className="text-[34px]">The trail</h2>
          {stats ? (
            <Trail meta={meta} stats={stats} daysSilent={daysSilent} />
          ) : (
            <p className="mt-3 text-mist">This repository has no commits to read, so there is no trail to draw.</p>
          )}
          <ul className="mt-3 space-y-1 border-l-2 border-accent/60 pl-3 text-sm text-mist">
            {cls.evidence.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <div className="grid border-t border-line lg:grid-cols-[1fr_380px]">
          <div className="space-y-9 p-5 sm:p-6 lg:border-r lg:border-line">
            <section>
              <h2 className="text-[34px]">Why it stopped</h2>
              <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Cause of death">
                {CAUSES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={cause === c}
                    className={`relative rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150 ${cause === c ? '' : 'bg-cream/10 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-cream/20'}`}
                    onClick={() => setPickedCause(c)}
                  >
                    {cause === c && (
                      <motion.span layoutId="cause-pill" className="absolute inset-0 rounded-full bg-accent" transition={glide} />
                    )}
                    <span className={`relative ${cause === c ? 'font-semibold text-[#1a120b]' : 'text-cream/85'}`}>
                      {CAUSE_LABEL[c]}
                      {c === suggested.cause && cause !== c && <span className="ml-1.5 text-xs text-accent">suggested</span>}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-mist">
                {cause === suggested.cause ? suggested.why : 'You chose this one. You know the project better than we do.'}
              </p>
            </section>

            <section>
              <h2 className="text-[34px]">The world check</h2>
              <p className="mt-2 text-sm text-mist">
                Projects like yours that appeared after your last commit on{' '}
                {fmtDate(stats?.lastDate ?? meta.pushed_at ?? meta.created_at)}.
              </p>
              <ul className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Search words">
                {keywords.map((k) => (
                  <li key={k} className="flex items-center gap-1 rounded-full bg-cream/10 py-1 pl-3 pr-1 text-sm">
                    {k}
                    <button
                      type="button"
                      aria-label={`Remove ${k}`}
                      className="grid h-6 w-6 place-items-center rounded-full text-mist transition-colors duration-150 hover:bg-cream/15 hover:text-cream"
                      onClick={() => setCustom(keywords.filter((w) => w !== k))}
                    >
                      <span aria-hidden="true">x</span>
                    </button>
                  </li>
                ))}
                <li>
                  <form onSubmit={addKeyword}>
                    <label htmlFor="kw" className="sr-only">
                      Add a search word
                    </label>
                    <input
                      id="kw"
                      className="h-8 w-32 rounded-full border border-line bg-transparent px-3 text-sm placeholder:text-mist/70"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      placeholder="Add a word"
                    />
                  </form>
                </li>
              </ul>

              {!scouted && (
                <button type="button" className="btn mt-4" disabled={keywords.length === 0} onClick={() => setScouted(true)}>
                  <Binoculars size={22} weight="duotone" /> Scout the world
                </button>
              )}
              {scouted && world.isFetching && (
                <div className="mt-4 space-y-2" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="skeleton h-14" />
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
                  <p className="font-medium">
                    {similar.length === 0
                      ? 'Nothing like it has appeared since. The road looks open.'
                      : `${similar.length} similar project${similar.length === 1 ? '' : 's'} appeared after you stopped.`}
                  </p>
                  <ul className="mt-2">
                    {similar.map((r, i) => (
                      <motion.li
                        key={r.id}
                        initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(8px)' }}
                        animate={{ opacity: 1, transform: 'translateY(0px)' }}
                        transition={{ duration: 0.3, ease: EASE_OUT, delay: reduce ? 0 : Math.min(i, 6) * 0.04 }}
                      >
                        <a
                          href={r.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl px-3 py-2.5 transition-colors duration-150 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-cream/[0.07]"
                        >
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="truncate font-semibold">{r.full_name}</span>
                            <span className="flex-none text-sm text-mist">{fmtStars(r.stargazers_count)} stars</span>
                          </span>
                          {r.description && <span className="mt-0.5 line-clamp-2 block text-sm text-mist">{r.description}</span>}
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-mist/80">Similar is not the same idea. Use this as evidence and judge for yourself.</p>
                </div>
              )}
            </section>
          </div>

          <div className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[34px]">
              <Signpost size={26} weight="duotone" className="text-accent" /> Choose your road
            </h2>
            <div className="mt-4">
              <RoadPanel roads={roads} chosen={road} onChoose={setPickedRoad} />
            </div>

            <button type="button" className="btn mt-5 w-full" onClick={handleSave}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={justSaved ? 'saved' : saved ? 'update' : 'save'}
                  initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(6px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  exit={{ opacity: 0, transition: { duration: 0.08 } }}
                  transition={{ duration: 0.16, ease: EASE_OUT }}
                >
                  {justSaved ? 'Saved' : saved ? 'Update my saved verdict' : 'Save my verdict'}
                </motion.span>
              </AnimatePresence>
            </button>
            {saved && (
              <p className="mt-3 text-sm text-mist" role="status">
                Saved on {fmtDate(saved.savedAt)}.{' '}
                <Link to="/archive" className="text-accent underline underline-offset-2">
                  Open the archive
                </Link>
              </p>
            )}

            <h3 className="mt-8 text-[28px]">Worth keeping</h3>
            {modules.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-cream/90">
                {modules.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-mist">No separate folders to lift out. This looks like a single-piece project.</p>
            )}
          </div>
        </div>
      </Reveal>
    </Page>
  )
}

export default function Project() {
  const { user = '', repo = '' } = useParams()
  const query = useProject(user, repo)
  useTitle(repo)

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
          <div className="skeleton h-80" />
        </div>
        <p className="sr-only" role="status">
          Reading the repository
        </p>
      </Page>
    )
  }
  return <ProjectView data={query.data} user={user} />
}
