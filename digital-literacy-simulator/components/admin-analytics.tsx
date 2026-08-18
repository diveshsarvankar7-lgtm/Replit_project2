'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LEVELS } from '@/lib/levels'
import { getLocalAttempts, getParticipantName } from '@/lib/session'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type Participant = { id: string; name: string; age: number; created_at: string }
type Session = { id: string; participant_id: string; started_at: string; completed_at: string | null; current_level: number }
type Attempt = { session_id: string; level_number: number; task_key: string; started_at: string; completed_at: string | null; hints_used: number | null; wrong_taps: number | null; status: string | null; attempts: number | null }
const tasks = LEVELS.flatMap((level) => level.tasks.map((task) => ({ ...task, level: level.number })))
const emptyMessage = 'No sessions recorded yet - have a participant complete the simulator to see data here'

function duration(start?: string, end?: string | null) { return start && end ? Math.max(0, new Date(end).getTime() - new Date(start).getTime()) / 60000 : 0 }
function csvEscape(value: unknown) { return `"${String(value ?? '').replaceAll('"', '""')}"` }

export function AdminAnalytics() {
  const [data, setData] = useState<{ participants: Participant[]; sessions: Session[]; attempts: Attempt[] } | null>(null)
  const [error, setError] = useState('')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' })
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  useEffect(() => { void (async () => {
    const supabase = createClient()
    if (!supabase) {
      const attempts = getLocalAttempts()
      const participantId = 'local-participant'
      const sessionId = 'local-session'
      const now = new Date().toISOString()
      setData({
        participants: attempts.length ? [{ id: participantId, name: getParticipantName() ?? 'Local participant', age: 0, created_at: now }] : [],
        sessions: attempts.length ? [{ id: sessionId, participant_id: participantId, started_at: now, completed_at: now, current_level: Math.max(...attempts.map((a) => a.level_number), 0) }] : [],
        attempts: attempts.map((attempt) => ({ session_id: sessionId, level_number: attempt.level_number, task_key: attempt.task_key, started_at: now, completed_at: attempt.status === 'completed' ? now : null, hints_used: 0, wrong_taps: 0, status: attempt.status, attempts: attempt.attempts ?? 1 })),
      })
      return
    }
    const [p, s, a] = await Promise.all([
      supabase.from('participants').select('id,name,age,created_at').order('created_at', { ascending: true }),
      supabase.from('sessions').select('id,participant_id,started_at,completed_at,current_level'),
      supabase.from('task_attempts').select('session_id,level_number,task_key,started_at,completed_at,hints_used,wrong_taps,status,attempts'),
    ])
    if (p.error || s.error || a.error) setError('Analytics data could not be loaded. Please check the Supabase table permissions.')
    else setData({ participants: p.data ?? [], sessions: s.data ?? [], attempts: a.data ?? [] })
  })() }, [])

  const rows = useMemo(() => {
    if (!data) return []
    return data.participants.map((participant) => {
      const sessions = data.sessions.filter((s) => s.participant_id === participant.id)
      const sessionIds = new Set(sessions.map((s) => s.id))
      const attempts = data.attempts.filter((a) => sessionIds.has(a.session_id))
      const completed = attempts.filter((a) => a.status === 'completed' || a.completed_at)
      const last = sessions.reduce<Session | null>((acc, s) => !acc || new Date(s.started_at) > new Date(acc.started_at) ? s : acc, null)
      return { ...participant, level: Math.max(0, ...sessions.map((s) => s.current_level || 0)), completed: completed.length, total: tasks.length, time: sessions.reduce((sum, s) => sum + duration(s.started_at, s.completed_at), 0), hints: attempts.reduce((sum, a) => sum + (a.hints_used || 0), 0), wrong: attempts.reduce((sum, a) => sum + (a.wrong_taps || 0), 0), completionDate: last?.completed_at ?? '' }
    })
  }, [data])

  const taskStats = useMemo(() => tasks.map((task) => { const attempts = data?.attempts.filter((a) => a.task_key === task.key) ?? []; const completed = attempts.filter((a) => a.status === 'completed' || a.completed_at).length; return { ...task, rate: attempts.length ? completed / attempts.length * 100 : 0, hints: attempts.length ? attempts.reduce((n, a) => n + (a.hints_used || 0), 0) / attempts.length : 0, wrong: attempts.length ? attempts.reduce((n, a) => n + (a.wrong_taps || 0), 0) / attempts.length : 0 } }), [data])
  const safetyStats = useMemo(() => tasks.filter((t) => t.level === 4).map((task) => { const attempts = data?.attempts.filter((a) => a.task_key === task.key) ?? []; const first = attempts.filter((a) => (a.attempts || 1) <= 1 && (a.status === 'completed' || a.completed_at)).length; const afterWrong = attempts.filter((a) => (a.attempts || 1) > 1 && (a.status === 'completed' || a.completed_at)).length; return { ...task, first: attempts.length ? first / attempts.length * 100 : 0, afterWrong: attempts.length ? afterWrong / attempts.length * 100 : 0 } }), [data])
  const summary = useMemo(() => ({ participants: rows.length, completion: rows.length ? rows.reduce((n, r) => n + r.completed / r.total * 100, 0) / rows.length : 0, hints: rows.length ? rows.reduce((n, r) => n + r.hints, 0) / rows.length : 0, sessionTime: data?.sessions.length ? data.sessions.reduce((n, s) => n + duration(s.started_at, s.completed_at), 0) / data.sessions.length : 0 }), [rows, data])
  const filteredRows = rows.filter((row) => row.name.toLowerCase().includes(query.toLowerCase()) && (levelFilter === 'all' || row.level >= Number(levelFilter)))
  const detailedRows = useMemo(() => {
    if (!data) return []
    const taskMap = new Map(tasks.map((task) => [task.key, task]))
    const attemptsBySessionAndTask = new Map<string, Attempt[]>()
    for (const attempt of data.attempts) {
      const key = `${attempt.session_id}:${attempt.task_key}`
      attemptsBySessionAndTask.set(key, [...(attemptsBySessionAndTask.get(key) ?? []), attempt])
    }
    const latestSessionByParticipant = new Map<string, Session>()
    for (const session of data.sessions) {
      const current = latestSessionByParticipant.get(session.participant_id)
      if (!current || new Date(session.started_at) > new Date(current.started_at)) {
        latestSessionByParticipant.set(session.participant_id, session)
      }
    }
    return data.participants.flatMap((participant) => {
      const session = latestSessionByParticipant.get(participant.id)
      return tasks.map((task, index) => {
        const matching = session ? attemptsBySessionAndTask.get(`${session.id}:${task.key}`) ?? [] : []
        const attempt = [...matching].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]
        return {
          record: `${participant.id}-${index}`,
          participantId: participant.id,
          name: participant.name,
          age: participant.age,
          sessionId: session?.id ?? '',
          level: task.level,
          taskKey: task.key,
          task: taskMap.get(task.key)?.title ?? task.key,
          status: attempt?.status ?? 'not_started',
          attempts: attempt?.attempts ?? 0,
          hints: attempt?.hints_used ?? 0,
          wrongTaps: attempt?.wrong_taps ?? 0,
          startedAt: attempt?.started_at ?? '',
          completedAt: attempt?.completed_at ?? '',
          durationMinutes: attempt ? duration(attempt.started_at, attempt.completed_at).toFixed(2) : '',
        }
      })
    }).filter((row) => row.name.toLowerCase().includes(query.toLowerCase()) && (levelFilter === 'all' || row.level >= Number(levelFilter)))
  }, [data, query, levelFilter])
  const sortedRows = [...filteredRows].sort((a, b) => { const av = a[sort.key as keyof typeof a]; const bv = b[sort.key as keyof typeof b]; const result = String(av).localeCompare(String(bv), undefined, { numeric: true }); return sort.dir === 'asc' ? result : -result })
  const setSortKey = (key: string) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))
  const downloadCsv = (filename: string, headers: string[], body: unknown[][]) => { const csv = ['\uFEFF' + headers.map(csvEscape).join(','), ...body.map((line) => line.map(csvEscape).join(','))].join('\r\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
  const exportReport = () => { const headers = ['Participant name','Age','Level reached','Tasks completed','Total tasks','Total time (minutes)','Hints used','Wrong taps','Completion date']; const body = filteredRows.map((r) => [r.name,r.age,r.level,r.completed,r.total,r.time.toFixed(1),r.hints,r.wrong,r.completionDate ? new Date(r.completionDate).toISOString() : '']); downloadCsv('digital-literacy-summary.csv', headers, body) }
  const exportDetailedReport = () => { const headers = ['Record','Participant ID','Participant name','Age','Session ID','Level','Task key','Task','Status','Attempts','Hints used','Wrong taps','Started at (ISO)','Completed at (ISO)','Duration (minutes)']; const body = detailedRows.map((r) => [r.record,r.participantId,r.name,r.age,r.sessionId,r.level,r.taskKey,r.task,r.status,r.attempts,r.hints,r.wrongTaps,r.startedAt,r.completedAt,r.durationMinutes]); downloadCsv('digital-literacy-detailed-task-report.csv', headers, body) }

  if (error) return <main className="mx-auto max-w-7xl p-6"><p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">{error}</p></main>
  if (!data) return <main className="mx-auto max-w-7xl animate-pulse p-6"><div className="h-10 w-72 rounded bg-muted" /><div className="mt-8 h-32 rounded-2xl bg-muted" /></main>
  if (!data.sessions.length) return <main className="mx-auto max-w-7xl p-6"><header className="mb-8"><p className="text-sm font-bold uppercase tracking-widest text-primary">Facilitator view</p><h1 className="mt-2 text-4xl font-black">Research analytics</h1></header><div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center"><p className="text-lg font-bold">{emptyMessage}</p></div></main>

  const tableHeaders: [string, string][] = [['name','Name'],['age','Age'],['level','Level'],['completed','Tasks'],['time','Time'],['hints','Hints'],['wrong','Wrong taps'],['completionDate','Completion date']]
  return <main className="mx-auto max-w-7xl p-4 sm:p-6"><header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-widest text-primary">Facilitator view</p><h1 className="mt-2 text-4xl font-black tracking-tight">Research analytics</h1><p className="mt-2 text-muted-foreground">Digital Literacy Simulator · real participant data</p></div><div className="flex gap-2"><button onClick={exportDetailedReport} className="rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">Download detailed CSV</button><button onClick={exportReport} className="rounded-xl border border-border px-4 py-3 font-bold">Summary CSV</button><button onClick={() => window.print()} className="rounded-xl border border-border px-4 py-3 font-bold">Print summary</button></div></header>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Participants', summary.participants],['Avg completion', `${summary.completion.toFixed(1)}%`],['Avg hints / participant', summary.hints.toFixed(1)],['Avg session time', `${summary.sessionTime.toFixed(1)} min`]].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></article>)}</section>
     <section className="mt-8 rounded-2xl border border-border bg-card p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black">Every participant and task</h2><p className="mt-1 text-sm text-muted-foreground">One row per participant and task, including not-started tasks and all recorded result fields.</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="participant-search">Search participants</label><input id="participant-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search participants" className="rounded-xl border border-border bg-background px-3 py-2" /><label className="sr-only" htmlFor="level-filter">Minimum level</label><select id="level-filter" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2"><option value="all">All levels</option><option value="1">Level 1+</option><option value="2">Level 2+</option><option value="3">Level 3+</option><option value="4">Level 4</option></select></div></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead><tr className="border-b border-border">{[['name','Participant'],['age','Age'],['level','Level'],['completed','Tasks'],['time','Time'],['hints','Hints'],['wrong','Wrong taps'],['completionDate','Completion date']].map(([key, label]) => <th key={key} className="p-3"><button onClick={() => setSortKey(key)} className="font-bold">{label} {sort.key === key ? (sort.dir === 'asc' ? '↑' : '↓') : ''}</button></th>)}</tr></thead><tbody>{sortedRows.map((r) => <tr key={r.id} className="border-b border-border/60"><td className="p-3 font-bold">{r.name}</td><td className="p-3">{r.age}</td><td className="p-3">{r.level}</td><td className="p-3">{r.completed} / {r.total}</td><td className="p-3">{r.time.toFixed(1)} min</td><td className="p-3">{r.hints}</td><td className="p-3">{r.wrong}</td><td className="p-3">{r.completionDate ? new Date(r.completionDate).toLocaleDateString() : '—'}</td></tr>)}</tbody></table></div></section>
    <DataTable title="All task executions" headers={['Participant','Age','Level','Task','Status','Attempts','Hints','Wrong taps','Started','Completed']} rows={detailedRows.map((r) => [r.name, r.age, `L${r.level}`, r.task, r.status, r.attempts, r.hints, r.wrongTaps, r.startedAt ? new Date(r.startedAt).toLocaleString() : '—', r.completedAt ? new Date(r.completedAt).toLocaleString() : '—'])} />
    <section className="mt-8 grid gap-6 lg:grid-cols-2"><Chart title="Completion rate by task" data={taskStats.map((t) => ({ name: t.title.slice(0, 16), value: Number(t.rate.toFixed(1)) }))} /><Chart title="Average age vs completion time" data={rows.map((r) => ({ name: r.name.slice(0, 12), value: Number(r.time.toFixed(1)), age: r.age }))} secondKey="age" /></section>
    <section className="mt-8 grid gap-6 lg:grid-cols-2"><DataTable title="Per-task difficulty" headers={['Task','Completion','Avg hints','Avg wrong taps']} rows={taskStats.map((t) => [t.title, `${t.rate.toFixed(1)}%`, t.hints.toFixed(1), t.wrong.toFixed(1)])} /><DataTable title="Level 4 safety literacy" headers={['Safety task','Correct first try','Correct after wrong attempt']} rows={safetyStats.map((t) => [t.title, `${t.first.toFixed(1)}%`, `${t.afterWrong.toFixed(1)}%`])} /></section>
  </main>
}
function Chart({ title, data, secondKey }: { title: string; data: { name: string; value: number; age?: number }[]; secondKey?: string }) { return <article className="rounded-2xl border border-border bg-card p-4"><h2 className="mb-4 text-xl font-black">{title}</h2><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ left: 0, right: 8, bottom: 48 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Bar dataKey="value" fill="var(--chart-1)" radius={[5,5,0,0]} />{secondKey && <Bar dataKey={secondKey} fill="var(--chart-2)" radius={[5,5,0,0]} />}</BarChart></ResponsiveContainer></div></article> }
function DataTable({ title, headers, rows }: { title: string; headers: string[]; rows: (string | number)[][] }) { return <article className="rounded-2xl border border-border bg-card p-4"><h2 className="mb-4 text-xl font-black">{title}</h2><div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead><tr className="border-b border-border">{headers.map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-b border-border/60">{row.map((cell, j) => <td key={j} className="p-3">{cell}</td>)}</tr>)}</tbody></table></div></article> }
