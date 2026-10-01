import { Tag, type TagVariant } from "@/components/ui/tag";
import { articleStateLabelKeys, type ArticleState } from "@/lib/articles/status";
import { t } from "@/lib/i18n";

const stateVariants: Record<ArticleState, TagVariant> = {
  draft: "outline",
  scheduled: "lime",
  published: "ink",
};

export function ArticleStateBadge({ state }: { state: ArticleState }) {
  return <Tag variant={stateVariants[state]}>{t(articleStateLabelKeys[state])}</Tag>;
}
