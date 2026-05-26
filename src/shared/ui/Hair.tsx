import { cn } from './cn';

export interface HairProps {
  /** Optional ornament text rendered in the middle (e.g. "·" or "变 体"). */
  ornament?: React.ReactNode;
  className?: string;
}

/** 1px horizontal rule. With `ornament`, the rule is split around a label. */
export function Hair({ ornament, className }: HairProps) {
  if (!ornament) {
    return <div className={cn('h-px bg-ink-hair', className)} />;
  }
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex-1 h-px bg-ink-hair" />
      <span className="text-[11px] text-ink-mute">{ornament}</span>
      <div className="flex-1 h-px bg-ink-hair" />
    </div>
  );
}
