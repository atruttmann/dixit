import type { FormEvent } from 'react'

type CluePanelProps = {
  clue: string
  onClueChange: (value: string) => void
  onSubmitClue: () => void
  canSubmit: boolean
  isStoryteller: boolean
  storytellerName: string
  phase: string
}

export function CluePanel({
  clue,
  onClueChange,
  onSubmitClue,
  canSubmit,
  isStoryteller,
  storytellerName,
  phase,
}: CluePanelProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmitClue()
  }

  if (!isStoryteller || phase !== 'story') {
    return (
      <section className="card-panel card-panel--muted">
        <div className="field-label">Clue</div>
        <p>{clue || `${storytellerName} is thinking of a clue...`}</p>
      </section>
    )
  }

  return (
    <section className="card-panel card-panel--muted">
      <div className="field-label">Your storyteller clue</div>
      <form onSubmit={handleSubmit} className="stack-gap">
        <input
          className="ghost-input"
          value={clue}
          onChange={(e) => onClueChange(e.target.value)}
          placeholder="Type a short phrase, quote, or word"
          maxLength={80}
        />
        <button type="submit" className="primary-button" disabled={!canSubmit}>
          Lock clue and card
        </button>
      </form>
    </section>
  )
}

