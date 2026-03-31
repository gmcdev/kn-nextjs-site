import { useCallback, useLayoutEffect, useRef } from 'react';

import fromElementRefOrSelector, {
  type ElementRefOrSelector,
} from '@/functions/fromElementRefOrSelector';

import useUpdatedRef from './useUpdatedRef';

type ObserverType = 'resize' | 'mutate' | 'both';

type ObserverOptions<Observed extends HTMLElement = HTMLElement> = {
  active?: boolean;
  mutationOptions?: MutationObserverInit;
  observed: ElementRefOrSelector<Observed> | null | undefined;
  type?: ObserverType;
};

type Observers = {
  mutationObserver?: MutationObserver;
  resizeObserver?: ResizeObserver;
};

type RegisterOptionsArgs<Observed extends HTMLElement = HTMLElement> = [
  observed: ElementRefOrSelector<Observed> | null | undefined,
  type: ObserverType,
  retry?: 'microtask' | 'timer',
];

const retryRegistration = <Observed extends HTMLElement = HTMLElement>(
  handler: (...args: RegisterOptionsArgs<Observed>) => void,
  ...[observed, type, retry]: RegisterOptionsArgs<Observed>
) => {
  switch (retry) {
    case 'microtask':
      queueMicrotask(() => {
        handler(observed, type, 'timer');
      });
      return;
    case 'timer':
      setTimeout(() => {
        handler(observed, type);
      }, 0);
      return;
    case undefined:
      return;
  }
};

const useObserverRegister = <Observed extends HTMLElement = HTMLElement>(
  observer: (observed: Observed) => void,
  options: ElementRefOrSelector<Observed> | ObserverOptions<Observed> | null | undefined,
) => {
  const {
    mutationOptions = { attributes: true, characterData: true, childList: true, subtree: true },
  } = options && typeof options === 'object' && 'observed' in options ? options : {};

  const observerRef = useUpdatedRef(observer);
  const mutationOptionsRef = useUpdatedRef(mutationOptions);
  const observers = useRef<Observers>({});

  const registerObservers = useCallback(
    (observedElement: Observed, type: ObserverType) => {
      observerRef.current(observedElement);

      const resizeObserver = new ResizeObserver(() => {
        observerRef.current(observedElement);
      });
      if (type === 'resize' || type === 'both') {
        observers.current.resizeObserver?.disconnect();
        resizeObserver.observe(observedElement);
        observers.current.resizeObserver = resizeObserver;
      }

      const mutationObserver = new MutationObserver(() => {
        observerRef.current(observedElement);
      });
      if (type === 'mutate' || type === 'both') {
        observers.current.mutationObserver?.disconnect();
        mutationObserver.observe(observedElement, mutationOptionsRef.current);
        observers.current.mutationObserver = mutationObserver;
      }
    },
    [mutationOptionsRef, observerRef],
  );

  const registerHandler = useCallback(
    (...[observed, type, retry]: RegisterOptionsArgs<Observed>) => {
      const observedElement = fromElementRefOrSelector(observed);
      if (!observedElement) {
        retryRegistration<Observed>(registerHandler, observed, type, retry);
        return;
      }
      registerObservers(observedElement, type);
    },
    [registerObservers],
  );

  return { observers, registerHandler };
};

const useResizeAndMutateObserver = <Observed extends HTMLElement = HTMLElement>(
  observer: (observed: Observed) => void,
  options: ElementRefOrSelector<Observed> | ObserverOptions<Observed> | null | undefined,
) => {
  const {
    active = true,
    observed,
    type = 'both',
  } = options && typeof options === 'object' && 'observed' in options
    ? options
    : { observed: options };

  const { observers, registerHandler } = useObserverRegister(observer, options);

  useLayoutEffect(() => {
    if (active) {
      registerHandler(observed, type, 'microtask');
      return () => {
        observers.current.resizeObserver?.disconnect();
        observers.current.mutationObserver?.disconnect();
      };
    }
  }, [active, observed, observers, registerHandler, type]);
};

export default useResizeAndMutateObserver;
