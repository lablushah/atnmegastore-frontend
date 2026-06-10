import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click',
] as const;

/**
 * Calls `onTimeout` after `timeoutMs` of no user activity.
 * Also fires immediately when the tab becomes visible again if the idle
 * period has already elapsed (handles browsers throttling background timers).
 */
export function useIdleTimeout(
  onTimeout: () => void,
  timeoutMs: number,
  active = true,
) {
  const callbackRef    = useRef(onTimeout);
  callbackRef.current  = onTimeout;
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!active) return;

    let timer: ReturnType<typeof setTimeout>;

    function reset() {
      lastActivityRef.current = Date.now();
      clearTimeout(timer);
      timer = setTimeout(() => callbackRef.current(), timeoutMs);
    }

    function onVisibilityChange() {
      if (document.hidden) return;
      // Tab just became visible — fire immediately if idle period has passed
      if (Date.now() - lastActivityRef.current >= timeoutMs) {
        callbackRef.current();
      } else {
        reset();
      }
    }

    reset();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }));
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, reset));
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [timeoutMs, active]);
}
