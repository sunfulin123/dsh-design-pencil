/** Measure and constrain the table body without iframe resize feedback. */
import React from 'react';
export type TableLayoutMeasure = {
  bodyTop: number;
  wrapperBottom: number;
  paginationHeight: number;
};

const roundPx = (value: number) => Math.round(value);

export const getAvailableHeight = ({
  end,
  padding,
  paginationHeight,
  start,
}: {
  end: number;
  padding: number;
  paginationHeight: number;
  start: number;
}) => {
  const availableHeight = end - start - padding - paginationHeight;

  return availableHeight > 0 ? availableHeight : null;
};

export const getConstrainedHeight = (
  wrapperHeight: number | null,
  viewportHeight: number | null,
) => {
  if (wrapperHeight !== null && viewportHeight !== null) {
    return Math.min(wrapperHeight, viewportHeight);
  }

  return wrapperHeight ?? viewportHeight ?? 0;
};

export function useTableLayoutMeasure({
  wrapperRef,
  bodyRef,
  paginationRef,
  setLayoutMeasure,
}: {
  wrapperRef: React.MutableRefObject<HTMLDivElement | undefined>;
  bodyRef: React.MutableRefObject<HTMLDivElement | undefined>;
  paginationRef: React.MutableRefObject<HTMLDivElement | undefined>;
  setLayoutMeasure: React.Dispatch<React.SetStateAction<TableLayoutMeasure>>;
}) {
  const measure = React.useCallback(() => {
    const bodyTop = roundPx(bodyRef.current?.getBoundingClientRect()?.top ?? 0);

    const wrapperBottom = roundPx(wrapperRef.current?.getBoundingClientRect()?.bottom ?? 0);

    const paginationHeight = roundPx(paginationRef.current?.getBoundingClientRect()?.height ?? 0);

    setLayoutMeasure((prev) =>
      prev.bodyTop === bodyTop &&
      prev.wrapperBottom === wrapperBottom &&
      prev.paginationHeight === paginationHeight
        ? prev
        : { bodyTop, wrapperBottom, paginationHeight },
    );
  }, [bodyRef, paginationRef, setLayoutMeasure, wrapperRef]);

  React.useLayoutEffect(() => {
    // Re-measuring our own output after every render creates a feedback loop
    // when several full-height tables share an unconstrained parent.
    measure();
  }, [measure]);

  React.useLayoutEffect(() => {
    // Observe the host allocation, not the row content: row scrolling must not resize its iframe.
    const parent = wrapperRef.current?.parentElement;
    const bounded = parent && getComputedStyle(parent).overflow === 'hidden';
    const observer = bounded ? new ResizeObserver(measure) : null;
    if (parent && observer) observer.observe(parent);
    const inIframe = window.self !== window.top;
    if (bounded || !inIframe) window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, wrapperRef]);
}
