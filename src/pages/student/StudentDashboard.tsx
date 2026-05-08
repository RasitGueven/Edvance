import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'

export function StudentDashboard(): JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <EdvanceNavbar subtitle="Schüler-Dashboard" />
      <main className="flex items-center justify-center py-32">
        <p className="text-muted">Schüler-Bereich – coming soon</p>
      </main>
    </div>
  )
}
