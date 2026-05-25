import { useEffect, useState } from 'react';
import { useSelection, type SelectionAnchor } from './useSelection';
import { Bubble } from './Bubble';
import { Card } from './Card';

/**
 * Top-level content-script app. Manages two visual layers:
 *   - bubble  : a tiny floating button on the latest selection
 *   - card    : the actual translation panel; opens on bubble click
 */
export function ContentApp() {
  const { anchor, clear } = useSelection();
  const [card, setCard] = useState<SelectionAnchor | null>(null);

  // Esc closes the card.
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCard(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [card]);

  // Alt+T translates current selection directly.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 't' || e.key === 'T') && anchor) {
        e.preventDefault();
        setCard(anchor);
        clear();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [anchor, clear]);

  return (
    <>
      {anchor && !card && (
        <Bubble
          anchor={anchor}
          onClick={() => {
            setCard(anchor);
            clear();
          }}
        />
      )}
      {card && <Card anchor={card} onClose={() => setCard(null)} />}
    </>
  );
}
