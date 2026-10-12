"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage, type FormState } from "@/components/ui/form-message";
import { t } from "@/lib/i18n";
import { refreshSite } from "./actions";

/** "Сайтыг шинэчлэх": rebuilds the home, category and article pages after changes elsewhere. */
export function RefreshSiteButton() {
  const [state, setState] = useState<FormState>({});
  const [pending, startRefresh] = useTransition();

  function refresh() {
    setState({});
    startRefresh(async () => {
      try {
        const result = await refreshSite();
        setState(
          result.ok
            ? { success: t("admin.articles.refresh.done") }
            : { error: t("admin.articles.refresh.failed") },
        );
      } catch {
        setState({ error: t("admin.articles.refresh.failed") });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="outline"
        size="lg"
        onClick={refresh}
        disabled={pending}
        title={t("admin.articles.refresh.hint")}
      >
        {pending ? t("admin.articles.refresh.working") : t("admin.articles.refresh.button")}
      </Button>
      <FormMessage state={state} className="max-w-xs" />
    </div>
  );
}
