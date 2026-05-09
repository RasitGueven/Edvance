import { useEffect, useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import { getClustersBySubject, getSubjects } from '@/lib/supabase/tasks'
import type { SkillCluster, Subject } from '@/types'

export function StudentDashboard(): JSX.Element {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [clusters, setClusters] = useState<SkillCluster[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getSubjects().then(({ data, error: e }) => {
      if (cancelled) return
      if (e) {
        setError(e)
        setLoading(false)
        return
      }
      const list = data ?? []
      setSubjects(list)
      if (list.length > 0) setSelectedSubjectId(list[0].id)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedSubjectId) return
    let cancelled = false
    setLoading(true)
    void getClustersBySubject(selectedSubjectId).then(({ data, error: e }) => {
      if (cancelled) return
      setLoading(false)
      if (e) {
        setError(e)
        return
      }
      setClusters(data ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [selectedSubjectId])

  return (
    <div className="min-h-screen bg-background">
      <EdvanceNavbar subtitle="Mein Lernplan" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground">Mein Lernplan</h1>
        <p className="mt-1 text-sm text-muted">
          Waehle ein Thema und starte mit Erklaeren, Ueben oder Testen.
        </p>

        {error && (
          <Card className="mt-6">
            <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {subjects.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {subjects.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={s.id === selectedSubjectId ? 'default' : 'outline'}
                onClick={() => setSelectedSubjectId(s.id)}
              >
                {s.name}
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-muted">Lade Themen …</p>
        ) : clusters.length === 0 ? (
          <Card className="mt-6">
            <CardContent className="pt-6 text-center text-sm text-muted">
              Noch keine Themen verfuegbar. Frag deinen Coach.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {clusters.map((c) => (
              <Link
                key={c.id}
                to={`/student/cluster/${c.id}`}
                className="group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex min-h-[72px] items-center gap-3 p-5">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                        color: 'var(--primary)',
                      }}
                    >
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted">
                        Klasse {c.class_level_min}
                        {c.class_level_min !== c.class_level_max && ` – ${c.class_level_max}`}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-primary" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
