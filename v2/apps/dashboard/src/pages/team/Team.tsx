import {
  canGrantRole,
  FULL_SCOPE_ROLES,
  invitationCreateSchema,
  memberUpdateSchema,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  STORE_ROLES,
  type MemberOptions,
  type StoreRole,
  type TeamInvitation,
  type TeamMember,
} from '@zuri/shared'
import { Check, Copy, Crown, Lock, Mail, MoreVertical, Pencil, RefreshCw, Search, Trash2, UserPlus, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog, Dialog, useDialogState } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, Checkbox, cx, EmptyState, ErrorState, Input, ListSkeleton, PageHeader, Segmented } from '@/components/ui'
import { useCan, useCurrentStore } from '@/hooks/auth'
import { useProducts } from '@/hooks/resources'
import { useInviteMember, useRemoveMember, useResendInvitation, useRevokeInvitation, useTeam, useUpdateMember } from '@/hooks/team'
import { errorMessage } from '@/lib/api'
import { date, relative } from '@/lib/format'
import { serverErrors, validate, type Errors } from '@/lib/form'

/** Case à cocher avec libellé visible (le Checkbox de base n'a qu'un aria-label). */
function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <Checkbox checked={checked} onChange={onChange} label={label} />
      <span>{label}</span>
    </label>
  )
}

const DEFAULT_OPTIONS: MemberOptions = { viewRevenue: false, exportData: false }

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) return <img src={url} alt="" className="size-10 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
  return <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{initials(name) || '?'}</span>
}

function scopeLabel(productIds: string[] | null, role: StoreRole) {
  if (FULL_SCOPE_ROLES.includes(role) || productIds === null) return 'Tous les produits'
  return productIds.length === 1 ? '1 produit' : `${productIds.length} produits`
}

function OptionBadges({ options, role }: { options: MemberOptions; role: StoreRole }) {
  if (FULL_SCOPE_ROLES.includes(role)) return null
  return (
    <>
      {options.viewRevenue && <Badge tone="green">Voit le CA</Badge>}
      {options.exportData && <Badge tone="blue">Export</Badge>}
    </>
  )
}

export function CopyLink({ url, compact }: { url: string; compact?: boolean }) {
  const [done, setDone] = useState(false)
  const toast = useToast()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setDone(true)
      setTimeout(() => setDone(false), 1500)
    } catch {
      toast.error('Copie impossible : sélectionnez le lien manuellement')
    }
  }
  if (compact)
    return (
      <Button size="sm" variant="ghost" onClick={copy} aria-label="Copier le lien d’invitation">
        {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      </Button>
    )
  return (
    <div className="flex gap-2">
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="h-10 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface-2 px-3 text-sm" aria-label="Lien d’invitation" />
      <Button onClick={copy}>
        {done ? <Check className="size-4" /> : <Copy className="size-4" />} {done ? 'Copié' : 'Copier'}
      </Button>
    </div>
  )
}

// ─── Formulaire membre (invitation ou modification) ─────────────────────────

interface MemberForm {
  email: string
  role: Exclude<StoreRole, 'owner'>
  scope: 'all' | 'some'
  productIds: string[]
  options: MemberOptions
}

function ProductPicker({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error?: string }) {
  const { data, isPending } = useProducts()
  const [q, setQ] = useState('')
  const list = useMemo(() => (data ?? []).filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())), [data, q])
  if (isPending) return <ListSkeleton rows={3} />
  if (!data?.length) return <p className="text-sm text-muted">Aucun produit dans la boutique pour l’instant.</p>
  const toggle = (id: string, on: boolean) => onChange(on ? [...value, id] : value.filter((x) => x !== id))
  return (
    <div>
      {data.length > 6 && (
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute top-1/2 left-3 z-[1] size-4 -translate-y-1/2 text-subtle" />
          <Input type="search" placeholder="Rechercher un produit" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" aria-label="Rechercher un produit" />
        </div>
      )}
      <ul className="max-h-56 divide-y divide-line overflow-y-auto rounded-lg border border-line">
        {list.map((p) => (
          <li key={p.id} className="px-3 py-2">
            <CheckRow checked={value.includes(p.id)} onChange={(on) => toggle(p.id, on)} label={`${p.name}${p.isActive ? '' : ' (inactif)'}`} />
          </li>
        ))}
        {!list.length && <li className="px-3 py-3 text-sm text-muted">Aucun produit ne correspond.</li>}
      </ul>
      <p className={cx('mt-1.5 text-[12.5px]', error ? 'text-red-600 dark:text-red-400' : 'text-muted')}>{error ?? `${value.length} produit${value.length > 1 ? 's' : ''} sélectionné${value.length > 1 ? 's' : ''}`}</p>
    </div>
  )
}

