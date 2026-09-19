import { cookies } from "next/headers";
import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";

const IS_PROD = process.env.NODE_ENV === "production";

export const POST = createApiHandler(
  {
    POST: async () => {
      const cookieStore = await cookies();

      const clearCookieOptions = {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: "lax" as const,
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      };

      // Explicitly set with expired date and path="/" to guarantee deletion across all browser engines
      cookieStore.set("access_token", "", clearCookieOptions);
      cookieStore.set("refresh_token", "", clearCookieOptions);
      cookieStore.set("reset_token", "", clearCookieOptions);

      // Also invoke delete
      cookieStore.delete("access_token");
      cookieStore.delete("refresh_token");
      cookieStore.delete("reset_token");

      return apiSuccess(null, "Logged out successfully");
    },
  },
  {
    method: "POST",
  }
);
