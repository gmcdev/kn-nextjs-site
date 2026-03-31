import type { RefObject } from 'react';

export type ElementRefOrSelector<NormalizedElement extends HTMLElement = HTMLElement> =
  | RefObject<NormalizedElement | null | undefined>
  | NormalizedElement
  | string;

const fromElementRefOrSelector = <NormalizedElement extends HTMLElement = HTMLElement>(
  elementRefOrSelector: ElementRefOrSelector<NormalizedElement> | null | undefined,
): NormalizedElement | null => {
  if (!elementRefOrSelector) {
    return null;
  }
  if (typeof elementRefOrSelector === 'string') {
    return document.querySelector<NormalizedElement>(elementRefOrSelector);
  }
  if (elementRefOrSelector instanceof HTMLElement) {
    return elementRefOrSelector as NormalizedElement;
  }
  return elementRefOrSelector.current ?? null;
};

export default fromElementRefOrSelector;