function MemberDialog({ mode, member, open, onClose }: { mode: 'invite' | 'edit'; member?: TeamMember; open: boolean; onClose: () => void }) {
  const { role: myRole } = useCurrentStore()
  const toast = useToast()
  const invite = useInviteMember()
  const update = useUpdateMember()
  const grantable = STORE_ROLES.filter((r): r is MemberForm['role'] => r !== 'owner' && !!myRole && canGrantRole(myRole, r))
  const initial = (): MemberForm => ({
    email: '',
    role: (member?.role && member.role !== 'owner' ? member.role : grantable.includes('closer') ? 'closer' : grantable[0]) ?? 'closer',
    scope: member?.productIds ? 'some' : 'all',
    productIds: member?.productIds ?? [],
    options: member?.options ?? DEFAULT_OPTIONS,
  })
  const [form, setForm] = useState<MemberForm>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [openKey, setOpenKey] = useState(open)
  // Réinitialise le formulaire à chaque ouverture.
  if (open !== openKey) {
    setOpenKey(open)
    if (open) {
      setForm(initial())
      setErrors({})
      setInviteUrl(null)
      invite.reset()
      update.reset()
    }
  }

  const fullScope = FULL_SCOPE_ROLES.includes(form.role)
  const set = (patch: Partial<MemberForm>) => setForm((f) => ({ ...f, ...patch }))
  const pending = invite.isPending || update.isPending
  const error = invite.error ?? update.error

  const submit = () => {
    const productIds = fullScope || form.scope === 'all' ? null : form.productIds
    if (productIds && productIds.length === 0) return setErrors({ productIds: 'Choisissez au moins un produit, ou « Tous les produits ».' })
    const access = { role: form.role, productIds, options: fullScope ? DEFAULT_OPTIONS : form.options }
    if (mode === 'invite') {
      const v = validate(invitationCreateSchema, { email: form.email, ...access })
      if (v.errors) return setErrors(v.errors)
      setErrors({})
      invite.mutate(v.data, {
        onSuccess: (r) => {
          setInviteUrl(r.inviteUrl)
          toast.success(`Invitation envoyée à ${r.invitation.email}`)
        },
        onError: (e) => setErrors(serverErrors(e) ?? {}),
      })
    } else if (member) {
      const v = validate(memberUpdateSchema, access)
      if (v.errors) return setErrors(v.errors)
      setErrors({})
      update.mutate(
        { userId: member.userId, ...v.data },
        {
          onSuccess: () => {
            toast.success('Accès mis à jour')
            onClose()
          },
          onError: (e) => setErrors(serverErrors(e) ?? {}),
        },
      )
    }
  }

  if (inviteUrl)
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Invitation envoyée"
        footer={
          <Button variant="primary" onClick={onClose}>
            Terminé
          </Button>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Un email a été envoyé à <strong className="text-fg">{form.email.trim().toLowerCase()}</strong>. Vous pouvez aussi lui envoyer ce lien directement (WhatsApp, SMS). Il est valable 7 jours.
          </p>
          <CopyLink url={inviteUrl} />
        </div>
      </Dialog>
    )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={mode === 'invite' ? 'Inviter un membre' : `Accès de ${member?.name ?? ''}`}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={submit} loading={pending}>
            {mode === 'invite' ? 'Envoyer l’invitation' : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {mode === 'invite' && <Input label="Email" type="email" inputMode="email" autoComplete="off" value={form.email} onChange={(e) => set({ email: e.target.value })} error={errors.email} autoFocus />}

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Rôle</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {grantable.map((r) => (
              <label
                key={r}
                className={cx(
                  'flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors',
                  form.role === r ? 'border-accent bg-accent-soft ring-1 ring-accent' : 'border-line hover:border-line-strong',
                )}
              >
                <input type="radio" name="role" className="mt-1 accent-[var(--accent)]" checked={form.role === r} onChange={() => set({ role: r })} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{ROLE_LABELS[r]}</span>
                  <span className="mt-0.5 block text-[12.5px] text-muted">{ROLE_DESCRIPTIONS[r]}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.role && <p className="mt-1.5 text-[12.5px] text-red-600 dark:text-red-400">{errors.role}</p>}
        </fieldset>

        {!fullScope && (
          <fieldset>
            <legend className="mb-1 text-sm font-medium">Produits accessibles</legend>
            <p className="mb-2 text-[12.5px] text-muted">Le membre ne voit que les commandes, clients et notifications de ces produits.</p>
            <Segmented
              label="Périmètre"
              value={form.scope}
              onChange={(scope) => set({ scope })}
              options={[
                { value: 'all', label: 'Tous les produits' },
                { value: 'some', label: 'Certains produits' },
              ]}
            />
            {form.scope === 'some' && (
              <div className="mt-3">
                <ProductPicker value={form.productIds} onChange={(productIds) => set({ productIds })} error={errors.productIds} />
              </div>
            )}
          </fieldset>
        )}

        {!fullScope && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Options</legend>
            <div className="space-y-2.5">
              <CheckRow checked={form.options.viewRevenue} onChange={(viewRevenue) => set({ options: { ...form.options, viewRevenue } })} label="Voir le chiffre d’affaires et les montants encaissés" />
              <CheckRow checked={form.options.exportData} onChange={(exportData) => set({ options: { ...form.options, exportData } })} label="Exporter les commandes (CSV)" />
            </div>
          </fieldset>
        )}

        {fullScope && <p className="rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-muted">Un administrateur voit toute la boutique : tous les produits, le chiffre d’affaires et l’export.</p>}

        {error && !serverErrors(error) && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage(error)}
          </p>
        )}
      </div>
    </Dialog>
  )
}

