import { useEffect, useState } from 'react';
import { useSelection, type SelectionAnchor } from './useSelection';
import { Bubble } from './Bubble';
import { Card } from './Card';
import { Fab } from './Fab';

/**
 * Top-level content-script app. Three visual layers:
 *   - fab     : persistent floating ball on the page edge for page-level
 *               actions (translate全文 / 翻译段落). Always visible unless
 *               the user dismisses it for the tab.
 *   - bubble  : small button next to a fresh text selection
 *   - card    : full translation panel opened by clicking the bubble
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
      <Fab />
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
