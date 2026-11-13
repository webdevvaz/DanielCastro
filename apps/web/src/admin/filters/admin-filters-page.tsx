import { GALLERY_TAG_KINDS } from "@daniel/shared/gallery";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { useAdminText } from "../use-admin-text";
import { TagList } from "./tag-list";

/** Manages the themes and the series that visitors filter Daniel's work by. */
export function AdminFiltersPage() {
  const context = useRouteContext({ from: "/admin/_dashboard/filters" });

  const { t } = useAdminText();

  const { data: tags } = useSuspenseQuery(context.galleryTagsQueryOptions);

  return (
    <>
      <p className="eyebrow">
        <b>{t.nav.label}</b> {t.filters.title}
      </p>
      <h1>{t.filters.title}</h1>
      <p className="lead">{t.filters.lead}</p>
      {GALLERY_TAG_KINDS.map((kind) => (
        <TagList key={kind} kind={kind} tags={tags.filter((tag) => tag.kind === kind)} />
      ))}
    </>
  );
}
