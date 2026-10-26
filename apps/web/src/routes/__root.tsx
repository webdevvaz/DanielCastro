import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { Toaster } from "sonner";

import { appConfig } from "@/app-config";
import { RootErrorComponent } from "@/defaults/error";
import { NotFoundComponent } from "@/defaults/not-found";

import appCss from "../styles.css?url";

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap";

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster position="top-right" theme="dark" />
        <Scripts />
      </body>
    </html>
  );
}

/** The root route: the HTML document, fonts, styles, error toasts, and the default pages. */
export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${appConfig.name} — ${appConfig.role}` },
      { name: "description", content: appConfig.description },
      { name: "theme-color", content: "#0b0a09" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: FONTS_URL },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/assets/brand/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundComponent,
  errorComponent: RootErrorComponent,
});

interface RouterContext {
  queryClient: QueryClient;
}
