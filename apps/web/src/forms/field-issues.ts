import { Schema } from "effect";

/**
 * Whether a form field error is a schema issue with a message. TanStack Form leaves field errors
 * untyped; the Standard Schema issues that the form validators produce all carry a message.
 */
export const isFieldIssue = Schema.is(Schema.Struct({ message: Schema.String }));
