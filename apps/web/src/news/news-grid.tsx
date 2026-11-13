import { format, parseISO } from "date-fns";

import type { getNewsFeed } from "@/server/instagram/instagram.functions";

import { DATE_LOCALES } from "@/i18n/locales";
import { useLocale } from "@/i18n/use-locale";

import { NEWS_PAGE_TEXT } from "./news-page-text";

/**
 * Instagram posts in a grid of square tiles, newest first. Each tile opens the post. Posts of more
 * than one photo, and videos, carry a corner badge.
 */
export function NewsGrid({ posts }: { posts: ReadonlyArray<NewsPost> }) {
  const locale = useLocale();
  const t = NEWS_PAGE_TEXT[locale];

  return (
    <ul className="news-grid">
      {posts.map((post) => (
        <li key={post.id}>
          <a className="news-post" href={post.permalink} target="_blank" rel="noreferrer">
            <span className="news-post-image">
              {/* Instagram's addresses expire, so the image is never stored or resized here. */}
              <img
                src={post.imageUrl}
                alt={post.caption ?? t.postAlt}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              {t.kinds[post.kind] === null ? null : (
                <span className="news-post-kind">{t.kinds[post.kind]}</span>
              )}
            </span>
            <span className="news-post-body">
              <time dateTime={post.postedAt}>
                {format(parseISO(post.postedAt), "d MMM yyyy", { locale: DATE_LOCALES[locale] })}
              </time>
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
