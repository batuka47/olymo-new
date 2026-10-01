"use client";

import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import type { ArticleFormValues } from "@/lib/articles/form";
import { olympiadSubjects, type OlympiadSubject } from "@/lib/articles/olympiad";
import { t } from "@/lib/i18n";

type OlympiadKey =
  | "levelText"
  | "registrationDeadline"
  | "examDate"
  | "audience"
  | "location"
  | "feeText"
  | "organizer"
  | "registrationUrl";

interface OlympiadFieldsProps {
  values: ArticleFormValues;
  onSubjectChange: (subject: OlympiadSubject | "") => void;
  onChange: (key: OlympiadKey, value: string) => void;
}

export function OlympiadFields({ values, onSubjectChange, onChange }: OlympiadFieldsProps) {
  const text = (key: OlympiadKey) => ({
    name: key,
    value: values[key],
    onChange: (event: { target: { value: string } }) => onChange(key, event.target.value),
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label={t("olympiad.fields.subject")}
        name="subject"
        value={values.subject}
        onChange={(event) => onSubjectChange(event.target.value as OlympiadSubject | "")}
        options={[
          { value: "", label: t("admin.articles.olympiad.chooseSubject") },
          ...olympiadSubjects.map((subject) => ({
            value: subject,
            label: t(`olympiad.subjects.${subject}`),
          })),
        ]}
      />
      <TextField
        label={t("olympiad.fields.level")}
        placeholder={t("admin.articles.olympiad.levelPlaceholder")}
        maxLength={100}
        {...text("levelText")}
      />
      <TextField
        label={t("olympiad.fields.deadline")}
        type="date"
        {...text("registrationDeadline")}
      />
      <TextField label={t("olympiad.fields.examDate")} type="date" {...text("examDate")} />
      <TextField label={t("olympiad.fields.audience")} maxLength={200} {...text("audience")} />
      <TextField label={t("olympiad.fields.location")} maxLength={200} {...text("location")} />
      <TextField label={t("olympiad.fields.fee")} maxLength={100} {...text("feeText")} />
      <TextField label={t("olympiad.fields.organizer")} maxLength={200} {...text("organizer")} />
      <TextField
        label={t("olympiad.fields.registrationUrl")}
        type="url"
        inputMode="url"
        placeholder="https://"
        className="sm:col-span-2"
        {...text("registrationUrl")}
      />
    </div>
  );
}