// ─── Lignes ──────────────────────────────────────────────────────────────────

function MemberRow({ m, isMe, onEdit, onRemove }: { m: TeamMember; isMe: boolean; onEdit: () => void; onRemove: () => void }) {
  const { role: myRole } = useCurrentStore()
  const editable = m.role !== 'owner' && !isMe && !!myRole && canGrantRole(myRole, m.role)
  const [menu, setMenu] = useState(false)
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <Avatar name={m.name} url={m.avatarUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-medium">{m.name}</p>
          {isMe && <span className="text-[12px] text-subtle">(vous)</span>}
          <Badge tone={m.role === 'owner' ? 'amber' : m.role === 'admin' ? 'violet' : 'neutral'}>
            {m.role === 'owner' && <Crown className="size-3" />}
            {ROLE_LABELS[m.role]}
          </Badge>
        </div>
        <p className="truncate text-[13px] text-muted">{m.email}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-subtle">
          <Badge>{scopeLabel(m.productIds, m.role)}</Badge>
          <OptionBadges options={m.options} role={m.role} />
          {m.openOrders > 0 && <Badge tone="orange">{m.openOrders} commande{m.openOrders > 1 ? 's' : ''} en cours</Badge>}
          <span>{m.lastLoginAt ? `Vu ${relative(m.lastLoginAt)}` : 'Jamais connecté'}</span>
        </div>
      </div>
      {editable ? (
        <div className="relative">
          <Button variant="ghost" size="icon" aria-label={`Actions pour ${m.name}`} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
            <MoreVertical className="size-4" />
          </Button>
          {menu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} aria-hidden />
              <div role="menu" className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-xl">
                <button
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-surface-2"
                  onClick={() => {
                    setMenu(false)
                    onEdit()
                  }}
                >
                  <Pencil className="size-4" /> Modifier l’accès
                </button>
                <button
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-surface-2 dark:text-red-400"
                  onClick={() => {
                    setMenu(false)
                    onRemove()
                  }}
                >
                  <Trash2 className="size-4" /> Retirer de l’équipe
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        m.role === 'owner' && <Lock className="mt-2 size-4 text-subtle" aria-label="Non modifiable" />
      )}
    </li>
  )
}

