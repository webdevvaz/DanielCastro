import { authClient } from "@daniel/auth/client";
import { useMutation, type QueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { clearQueryCacheForAuthTransition } from "./auth-cache";

/**
 * Signs out, clears every cached query, and loads the sign-in page again as a new document. The
 * reload stops every request and callback of the account that signed out: a mutation still in
 * flight could otherwise restore its cache snapshot after the
 * next person signs in.
 */
export function useSignOut(queryClient: QueryClient) {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      // Better Auth reports failures in `error` instead of rejecting.
      const { error } = await authClient.signOut();

      if (error) throw new Error(error.message ?? "Sign-out failed");
    },
    onSuccess: () => {
      clearQueryCacheForAuthTransition(queryClient);

      void navigate({ to: "/admin/sign-in", replace: true, reloadDocument: true });
    },
    onError: () => {
      toast.error("Failed to log out");
    },
  });
}
