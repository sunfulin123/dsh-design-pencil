/** Non-modal review popover: native buttons/inputs, viewport clamping and keyboard dismissal. */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
export function ReviewDropdown({ id, label, trigger, children }: {
  id: string; label: string; trigger: ReactNode; children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 12, top: 56 });
  const close = () => { setOpen(false); button.current?.focus(); };
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = button.current!.getBoundingClientRect();
      const width = panel.current!.getBoundingClientRect().width;
      setPosition({ left: Math.max(12, Math.min(anchor.left, innerWidth - width - 12)), top: anchor.bottom + 8 });
    };
    place();
    panel.current?.querySelector<HTMLElement>('button, input')?.focus();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !button.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); button.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <>
    <button ref={button} type="button" className="review-trigger" aria-label={label}
      data-testid={`prototype-${id}`} aria-haspopup="dialog" aria-expanded={open}
      aria-describedby={`prototype-${id}-value`}
      aria-controls={open ? `prototype-${id}-panel` : undefined}
      onClick={() => setOpen(!open)}>{trigger}<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m4 6 4 4 4-4"/></svg></button>
    {open && <div ref={panel} id={`prototype-${id}-panel`} role="dialog" aria-label={label}
      data-testid={`prototype-${id}-panel`} className={`review-panel review-panel--${id}`} style={position}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== button.current) setOpen(false);
      }}>
      <header><strong>{label}</strong><button type="button" aria-label={`Close ${label}`} data-testid={`prototype-${id}-close`} onClick={close}>×</button></header>
      {children(close)}
    </div>}
  </>;
}
