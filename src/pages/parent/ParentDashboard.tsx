import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'

export function ParentDashboard(): JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <EdvanceNavbar subtitle="Eltern-Dashboard" />
      <main className="flex items-center justify-center py-32">
        <p className="text-muted">Eltern-Bereich – coming soon</p>
      </main>
    </div>
  )
}
