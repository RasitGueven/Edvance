import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const ROLE_ROUTES: Record<string, string> = {
  student: '/student',
  parent: '/parent',
  coach: '/coach',
  admin: '/admin',
}

export function Login() {
  const { signIn, role, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already logged in → redirect
  if (!loading && role) {
    navigate(ROLE_ROUTES[role] ?? '/', { replace: true })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: err } = await signIn(email, password)
    setSubmitting(false)
    if (err) {
      setError('E-Mail oder Passwort falsch.')
      return
    }
    // role is updated via onAuthStateChange; navigate after next render
  }

  // Watch for role change after successful login
  if (!loading && role && !submitting) {
    navigate(ROLE_ROUTES[role] ?? '/', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div
            className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}
          >
            E
          </div>
          <CardTitle>Edvance</CardTitle>
          <CardDescription>Melde dich mit deinem Account an</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="mt-1 w-full" disabled={submitting}>
              {submitting ? 'Anmelden…' : 'Anmelden'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
