import { type JSX } from 'react'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'

export function StudentDashboard(): JSX.Element {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg-app)]">
      <EdvanceNavbar subtitle="Mein Lernplan" />
      <main className="mx-auto max-w-3xl px-4 py-8" />
    </div>
  )
}
