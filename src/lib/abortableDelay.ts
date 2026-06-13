// A delay that can be cancelled. Resolves after `ms`, or rejects with a standard
// AbortError the moment `signal` fires — and always detaches its listener so
// nothing leaks. Same cancellation contract as `fetch`, so callers compose with
// AbortController the usual way. Shared by the simulated connection and the fake
// Jira adapter.
export function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
