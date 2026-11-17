import { loginSchema } from '@zuri/shared'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Button, Input } from '@/components/ui'
import { useLogin, useMe } from '@/hooks/auth'
import { errorMessage } from '@/lib/api'
import { validate, type Errors } from '@/lib/form'
import { AuthLayout } from './AuthLayout'

/** N'accepte que des chemins internes pour ?next= (pas de redirection ouverte). */
const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/')

export default function Login() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { data: me } = useMe()
  const login = useLogin()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const next = safeNext(params.get('next'))

  if (me) return <Navigate to={next} replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = validate(loginSchema, form)
    if (v.errors) return setErrors(v.errors)
    setErrors({})
    login.mutate(v.data, { onSuccess: () => navigate(next, { replace: true }) })
  }

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Accédez à votre espace vendeur."
      footer={
        <>
          Première utilisation ?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Créer le compte
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} autoFocus />
        <Input label="Mot de passe" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
        {login.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage(login.error)}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={login.isPending}>
          Se connecter
        </Button>
      </form>
    </AuthLayout>
  )
}
