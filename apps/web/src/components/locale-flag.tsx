import type { ReactNode } from "react";

import type { Locale } from "@/i18n/locales";

/** Simplified national flags, drawn on a 3:2 canvas so they stay clear at icon size. */
const FLAGS: Record<Locale, ReactNode> = {
  en: (
    <>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#C8102E" strokeWidth="3" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="7" />
    </>
  ),
  pt: (
    <>
      <rect width="60" height="40" fill="#DA291C" />
      <rect width="24" height="40" fill="#046A38" />
      <circle cx="24" cy="20" r="8" fill="#FFE000" />
      <path d="M20.5 15.5h7v6a3.5 3.5 0 0 1-7 0z" fill="#fff" stroke="#DA291C" strokeWidth="1.6" />
    </>
  ),
  fr: (
    <>
      <rect width="60" height="40" fill="#fff" />
      <rect width="20" height="40" fill="#002654" />
      <rect x="40" width="20" height="40" fill="#CE1126" />
    </>
  ),
  de: (
    <>
      <rect width="60" height="40" fill="#FFCE00" />
      <rect width="60" height="13.34" fill="#000" />
      <rect y="13.33" width="60" height="13.34" fill="#DD0000" />
    </>
  ),
  es: (
    <>
      <rect width="60" height="40" fill="#AA151B" />
      <rect y="10" width="60" height="20" fill="#F1BF00" />
    </>
  ),
};

/**
 * The flag that stands for a language in the language switchers. It is decorative: the link or
 * button around it carries the language name.
 */
export function LocaleFlag({ locale }: { locale: Locale }) {
  return (
    <svg
      className="locale-flag"
      viewBox="0 0 60 40"
      width={22}
      height={15}
      aria-hidden="true"
      focusable="false"
    >
      {FLAGS[locale]}
    </svg>
  );
}
