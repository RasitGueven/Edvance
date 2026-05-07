import { Button } from '@/components/ui/button'

export function Home() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-3">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}
          aria-hidden
        >
          E
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Edvance</h1>
        <p className="text-sm text-muted">Hybride Lernakademie</p>
      </div>

      <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
        <Button size="lg">Als Schüler einloggen</Button>
        <Button size="lg" variant="secondary">
          Als Elternteil einloggen
        </Button>
        <Button size="lg" variant="outline">
          Als Coach einloggen
        </Button>
      </div>
    </main>
  )
}
