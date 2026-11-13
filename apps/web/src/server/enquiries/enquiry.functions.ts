import { countNewEnquiries, getEnquiry, listEnquiries } from "@daniel/db";
import { EnquiryFormData, EnquiryIdInput, UpdateEnquiryStatusInput } from "@daniel/shared/enquiry";
import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "../auth/auth.middleware";
import { runServerEffect } from "../run.server";
import { validateInput } from "../validate-input";
import {
  changeEnquiryStatus,
  removeEnquiry,
  sendEnquiryEmailAgain,
  submitEnquiry as submitEnquiryEffect,
} from "./enquiry.server";

/**
 * Accepts the site's enquiry form: multipart form data with the answers as JSON in `details` and
 * the photos in `reference`, `favourite`, and `placement`. Public.
 */
export const submitEnquiry = createServerFn({ method: "POST" })
  .validator(validateInput(EnquiryFormData))
  .handler(({ data }) => runServerEffect(submitEnquiryEffect(data)));

/** Every enquiry, the newest first, for the admin list. */
export const getAdminEnquiries = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(() => runServerEffect(listEnquiries()));

/** How many enquiries nobody has answered yet, for the admin overview. */
export const getNewEnquiryCount = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(() => runServerEffect(countNewEnquiries()));

/** One enquiry with every answer and its photos. */
export const getAdminEnquiry = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .validator(validateInput(EnquiryIdInput))
  .handler(({ data }) => runServerEffect(getEnquiry(data.id)));

/** Moves an enquiry to another stage. */
export const updateEnquiryStatus = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(UpdateEnquiryStatusInput))
  .handler(({ context, data }) => runServerEffect(changeEnquiryStatus(context.user.id, data)));

/** Sends an enquiry's email again with the current email settings. */
export const resendEnquiryEmail = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(EnquiryIdInput))
  .handler(({ context, data }) => runServerEffect(sendEnquiryEmailAgain(context.user.id, data.id)));

/** Deletes an enquiry and its photos. */
export const deleteEnquiry = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(EnquiryIdInput))
  .handler(({ context, data }) => runServerEffect(removeEnquiry(context.user.id, data.id)));
