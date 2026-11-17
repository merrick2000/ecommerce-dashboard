import { resetPasswordSchema } from '@zuri/shared'
import { LinkIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button, ButtonLink, Input } from '@/components/ui'
import { useResetPassword } from '@/hooks/auth'
import { ApiError, errorMessage } from '@/lib/api'
import { serverErrors, validate, type Errors } from '@/lib/form'
import { AuthLayout } from './AuthLayout'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const reset = useResetPassword()
  const token = params.get('token') ?? ''
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState<Errors>({})

  const invalid = !token || (reset.error instanceof ApiError && reset.error.code === 'reset_invalid')
  if (invalid)
    return (
      <AuthLayout title="Lien expiré">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-surface-2">
            <LinkIcon className="size-5 text-muted" />
          </div>
          <p className="text-sm text-muted">Ce lien n’est plus valable : il a déjà servi, ou il a plus de 30 minutes. Demandez-en un nouveau, ça prend quelques secondes.</p>
          <ButtonLink to="/forgot-password" variant="primary" className="mt-5 w-full">
            Recevoir un nouveau lien
          </ButtonLink>
        </div>
      </AuthLayout>
    )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = validate(resetPasswordSchema, { token, password: form.password })
    if (v.errors) return setErrors(v.errors)
    if (form.password !== form.confirm) return setErrors({ confirm: 'Les deux mots de passe ne sont pas identiques' })
    setErrors({})
    reset.mutate(v.data, {
      onSuccess: () => navigate('/', { replace: true }),
      onError: (err) => setErrors(serverErrors(err) ?? {}),
    })
  }

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe d’au moins 10 caractères. Vos autres appareils seront déconnectés."
      footer={
        <Link to="/login" className="font-medium text-accent hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Nouveau mot de passe" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} autoFocus />
        <Input label="Confirmer le mot de passe" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />
        {reset.error && !serverErrors(reset.error) && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage(reset.error)}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={reset.isPending}>
          Enregistrer et me connecter
        </Button>
      </form>
    </AuthLayout>
  )
}
