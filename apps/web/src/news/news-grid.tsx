import { format, parseISO } from "date-fns";

import type { getNewsFeed } from "@/server/instagram/instagram.functions";

/** What the corner badge says for posts that are more than one photo. */
const KIND_LABEL = { image: null, video: "Video", carousel: "Album" } as const;

/** Instagram posts in a grid of square tiles, newest first. Each tile opens the post. */
export function NewsGrid({ posts }: { posts: ReadonlyArray<NewsPost> }) {
  return (
    <ul className="news-grid">
      {posts.map((post) => (
        <li key={post.id}>
          <a className="news-post" href={post.permalink} target="_blank" rel="noreferrer">
            <span className="news-post-image">
              {/* Instagram's addresses expire, so the image is never stored or resized here. */}
              <img
                src={post.imageUrl}
                alt={post.caption ?? "Instagram post by Daniel Castro"}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              {KIND_LABEL[post.kind] === null ? null : (
                <span className="news-post-kind">{KIND_LABEL[post.kind]}</span>
              )}
            </span>
            <span className="news-post-body">
              <time dateTime={post.postedAt}>{format(parseISO(post.postedAt), "d MMM yyyy")}</time>
              {post.caption === null ? null : (
                <span className="news-post-caption">{post.caption}</span>
              )}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

type NewsPost = Awaited<ReturnType<typeof getNewsFeed>>["posts"][number];
