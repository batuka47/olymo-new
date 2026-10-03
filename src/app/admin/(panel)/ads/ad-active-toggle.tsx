"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { t } from "@/lib/i18n";
import { setAdActive } from "./actions";

/** Turns an ad on or off from the list; the box flips at once and the list refreshes after. */
export function AdActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [shownActive, setShownActive] = useOptimistic(active);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  function toggle(next: boolean) {
    setError(undefined);
    startTransition(async () => {
      setShownActive(next);
      const result = await setAdActive(id, next);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <CheckboxField
        label={t("admin.ads.toggle")}
        checked={shownActive}
        onChange={(event) => toggle(event.target.checked)}
      />
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
