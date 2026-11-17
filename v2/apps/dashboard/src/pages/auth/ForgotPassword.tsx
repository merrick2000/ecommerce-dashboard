import { forgotPasswordSchema } from '@zuri/shared'
import { MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button, ButtonLink, Input } from '@/components/ui'
import { useForgotPassword } from '@/hooks/auth'
import { errorMessage } from '@/lib/api'
import { validate, type Errors } from '@/lib/form'
import { AuthLayout } from './AuthLayout'

export default function ForgotPassword() {
  const [params] = useSearchParams()
  const forgot = useForgotPassword()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [errors, setErrors] = useState<Errors>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = validate(forgotPasswordSchema, { email })
    if (v.errors) return setErrors(v.errors)
    setErrors({})
    forgot.mutate(v.data)
  }

  if (forgot.isSuccess)
    return (
      <AuthLayout title="Vérifiez vos emails">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-accent/10">
            <MailCheck className="size-5 text-accent" />
          </div>
          <p className="text-sm text-muted">
            Si un compte existe pour <strong className="text-fg">{email.trim().toLowerCase()}</strong>, vous allez recevoir un lien pour choisir un nouveau mot de passe. Il est valable 30 minutes.
          </p>
          <p className="mt-3 text-xs text-muted">Rien reçu après quelques minutes ? Regardez dans les spams, ou réessayez.</p>
          <ButtonLink to="/login" variant="primary" className="mt-5 w-full">
            Retour à la connexion
          </ButtonLink>
          <button type="button" onClick={() => forgot.reset()} className="mt-3 text-sm font-medium text-accent hover:underline">
            Renvoyer un lien
          </button>
        </div>
      </AuthLayout>
    )

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Entrez l’email de votre compte : nous vous envoyons un lien pour en choisir un nouveau."
      footer={
        <Link to="/login" className="font-medium text-accent hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoFocus />
        {forgot.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage(forgot.error)}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={forgot.isPending}>
          Envoyer le lien
        </Button>
      </form>
    </AuthLayout>
  )
}
