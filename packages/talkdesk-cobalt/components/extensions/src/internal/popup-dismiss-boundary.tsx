/** Dismiss only the innermost owned popup; preserve native controls and portalled focus. */
import React, { useLayoutEffect, useRef } from 'react';
type Reason = 'escape' | 'outside' | 'focus' | 'window';
type Boundary = {
  body: HTMLElement;
  trigger: HTMLElement | null;
  open: () => boolean;
  dismiss: (reason: Reason) => void;
};
const stacks = new WeakMap<Document, Boundary[]>();
interface Props {
  children: React.ReactNode;
  close: () => void;
  trigger?: () => HTMLElement | null | undefined;
  active?: boolean;
}
export function PopupDismissBoundary({ children, close, trigger, active = true }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const ownedEvents = useRef(new WeakSet<Event>());
  const latest = useRef({ close, trigger, active });
  latest.current = { close, trigger, active };
  useLayoutEffect(() => {
    const body = root.current;
    if (!body || !active) return;
    const doc = body.ownerDocument;
    const win = doc.defaultView;
    const previous = doc.activeElement as HTMLElement | null;
    const anchor = latest.current.trigger?.() ?? (previous !== doc.body ? previous : null);
    const stack = stacks.get(doc) ?? [];
    stacks.set(doc, stack);
    let dismissed = false;
    const entry: Boundary = {
      body,
      trigger: anchor,
      open: () =>
        !dismissed &&
        latest.current.active &&
        body.isConnected &&
        body.closest('[aria-expanded]')?.getAttribute('aria-expanded') !== 'false',
      dismiss: (reason) => {
        if (dismissed) return;
        dismissed = true;
        latest.current.close();
        if (reason === 'escape') {
          const restore = () => {
            const target = latest.current.trigger?.() ?? anchor;
            if (target?.isConnected && doc.hasFocus()) {
              // Native FakeInput is a div; make it programmatically focusable without a new Tab stop.
              if (target.getAttribute('role') === 'button' && !target.hasAttribute('tabindex'))
                target.tabIndex = -1;
              target.focus({ preventScroll: true });
            }
          };
          restore();
          // Legacy multi-select may replace its input during the close commit.
          win?.requestAnimationFrame(() => {
            if (
              doc.activeElement === doc.body ||
              doc.activeElement === anchor ||
              body.contains(doc.activeElement)
            )
              restore();
          });
        }
      },
    };
    stack.push(entry);
    // Legacy dropdowns retain content during exit; reopening must reactivate the same boundary.
    const visibility = body.closest('[aria-expanded]');
    const observer = new MutationObserver(() => {
      if (visibility?.getAttribute('aria-expanded') === 'true') dismissed = false;
    });
    if (visibility)
      observer.observe(visibility, { attributes: true, attributeFilter: ['aria-expanded'] });
    const top = () => [...stack].reverse().find((item) => item.open());
    const contains = (target: EventTarget | null) => {
      if (!(target instanceof (win?.Node ?? Node))) return false;
      const index = stack.indexOf(entry);
      return stack
        .slice(index)
        .some(
          (item) =>
            item.open() &&
            (item.body.contains(target as Node) || item.trigger?.contains(target as Node)),
        );
    };
    const keydown = (event: KeyboardEvent) => {
      // Legacy non-search dropdowns can open without moving focus from document.body.
      if (
        event.key !== 'Escape' ||
        top() !== entry ||
        (event.target !== doc.body && !contains(event.target))
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      entry.dismiss('escape');
    };
    const pointer = (event: PointerEvent) => {
      queueMicrotask(() => {
        if (entry.open() && !contains(event.target) && !ownedEvents.current.has(event))
          entry.dismiss('outside');
      });
    };
    const focus = (event: FocusEvent) => {
      queueMicrotask(() => {
        if (entry.open() && !contains(event.target) && !ownedEvents.current.has(event))
          entry.dismiss('focus');
      });
    };
    const blur = () => {
      if (entry.open()) entry.dismiss('window');
    };
    doc.addEventListener('keydown', keydown, true);
    doc.addEventListener('pointerdown', pointer, true);
    doc.addEventListener('focusin', focus, true);
    win?.addEventListener('blur', blur);
    return () => {
      dismissed = true;
      observer.disconnect();
      const index = stack.indexOf(entry);
      if (index >= 0) stack.splice(index, 1);
      doc.removeEventListener('keydown', keydown, true);
      doc.removeEventListener('pointerdown', pointer, true);
      doc.removeEventListener('focusin', focus, true);
      win?.removeEventListener('blur', blur);
    };
  }, [active]);
  return (
    <div
      ref={root}
      style={{ display: 'contents' }}
      onPointerDownCapture={(event) => {
        ownedEvents.current.add(event.nativeEvent);
      }}
      onFocusCapture={(event) => {
        ownedEvents.current.add(event.nativeEvent);
      }}
    >
      {children}
    </div>
  );
}
