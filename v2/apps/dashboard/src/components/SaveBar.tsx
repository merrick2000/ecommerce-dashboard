import { Button, cx } from './ui'

/**
 * Barre d'enregistrement qui suit le défilement (en bas de l'écran, alignée sur le contenu) :
 * on enregistre sans remonter en haut de la page.
 * - ordinateur : apparaît dès qu'il y a des modifications non enregistrées ;
 * - mobile : toujours visible, au-dessus de la navigation basse (le bouton du haut y est masqué).
 * À placer en DERNIER enfant du contenu de la page (position sticky).
 */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  label = 'Enregistrer',
  submit = false,
  alwaysOnMobile = true,
}: {
  dirty: boolean
  saving?: boolean
  onSave?: () => void
  onDiscard?: () => void
  label?: string
  /** true : bouton de type submit (dans un <form>), onSave facultatif. */
  submit?: boolean
  alwaysOnMobile?: boolean
}) {
  return (
    <div
      className={cx(
        'pointer-events-none sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mt-4 flex justify-center transition-all duration-200 lg:bottom-4',
        dirty ? 'translate-y-0 opacity-100' : alwaysOnMobile ? 'sm:pointer-events-none sm:translate-y-3 sm:opacity-0' : 'pointer-events-none translate-y-3 opacity-0',
      )}
      aria-hidden={!dirty && !alwaysOnMobile}
    >
      <div className={cx('pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-line bg-surface/95 p-2 pl-4 shadow-lg backdrop-blur sm:w-auto sm:min-w-[26rem]', !dirty && alwaysOnMobile && 'sm:pointer-events-none')}>
        <span className={cx('flex-1 text-sm', dirty ? 'font-medium' : 'text-muted')}>
          {dirty ? (
            <>
              <span className="mr-2 inline-block size-2 rounded-full bg-amber-500 align-middle" aria-hidden />
              <span className="sm:hidden">Non enregistré</span>
              <span className="hidden sm:inline">Modifications non enregistrées</span>
            </>
          ) : (
            'Tout est enregistré'
          )}
        </span>
        {dirty && onDiscard && (
          <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
            Annuler
          </Button>
        )}
        <Button type={submit ? 'submit' : 'button'} variant="primary" onClick={submit ? undefined : onSave} loading={saving} disabled={!dirty && !saving}>
          {label}
        </Button>
      </div>
      <span className="sr-only" aria-live="polite">
        {dirty ? 'Modifications non enregistrées' : ''}
      </span>
    </div>
  )
}
