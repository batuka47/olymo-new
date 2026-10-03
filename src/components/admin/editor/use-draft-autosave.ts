"use client";

import { useEffect, useRef } from "react";

const AUTOSAVE_INTERVAL_MS = 30_000;

/**
 * Every 30 seconds, calls `save` when `shouldSave` is true (a draft with unsaved, valid changes).
 * Reads the latest render through a ref, so the timer never restarts while the editor is open.
 */
export function useDraftAutosave(shouldSave: boolean, save: () => void) {
  const latest = useRef({ shouldSave, save });
  useEffect(() => {
    latest.current = { shouldSave, save };
  });
  useEffect(() => {
    const timer = setInterval(() => {
      if (latest.current.shouldSave) {
        latest.current.save();
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);
}