function InvitationRow({ inv, onRevoke }: { inv: TeamInvitation; onRevoke: () => void }) {
  const toast = useToast()
  const resend = useResendInvitation()
  const [url, setUrl] = useState<string | null>(null)
  const expired = new Date(inv.expiresAt).getTime() < Date.now()
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
          <Mail className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{inv.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-subtle">
            <Badge>{ROLE_LABELS[inv.role]}</Badge>
            <Badge>{scopeLabel(inv.productIds, inv.role)}</Badge>
            <OptionBadges options={inv.options} role={inv.role} />
            {expired ? <Badge tone="red">Expirée</Badge> : <span>Expire le {date(inv.expiresAt)}</span>}
            {inv.invitedBy && <span>· par {inv.invitedBy}</span>}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="sm"
            variant="ghost"
            loading={resend.isPending}
            aria-label="Renvoyer l’invitation"
            onClick={() =>
              resend.mutate(inv.id, {
                onSuccess: (r) => {
                  setUrl(r.inviteUrl)
                  toast.success(`Invitation renvoyée à ${inv.email}`)
                },
                onError: (e) => toast.error(e),
              })
            }
          >
            {!resend.isPending && <RefreshCw className="size-4" />}
            <span className="hidden sm:inline">Renvoyer</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={onRevoke} aria-label="Annuler l’invitation">
            <X className="size-4" />
          </Button>
        </div>
      </div>
      {url && (
        <div className="mt-2 pl-13">
          <CopyLink url={url} />
        </div>
      )}
    </li>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Team() {
  const { me } = useCurrentStore()
  const can = useCan('team.manage')
  const toast = useToast()
  const { data, error, isPending, refetch } = useTeam()
  const remove = useRemoveMember()
  const revoke = useRevokeInvitation()
  const [inviteOpen, setInviteOpen] = useState(false)
  const editing = useDialogState<TeamMember>()
  const removing = useDialogState<TeamMember>()
  const revoking = useDialogState<TeamInvitation>()

  if (!can) return <EmptyState icon={<Lock className="size-5" />} title="Accès réservé" description="Seuls le propriétaire et les administrateurs gèrent l’équipe." />

  const members = data?.members ?? []
  const invitations = data?.invitations ?? []

  return (
    <>
      <PageHeader
        title="Équipe"
        description="Invitez vos closers et gestionnaires, choisissez ce qu’ils voient."
        actions={
          <Button variant="primary" onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" /> Inviter
          </Button>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <ListSkeleton rows={4} />
      ) : (
        <div className="max-w-3xl space-y-4">
          <Card title={`Membres (${members.length})`}>
            {members.length <= 1 && (
              <div className="mb-4 rounded-lg bg-surface-2 p-3 text-sm text-muted">
                <p className="flex items-center gap-2 font-medium text-fg">
                  <Users className="size-4" /> Vous êtes seul pour l’instant
                </p>
                <p className="mt-1">Invitez un closer : il verra les commandes de ses produits, pourra les prendre en charge et appeler les clients. Vous suivez tout dans l’Activité.</p>
              </div>
            )}
            <ul className="divide-y divide-line">
              {members.map((m) => (
                <MemberRow key={m.userId} m={m} isMe={m.userId === me?.id} onEdit={() => editing.show(m)} onRemove={() => removing.show(m)} />
              ))}
            </ul>
          </Card>

          {invitations.length > 0 && (
            <Card title={`Invitations en attente (${invitations.length})`}>
              <ul className="divide-y divide-line">
                {invitations.map((inv) => (
                  <InvitationRow key={inv.id} inv={inv} onRevoke={() => revoking.show(inv)} />
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      <MemberDialog mode="invite" open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <MemberDialog mode="edit" member={editing.value ?? undefined} open={editing.open} onClose={editing.close} />

      <ConfirmDialog
        open={removing.open}
        onClose={removing.close}
        danger
        title={`Retirer ${removing.value?.name ?? ''} ?`}
        message={
          removing.value?.openOrders
            ? `Il perd l’accès à la boutique immédiatement. Ses ${removing.value.openOrders} commande(s) en cours redeviennent libres pour le reste de l’équipe.`
            : 'Il perd l’accès à la boutique immédiatement. Son historique reste visible dans l’Activité.'
        }
        confirmLabel="Retirer"
        loading={remove.isPending}
        onConfirm={() =>
          removing.value &&
          remove.mutate(removing.value.userId, {
            onSuccess: () => {
              toast.success('Membre retiré')
              removing.close()
            },
            onError: (e) => toast.error(e),
          })
        }
      />
      <ConfirmDialog
        open={revoking.open}
        onClose={revoking.close}
        danger
        title="Annuler l’invitation ?"
        message={`Le lien envoyé à ${revoking.value?.email ?? ''} ne fonctionnera plus.`}
        confirmLabel="Oui, annuler"
        loading={revoke.isPending}
        onConfirm={() =>
          revoking.value &&
          revoke.mutate(revoking.value.id, {
            onSuccess: () => {
              toast.success('Invitation annulée')
              revoking.close()
            },
            onError: (e) => toast.error(e),
          })
        }
      />
    </>
  )
}
