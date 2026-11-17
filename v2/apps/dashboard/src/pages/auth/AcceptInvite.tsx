import { inviteRegisterSchema, ROLE_DESCRIPTIONS, ROLE_LABELS, type Me } from '@zuri/shared'
import { AlertTriangle, CheckCircle2, Clock, UserPlus } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { FullPageSpinner } from '@/components/layout/Guards'
import { Button, ButtonLink, Input } from '@/components/ui'
import { useLogout, useMe } from '@/hooks/auth'
import { useAcceptInvitation, useInvitationPreview, useRegisterWithInvite } from '@/hooks/team'
import { errorMessage } from '@/lib/api'
import { serverErrors, validate, type Errors } from '@/lib/form'
import { AuthLayout } from './AuthLayout'
import { GOOGLE_ERRORS, useAuthProviders } from './GoogleButton'

/** Boutique rejointe : la plus récente de la liste n'est pas garantie, on cherche par nom. */
function joinedStoreId(me: Me, storeId: string) {
  return me.stores.find((s) => s.id === storeId)?.id ?? me.stores[0]?.id ?? null
}

function Notice({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <AuthLayout title={title}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">{icon}</div>
        {children}
      </div>
    </AuthLayout>
  )
}

function GoogleInviteButton({ href }: { href: string }) {
  const { data } = useAuthProviders()
  if (!data?.google) return null
  return (
    <>
      <a
        href={href}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 text-sm font-medium transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        Continuer avec Google
      </a>
      <div className="flex items-center gap-3 text-xs text-muted" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  )
}

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const googleError = GOOGLE_ERRORS[params.get('error') ?? '']
  const me = useMe()
  const preview = useInvitationPreview(token)
  const accept = useAcceptInvitation()
  const register = useRegisterWithInvite()
  const logout = useLogout()
  const [form, setForm] = useState({ name: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})

  const here = `/invite?token=${encodeURIComponent(token)}`
  const googleHref = `/api/auth/google/start?next=${encodeURIComponent(here)}&invite=${encodeURIComponent(token)}`

  if (!token || token.length < 20 || preview.isError)
    return (
      <Notice icon={<AlertTriangle className="size-5" />} title="Invitation introuvable">
        <p className="text-sm text-muted">Ce lien d’invitation n’est pas valable. Demandez à la personne qui vous a invité de vous en renvoyer un.</p>
        <ButtonLink to="/login" variant="primary" className="mt-5 w-full">
          Aller à la connexion
        </ButtonLink>
      </Notice>
    )

  if (preview.isPending || me.isPending) return <FullPageSpinner />
  const inv = preview.data
  const user = me.data

  const goToStore = (m: Me) => {
    const id = joinedStoreId(m, inv.storeId)
    navigate(id ? `/stores/${id}` : '/', { replace: true })
  }

  if (inv.accepted)
    return (
      <Notice icon={<CheckCircle2 className="size-5" />} title="Invitation déjà utilisée">
        <p className="text-sm text-muted">Cette invitation a déjà été acceptée. Connectez-vous pour accéder à {inv.storeName}.</p>
        <ButtonLink to={user ? '/' : '/login'} variant="primary" className="mt-5 w-full">
          {user ? 'Ouvrir mon espace' : 'Se connecter'}
        </ButtonLink>
      </Notice>
    )

  if (inv.expired)
    return (
      <Notice icon={<Clock className="size-5" />} title="Invitation expirée">
        <p className="text-sm text-muted">Cette invitation à rejoindre {inv.storeName} a expiré. Demandez-en une nouvelle{inv.inviterName ? ` à ${inv.inviterName}` : ''}.</p>
      </Notice>
    )

  const intro = (
    <div className="mb-5 rounded-xl bg-accent-soft p-4">
      <p className="text-sm">
        <strong>{inv.inviterName ?? 'Le propriétaire'}</strong> vous invite à rejoindre <strong>{inv.storeName}</strong> en tant que <strong>{ROLE_LABELS[inv.role]}</strong>.
      </p>
      <p className="mt-1 text-[13px] text-muted">{ROLE_DESCRIPTIONS[inv.role]}</p>
    </div>
  )
  const errorBox = (err: unknown) =>
    err ? (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
        {errorMessage(err)}
      </p>
    ) : null

  // Connecté : rejoindre avec ce compte.
  if (user) {
    const mismatch = user.email.toLowerCase() !== inv.email.toLowerCase()
    return (
      <AuthLayout title="Rejoindre l’équipe">
        {intro}
        {mismatch && (
          <p className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              L’invitation a été envoyée à <strong>{inv.email}</strong>, mais vous êtes connecté avec <strong>{user.email}</strong>. Vous pouvez la rejoindre avec ce compte, ou vous déconnecter pour utiliser le bon.
            </span>
          </p>
        )}
        <div className="space-y-3">
          {errorBox(accept.error)}
          <Button variant="primary" size="lg" className="w-full" loading={accept.isPending} onClick={() => accept.mutate(token, { onSuccess: goToStore })}>
            <UserPlus className="size-4" /> Rejoindre {inv.storeName}
          </Button>
          {mismatch && (
            <Button className="w-full" loading={logout.isPending} onClick={() => logout.mutate()}>
              Me déconnecter
            </Button>
          )}
        </div>
      </AuthLayout>
    )
  }

  // Compte existant non connecté : se connecter puis revenir ici.
  if (inv.hasAccount)
    return (
      <AuthLayout title="Rejoindre l’équipe">
        {intro}
        <div className="space-y-4">
          {googleError && errorBox(new Error(googleError))}
          <p className="text-sm text-muted">
            Un compte existe déjà pour <strong className="text-fg">{inv.email}</strong>. Connectez-vous pour accepter l’invitation.
          </p>
          <GoogleInviteButton href={googleHref} />
          <ButtonLink to={`/login?next=${encodeURIComponent(here)}`} variant="primary" size="lg" className="w-full">
            Se connecter avec mon mot de passe
          </ButtonLink>
        </div>
      </AuthLayout>
    )

  // Pas de compte : création avec l'email de l'invitation.
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = validate(inviteRegisterSchema, { token, ...form })
    if (v.errors) return setErrors(v.errors)
    setErrors({})
    register.mutate(v.data, { onSuccess: goToStore, onError: (err) => setErrors(serverErrors(err) ?? {}) })
  }

  return (
    <AuthLayout title="Créer votre compte">
      {intro}
      <form onSubmit={submit} className="space-y-4" noValidate>
        {googleError && errorBox(new Error(googleError))}
        <GoogleInviteButton href={googleHref} />
        <Input label="Email" type="email" value={inv.email} readOnly disabled hint="L’adresse à laquelle l’invitation a été envoyée." />
        <Input label="Votre nom" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoFocus />
        <Input label="Mot de passe" type="password" autoComplete="new-password" hint="10 caractères minimum" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
        {register.error && !serverErrors(register.error) && errorBox(register.error)}
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={register.isPending}>
          Créer mon compte et rejoindre
        </Button>
      </form>
    </AuthLayout>
  )
}
