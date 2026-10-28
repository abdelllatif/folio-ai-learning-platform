/** Ruled index card that flips on click / Space. */
export function Flashcard({ card, flipped, onFlip }) {
  return (
    <div className={`flip ${flipped ? 'flipped' : ''}`} onClick={onFlip} role="button" tabIndex={0}
      aria-label={flipped ? 'Verso de la fiche. Cliquez pour revoir le recto.' : 'Recto de la fiche. Cliquez pour voir la réponse.'}
      onKeyDown={(e) => { if (e.key === 'Enter') onFlip() }}>
      <div className="flip__inner">
        <div className="flip__face index-card">
          <div className="flip__label"><span>Question</span>{card.page && <span>p. {card.page}</span>}</div>
          <div className="flip__text">{card.front}</div>
          <span className="tiny muted" style={{ textAlign: 'center' }}>Espace ou clic pour retourner</span>
        </div>
        <div className="flip__face flip__face--back index-card">
          <div className="flip__label"><span>Réponse</span>{card.page && <span>p. {card.page}</span>}</div>
          <div className="flip__text">{card.back}</div>
        </div>
      </div>
    </div>
  )
}
