import type { GalleryTagKind, GalleryTagNames } from "@daniel/shared/gallery";

import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { tagTranslations, type GalleryTag } from "@/gallery/tag-label";
import { LOCALES } from "@/i18n/locales";
import { galleryQueryKeys } from "@/integrations/tanstack-query/gallery-query-options";
import {
  createGalleryTag,
  deleteGalleryTag,
  reorderGalleryTags,
  updateGalleryTag,
} from "@/server/gallery/gallery.functions";

import { useAdminText } from "../use-admin-text";
import { TagForm } from "./tag-form";

/** No name and no translations: a new theme or series. */
const EMPTY_NAMES: typeof GalleryTagNames.Encoded = {
  name: "",
  translations: { en: "", pt: "", fr: "", de: "", es: "" },
};

/** The filled translations of a tag, such as "PT: Fantasia sombria · FR: Dark fantasy". */
const translationSummary = (tag: GalleryTag) => {
  const translations = tagTranslations(tag);

  return LOCALES.filter((locale) => translations[locale] !== "")
    .map((locale) => `${locale.toUpperCase()}: ${translations[locale]}`)
    .join(" · ");
};

/**
 * The themes, or the series, in their order on the site: rename, reorder, or delete each one, and
 * add new ones at the end.
 */
export function TagList({ kind, tags }: { kind: GalleryTagKind; tags: ReadonlyArray<GalleryTag> }) {
  const { queryClient } = useRouteContext({ from: "/admin/_dashboard/filters" });

  const { t } = useAdminText();
  const text = t.filters.kinds[kind];

  const [editingId, setEditingId] = useState<string | null>(null);

  const create = useServerFn(createGalleryTag);
  const update = useServerFn(updateGalleryTag);
  const remove = useServerFn(deleteGalleryTag);
  const reorder = useServerFn(reorderGalleryTags);

  const refresh = () => queryClient.invalidateQueries({ queryKey: galleryQueryKeys.all });

  const createMutation = useMutation({
    mutationFn: (names: GalleryTagNames) => create({ data: { kind, ...names } }),
    onSuccess: refresh,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, names }: { id: string; names: GalleryTagNames }) =>
      update({ data: { id, ...names } }),
    onSuccess: refresh,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || t.filters.deleteFailed),
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: ReadonlyArray<string>) => reorder({ data: { kind, ids } }),
    onSettled: refresh,
    onError: () => toast.error(t.filters.orderFailed),
  });

  const busy = deleteMutation.isPending || reorderMutation.isPending;

  const move = (tag: GalleryTag, index: number, offset: number) => {
    const ids = tags
      .map((item) => item.id)
      .toSpliced(index, 1)
      .toSpliced(index + offset, 0, tag.id);

    reorderMutation.mutate(ids);
  };

  return (
    <section className="admin-section">
      <h2>{text.title}</h2>
      <p className="muted">{text.description}</p>
      {tags.length === 0 ? <p className="muted">{t.filters.empty}</p> : null}
      <ul className="tag-list">
        {tags.map((tag, index) => (
          <li className="tag-row" key={tag.id}>
            {editingId === tag.id ? (
              <TagForm
                initial={{ name: tag.name, translations: tagTranslations(tag) }}
                placeholder={text.placeholder}
                submitLabel={t.common.save}
                onSave={(names) => updateMutation.mutateAsync({ id: tag.id, names })}
                onSaved={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <p className="tag-name">
                  {tag.name}
                  <small>{translationSummary(tag)}</small>
                </p>
                <div className="admin-photo-actions">
                  <button
                    className="btn btn-ghost btn-small"
                    type="button"
                    aria-label={t.filters.moveUp}
                    disabled={busy || index === 0}
                    onClick={() => move(tag, index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-ghost btn-small"
                    type="button"
                    aria-label={t.filters.moveDown}
                    disabled={busy || index === tags.length - 1}
                    onClick={() => move(tag, index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    className="btn btn-ghost btn-small"
                    type="button"
                    onClick={() => setEditingId(tag.id)}
                  >
                    {t.common.edit}
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(t.filters.confirmDelete(tag.name))) {
                        deleteMutation.mutate(tag.id);
                      }
                    }}
                  >
                    {t.common.delete}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="panel">
        <h3 className="form-section-title">{text.add}</h3>
        <TagForm
          initial={EMPTY_NAMES}
          placeholder={text.placeholder}
          submitLabel={text.add}
          onSave={(names) => createMutation.mutateAsync(names)}
        />
      </div>
    </section>
  );
}
