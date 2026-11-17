import { registerSchema } from '@zuri/shared'
import { Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { Button, ButtonLink, Input } from '@/components/ui'
import { useMe, useRegister } from '@/hooks/auth'
import { ApiError, errorMessage } from '@/lib/api'
import { serverErrors, validate, type Errors } from '@/lib/form'
import { AuthLayout } from './AuthLayout'

export default function Register() {
  const navigate = useNavigate()
  const { data: me } = useMe()
  const register = useRegister()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [errors, setErrors] = useState<Errors>({})

  if (me) return <Navigate to="/" replace />

  const closed = register.error instanceof ApiError && register.error.code === 'registration_closed'
  if (closed)
    return (
      <AuthLayout title="Inscriptions fermées">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-surface-2">
            <Lock className="size-5 text-muted" />
          </div>
          <p className="text-sm text-muted">{register.error?.message}. Le compte principal existe déjà : connectez-vous avec ses identifiants.</p>
          <ButtonLink to="/login" variant="primary" className="mt-5 w-full">
            Aller à la connexion
          </ButtonLink>
        </div>
      </AuthLayout>
    )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const payload = { ...form, phone: form.phone.trim() || undefined }
    const v = validate(registerSchema, payload)
    if (v.errors) return setErrors(v.errors)
    setErrors({})
    register.mutate(v.data, {
      onSuccess: () => navigate('/onboarding', { replace: true }),
      onError: (err) => setErrors(serverErrors(err) ?? {}),
    })
  }

  return (
    <AuthLayout
      title="Créer le compte"
      subtitle="Réservé au premier compte de la plateforme."
      footer={
        <>
          Déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Nom complet" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoFocus />
        <Input label="Email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
        <Input label="Téléphone" optional type="tel" autoComplete="tel" inputMode="tel" placeholder="+229 97 00 00 00" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />
        <Input label="Mot de passe" type="password" autoComplete="new-password" hint="10 caractères minimum." value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
        {register.error && !serverErrors(register.error) && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage(register.error)}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={register.isPending}>
          Créer mon compte
        </Button>
      </form>
    </AuthLayout>
  )
}
