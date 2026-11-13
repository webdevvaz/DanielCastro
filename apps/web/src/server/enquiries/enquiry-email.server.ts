import "@tanstack/react-start/server-only";
import type { EnquiryLocationKind, EnquiryPhotoKind } from "@daniel/shared/enquiry";
import type { Locale } from "@daniel/shared/locales";

import { ENQUIRY_PHOTO_KINDS } from "@daniel/shared/enquiry";
import { Option } from "effect";

import { LOCALE_NAMES } from "@/i18n/locales";

import type { OutgoingEmail } from "../email/resend.server";

/**
 * Resend accepts 40 MB per email after base64, which adds a third. Above this many bytes of
 * photos, the email links to the admin area instead of carrying them.
 */
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

const MAX_SUBJECT_THEME = 80;

/** The studio team reads the email in Portuguese; the client's own words stay as written. */
const PHOTO_FILE_PREFIXES: Record<EnquiryPhotoKind, string> = {
  reference: "referencia",
  favourite: "favorito",
  placement: "zona",
};

const PHOTO_COUNT_LABELS: Record<EnquiryPhotoKind, string> = {
  reference: "referências",
  favourite: "trabalhos favoritos",
  placement: "fotos da zona",
};

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (text: string) =>
  text.replaceAll(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

/** Where the client wants the tattoo, in words. */
const locationText = (enquiry: EnquiryEmailContent) => {
  const detail = enquiry.locationDetail ?? "";

  const labels: Record<EnquiryLocationKind, string> = {
    braga: "Braga (estúdio)",
    guest_spot: `Guest spot: ${detail}`,
    other: `Outro: ${detail}`,
  };

  return labels[enquiry.locationKind];
};

/** "3 referências, 2 trabalhos favoritos, 1 fotos da zona". */
const photoSummary = (photos: ReadonlyArray<EnquiryEmailPhoto>) =>
  ENQUIRY_PHOTO_KINDS.map((kind) => ({
    kind,
    total: photos.filter((photo) => photo.kind === kind).length,
  }))
    .filter(({ total }) => total > 0)
    .map(({ kind, total }) => `${String(total)} ${PHOTO_COUNT_LABELS[kind]}`)
    .join(", ");

/**
 * The studio's email about a new enquiry: every answer, the photos attached as JPEG files, and a
 * link to the enquiry in the admin area. Replying answers the client.
 */
export function buildEnquiryEmail(
  enquiry: EnquiryEmailContent,
  photos: ReadonlyArray<EnquiryEmailPhoto>,
  siteUrl: string,
): Omit<OutgoingEmail, "from" | "to"> {
  const adminUrl = new URL(`/admin/enquiries/${enquiry.id}`, siteUrl).toString();
  const instagramUrl = `https://www.instagram.com/${encodeURIComponent(enquiry.instagram)}/`;

  const attachmentBytes = photos.reduce((total, photo) => total + photo.bytes.byteLength, 0);
  const attachPhotos = attachmentBytes <= MAX_ATTACHMENT_BYTES;

  const fields = [
    { label: "Nome", value: enquiry.name },
    { label: "Idade", value: String(enquiry.age) },
    { label: "Instagram", value: `@${enquiry.instagram}`, href: instagramUrl },
    { label: "Email", value: enquiry.email, href: `mailto:${enquiry.email}` },
    { label: "Telefone", value: enquiry.phone ?? "—" },
    { label: "Cidade", value: `${enquiry.city}, ${enquiry.country}` },
    { label: "Onde", value: locationText(enquiry) },
    { label: "Idioma do site", value: LOCALE_NAMES[enquiry.locale] },
    { label: "Tema", value: enquiry.theme },
  ];

  const texts = [
    { label: "Descrição", value: enquiry.description },
    { label: "Outras perguntas", value: enquiry.questions ?? "—" },
  ];

  const photoLine = attachPhotos
    ? `Fotos em anexo: ${photoSummary(photos)}.`
    : `Fotos: ${photoSummary(photos)}. São grandes demais para anexar; vê-as no site.`;

  const text = [
    "Novo pedido de orçamento pelo site.",
    "",
    ...fields.map((field) => `${field.label}: ${field.value}`),
    "",
    ...texts.flatMap((field) => [`${field.label}:`, field.value, ""]),
    photoLine,
    `Ver no site: ${adminUrl}`,
    "",
    "Responder a este email responde ao cliente.",
  ].join("\n");

  const rows = fields
    .map((field) => {
      const value = escapeHtml(field.value);
      const cell =
        field.href === undefined ? value : `<a href="${escapeHtml(field.href)}">${value}</a>`;

      return `<tr><th align="left" style="padding:4px 12px 4px 0;vertical-align:top">${escapeHtml(field.label)}</th><td style="padding:4px 0">${cell}</td></tr>`;
    })
    .join("");

  const paragraphs = texts
    .map(
      (field) =>
        `<h3 style="margin:20px 0 4px">${escapeHtml(field.label)}</h3><p style="margin:0;white-space:pre-wrap">${escapeHtml(field.value)}</p>`,
    )
    .join("");

  const html = [
    '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111">',
    "<p>Novo pedido de orçamento pelo site.</p>",
    `<table cellspacing="0" cellpadding="0">${rows}</table>`,
    paragraphs,
    `<p style="margin-top:20px">${escapeHtml(photoLine)}</p>`,
    `<p><a href="${escapeHtml(adminUrl)}">Ver no site</a></p>`,
    '<p style="color:#666">Responder a este email responde ao cliente.</p>',
    "</div>",
  ].join("");

  return {
    replyTo: Option.some(enquiry.email),
    subject: `Pedido de orçamento: ${enquiry.name} (@${enquiry.instagram}) – ${enquiry.theme.slice(0, MAX_SUBJECT_THEME)}`,
    text,
    html,
    attachments: attachPhotos
      ? photos.map((photo) => ({
          filename: `${PHOTO_FILE_PREFIXES[photo.kind]}-${String(photo.position + 1)}.jpg`,
          content: photo.bytes,
        }))
      : [],
  };
}

/** The answers of an enquiry, as the database stores them. */
export type EnquiryEmailContent = {
  readonly id: string;
  readonly locale: Locale;
  readonly name: string;
  readonly age: number;
  readonly instagram: string;
  readonly email: string;
  readonly phone: string | null;
  readonly city: string;
  readonly country: string;
  readonly locationKind: EnquiryLocationKind;
  readonly locationDetail: string | null;
  readonly theme: string;
  readonly description: string;
  readonly questions: string | null;
};

/** A stored enquiry photo with its JPEG bytes. */
export type EnquiryEmailPhoto = {
  readonly kind: EnquiryPhotoKind;
  readonly position: number;
  readonly bytes: Uint8Array;
};
