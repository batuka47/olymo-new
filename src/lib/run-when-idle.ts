/**
 * Runs `task` once the page has loaded and the browser is idle, so background requests (such as
 * the view count) never compete with what the reader is waiting for. Returns a cancel function.
 */
export function runWhenIdle(task: () => void): () => void {
  let idleId: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(task, { timeout: 5000 });
    } else {
      // Safari has no requestIdleCallback.
      timer = setTimeout(task, 0);
    }
  };

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }

  return () => {
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    clearTimeout(timer);
  };
}
