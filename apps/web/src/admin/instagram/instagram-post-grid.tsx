import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import type { getAdminInstagram } from "@/server/instagram/instagram.functions";

import { DATE_LOCALES } from "@/i18n/locales";
import { importInstagramPost } from "@/server/instagram/instagram.functions";

import { useAdminText } from "../use-admin-text";

/** One post: its image, date, and caption, and "Add to gallery" for photos and albums. */
function InstagramPostCard({ post }: { post: AdminInstagramPost }) {
  const { queryClient, instagramQueryKeys, galleryQueryKeys } = useRouteContext({
    from: "/admin/_dashboard/instagram",
  });

  const { locale, t } = useAdminText();

  const importPost = useServerFn(importInstagramPost);

  const importMutation = useMutation({
    mutationFn: () => importPost({ data: { mediaId: post.id } }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: instagramQueryKeys.admin }),
        queryClient.invalidateQueries({ queryKey: galleryQueryKeys.all }),
      ]),
    onError: (error) => toast.error(error.message || t.instagram.addFailed),
  });

  // The add button's text: added already, adding now, or not yet added.
  let importLabel = t.instagram.addToGallery;

  if (importMutation.isPending) importLabel = t.instagram.adding;

  if (post.imported) importLabel = t.instagram.inGallery;

  return (
    <article className="admin-photo">
      <a className="admin-photo-image" href={post.permalink} target="_blank" rel="noreferrer">
        {post.imageUrl === null ? (
          <span className="instagram-no-image">{t.instagram.noImage}</span>
        ) : (
          <img
            src={post.imageUrl}
            alt={post.caption ?? t.instagram.postAlt}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="admin-photo-badges">
          {t.instagram.kinds[post.kind] === null ? null : (
            <span>{t.instagram.kinds[post.kind]}</span>
          )}
          {post.imported ? <span data-kind="featured">{t.instagram.inGallery}</span> : null}
        </div>
      </a>
      <div className="admin-photo-body">
        <p className="admin-photo-title">
          {format(parseISO(post.postedAt), "d MMM yyyy", { locale: DATE_LOCALES[locale] })}
          <small className="instagram-caption">{post.caption ?? t.instagram.noCaption}</small>
        </p>
        {post.kind === "video" ? (
          <p className="field-hint">{t.instagram.photosOnly}</p>
        ) : (
          <div className="admin-photo-actions">
            <button
              className="btn btn-ghost btn-small"
              type="button"
              disabled={post.imported || importMutation.isPending}
              onClick={() => importMutation.mutate()}
            >
              {importLabel}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

/** The connected account's recent posts, newest first. */
export function InstagramPostGrid({ posts }: { posts: ReadonlyArray<AdminInstagramPost> }) {
  return (
    <div className="admin-photos">
      {posts.map((post) => (
        <InstagramPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

type AdminInstagramPost = Awaited<ReturnType<typeof getAdminInstagram>>["posts"][number];
