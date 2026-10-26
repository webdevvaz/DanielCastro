import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import type { getAdminInstagram } from "@/server/instagram/instagram.functions";

import { importInstagramPost } from "@/server/instagram/instagram.functions";

/** The badge for posts that are not a single photo. */
const KIND_LABEL = { image: null, video: "Video", carousel: "Album" } as const;

/** The add button's text: added already, adding now, or not yet added. */
const importLabel = (imported: boolean, pending: boolean) => {
  if (imported) return "In gallery";

  return pending ? "Adding…" : "Add to gallery";
};

/** One post: its image, date, and caption, and "Add to gallery" for photos and albums. */
function InstagramPostCard({ post }: { post: AdminInstagramPost }) {
  const { queryClient, instagramQueryKeys, galleryQueryKeys } = useRouteContext({
    from: "/admin/_dashboard/instagram",
  });

  const importPost = useServerFn(importInstagramPost);

  const importMutation = useMutation({
    mutationFn: () => importPost({ data: { mediaId: post.id } }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: instagramQueryKeys.admin }),
        queryClient.invalidateQueries({ queryKey: galleryQueryKeys.all }),
      ]),
    onError: (error) => toast.error(error.message || "The post could not be added"),
  });

  return (
    <article className="admin-photo">
      <a className="admin-photo-image" href={post.permalink} target="_blank" rel="noreferrer">
        {post.imageUrl === null ? (
          <span className="instagram-no-image">No image</span>
        ) : (
          <img
            src={post.imageUrl}
            alt={post.caption ?? "Instagram post"}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="admin-photo-badges">
          {KIND_LABEL[post.kind] === null ? null : <span>{KIND_LABEL[post.kind]}</span>}
          {post.imported ? <span data-kind="featured">In gallery</span> : null}
        </div>
      </a>
      <div className="admin-photo-body">
        <p className="admin-photo-title">
          {format(parseISO(post.postedAt), "d MMM yyyy")}
          <small className="instagram-caption">{post.caption ?? "No caption"}</small>
        </p>
        {post.kind === "video" ? (
          <p className="field-hint">You can add only photos to the gallery.</p>
        ) : (
          <div className="admin-photo-actions">
            <button
              className="btn btn-ghost btn-small"
              type="button"
              disabled={post.imported || importMutation.isPending}
              onClick={() => importMutation.mutate()}
            >
              {importLabel(post.imported, importMutation.isPending)}
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
