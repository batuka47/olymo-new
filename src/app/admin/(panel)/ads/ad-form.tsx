"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { ImageDropZone } from "@/components/admin/image-drop-zone";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormMessage } from "@/components/ui/form-message";
import { SelectField } from "@/components/ui/select-field";
import { fieldLabelClasses, TextField } from "@/components/ui/text-field";
import { adminRoutes } from "@/config/admin";
import { adFormat, adPlacementLabelKeys, adPlacements, type AdPlacement } from "@/config/ads";
import type { AdFormValues } from "@/lib/ads/form";
import { t } from "@/lib/i18n";
import { encodeImageVariants, type EncodedImage } from "@/lib/images/encode";
import { uploadVariants } from "@/lib/images/upload";
import { adImagePath } from "@/lib/media";
import { saveAd } from "./actions";

interface AdFormProps {
  adId: string;
  initialValues: AdFormValues;
  /** Cache buster for the image previews. */
  imageVersion: string;
}

type ImageKind = "desktop" | "mobile";

/** The previews use the proportions the site shows, so a crop is visible before saving. */
function previewClasses(placement: AdPlacement, kind: ImageKind): string {
  if (kind === "mobile") {
    return "aspect-358/100 w-full max-w-sm";
  }
  return adFormat(placement).mobile ? "aspect-1248/140 w-full" : "aspect-300/250 w-full max-w-xs";
}

export function AdForm({ adId, initialValues, imageVersion }: AdFormProps) {
  const [values, setValues] = useState(initialValues);
  const [versions, setVersions] = useState({ desktop: imageVersion, mobile: imageVersion });
  const [error, setError] = useState<string>();
  const [saving, startSaving] = useTransition();
  const format = adFormat(values.placement);

  function update<K extends keyof AdFormValues>(key: K, value: AdFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function storeImage(kind: ImageKind) {
    return (image: EncodedImage) =>
      uploadVariants(image, (width, extension) => adImagePath(adId, kind, width, extension));
  }

  function imageField(kind: ImageKind) {
    const size = kind === "desktop" ? format.desktop : format.mobile;
    const pathKey = kind === "desktop" ? "imagePath" : "imagePathMobile";
    if (!size) {
      return null;
    }
    return (
      <div className="flex flex-col gap-2">
        <span className={fieldLabelClasses}>
          {kind === "desktop"
            ? `${t("admin.ads.form.desktopImage")} *`
            : t("admin.ads.form.mobileImage")}
        </span>
        <ImageDropZone
          name={kind === "desktop" ? "adDesktopImage" : "adMobileImage"}
          path={values[pathKey]}
          version={versions[kind]}
          previewClassName={previewClasses(values.placement, kind)}
          hint={t("admin.ads.form.recommended", { width: size.width, height: size.height })}
          encode={encodeImageVariants}
          store={storeImage(kind)}
          onUploaded={(path, version) => {
            update(pathKey, path);
            setVersions((current) => ({ ...current, [kind]: version }));
          }}
          onRemove={() => update(pathKey, null)}
          removeLabel={t("admin.ads.form.removeImage")}
        />
      </div>
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    startSaving(async () => {
      // On success the action opens the ad list.
      const result = await saveAd(adId, values);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
    >
      <div className="flex flex-col gap-6">
        <TextField
          label={`${t("admin.ads.form.title")} *`}
          name="title"
          value={values.title}
          maxLength={120}
          required
          hint={t("admin.ads.form.titleHint")}
          onChange={(event) => update("title", event.target.value)}
        />
        <TextField
          label={`${t("admin.ads.form.linkUrl")} *`}
          name="linkUrl"
          type="url"
          inputMode="url"
          placeholder="https://"
          value={values.linkUrl}
          required
          hint={t("admin.ads.form.linkUrlHint")}
          onChange={(event) => update("linkUrl", event.target.value)}
        />
        <SelectField
          label={t("admin.ads.form.placement")}
          name="placement"
          value={values.placement}
          options={adPlacements.map((placement) => ({
            value: placement,
            label: t(adPlacementLabelKeys[placement]),
          }))}
          onChange={(event) => update("placement", event.target.value as AdPlacement)}
        />
        {imageField("desktop")}
        {imageField("mobile")}
      </div>

      <aside className="flex flex-col gap-6 border border-line p-5">
        <TextField
          label={`${t("admin.ads.form.startDate")} *`}
          name="startDate"
          type="date"
          value={values.startDate}
          required
          onChange={(event) => update("startDate", event.target.value)}
        />
        <TextField
          label={t("admin.ads.form.endDate")}
          name="endDate"
          type="date"
          min={values.startDate}
          value={values.endDate}
          hint={t("admin.ads.form.endDateHint")}
          onChange={(event) => update("endDate", event.target.value)}
        />
        <CheckboxField
          label={t("admin.ads.form.active")}
          checked={values.isActive}
          onChange={(event) => update("isActive", event.target.checked)}
        />
        <FormMessage state={{ error }} />
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? t("admin.ads.form.saving") : t("admin.ads.form.save")}
        </Button>
        <Link href={adminRoutes.ads} className="text-sm underline underline-offset-4">
          ← {t("admin.ads.form.back")}
        </Link>
      </aside>
    </form>
  );
}
