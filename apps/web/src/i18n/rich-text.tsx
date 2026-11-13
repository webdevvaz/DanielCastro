import { Fragment, type ReactNode } from "react";

/** A `{name}` placeholder. */
const PLACEHOLDER = /\{(\w+)\}/;

/**
 * A translated sentence with formatted parts in it, such as "Average {average} a night." with
 * `average` in bold. Each language puts the placeholders where its word order needs them.
 */
export function RichText({ template, values }: RichTextProps) {
  // `split` with a capturing group keeps the placeholder names at the odd positions.
  const parts = template.split(PLACEHOLDER);

  return (
    <>
      {parts.map((part, index) => (
        // The parts of one template never change order, so their position is a stable key.
        // oxlint-disable-next-line react/no-array-index-key
        <Fragment key={index}>{index % 2 === 1 ? values[part] : part}</Fragment>
      ))}
    </>
  );
}

type RichTextProps = {
  /** The sentence, with `{name}` where each value goes. */
  readonly template: string;
  readonly values: Readonly<Record<string, ReactNode>>;
};
