'use client';

import { type HTMLAttributes, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import useResizeAndMutateObserver from '@/hooks/useResizeAndMutateObserver';

export type VirtualizedItemProps = Readonly<
  {
    canGetNextEntries?: boolean;
    element?: 'div' | 'li';
    initialHeight?: number;
    initialInView?: boolean;
    itemIndex?: number;
    onGetNextEntries?: () => void | Promise<void>;
    onInViewChange?: (itemIndex: number, inView: boolean) => void;
  } & Omit<HTMLAttributes<HTMLElement>, 'style'>
>;

const VirtualizedItem = forwardRef<HTMLDivElement | HTMLLIElement, VirtualizedItemProps>(
  (
    {
      canGetNextEntries,
      children,
      element,
      initialHeight = 0,
      initialInView = false,
      itemIndex,
      onGetNextEntries,
      onInViewChange,
      ...htmlProps
    },
    ref,
  ) => {
    const { inView, ref: containerRef } = useInView({ initialInView });
    useEffect(() => {
      if (itemIndex !== undefined && onInViewChange) {
        onInViewChange(itemIndex, inView);
      }
    }, [inView, itemIndex, onInViewChange]);

    const [containerHeight, setContainerHeight] = useState(initialHeight);
    const containerHeightRef = useRef(0);
    const contentRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(
      ref,
      () => contentRef.current?.parentElement as HTMLDivElement & HTMLLIElement,
    );

    useResizeAndMutateObserver<HTMLDivElement>(({ offsetHeight }) => {
      if (inView && offsetHeight !== undefined && offsetHeight !== containerHeightRef.current) {
        containerHeightRef.current = offsetHeight;
        setContainerHeight(offsetHeight);
      }
      if (canGetNextEntries && inView) {
        onGetNextEntries?.();
      }
    }, contentRef);

    const Tag = element ?? 'div';

    return (
      <Tag ref={containerRef} style={{ minHeight: containerHeight }} {...htmlProps}>
        <div ref={contentRef}>{inView ? children : null}</div>
      </Tag>
    );
  },
);

VirtualizedItem.displayName = 'VirtualizedItem';

export default VirtualizedItem;
