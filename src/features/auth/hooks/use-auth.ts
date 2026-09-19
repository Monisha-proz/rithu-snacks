"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { logoutUser } from "../api/auth.api";

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const user = session?.user;
  const isAuthenticated = status === "authenticated" && !!user;
  const isLoading = status === "loading";
  const isAdmin = user?.role === "ADMIN" || user?.role === "STAFF";
  const isCustomer = user?.role === "CUSTOMER";

  const requireAuth = useCallback(
    (redirectTo = "/login") => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo);
      }
    },
    [isLoading, isAuthenticated, router]
  );

  const requireAdmin = useCallback(() => {
    if (!isLoading && !isAdmin) {
      router.push("/unauthorized");
    }
  }, [isLoading, isAdmin, router]);

  const logout = useCallback(
    async (redirectTo = "/login") => {
      await logoutUser(redirectTo);
    },
    []
  );

  return {
    user,
    session,
    status,
    isAuthenticated,
    isLoading,
    isAdmin,
    isCustomer,
    requireAuth,
    requireAdmin,
    logout,
    update,
  };
}
