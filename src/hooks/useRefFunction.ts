import { useCallback } from 'react';

import useUpdatedRef from './useUpdatedRef';

type Handler<Args extends unknown[], Return> = (...args: Args) => Return;

function useRefFunction(fn: undefined): undefined;
function useRefFunction<Args extends unknown[], Return>(
  fn: Handler<Args, Return>,
): Handler<Args, Return>;
function useRefFunction<Args extends unknown[], Return>(
  fn: Handler<Args, Return> | undefined,
): Handler<Args, Return> | undefined;
function useRefFunction<Args extends unknown[], Return>(fn: Handler<Args, Return> | undefined) {
  const fnRef = useUpdatedRef(fn);
  const refFunction = useCallback((...args: Args) => fnRef.current?.(...args), [fnRef]);
  return fn ? (refFunction as (...args: Args) => Return) : undefined;
}

export default useRefFunction;
