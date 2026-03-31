import { useLayoutEffect, useRef } from 'react';

const useUpdatedRef = <T>(value: T) => {
  const ref = useRef<T>(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
};

export default useUpdatedRef;
