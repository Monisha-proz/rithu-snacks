import { cookies } from "next/headers";
import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { authService } from "@/features/auth/services/auth.service";

const IS_PROD = process.env.NODE_ENV === "production";

export const POST = createApiHandler(
  {
    POST: async (request) => {
      const cookieStore = await cookies();
      let refreshToken = cookieStore.get("refresh_token")?.value;

      if (!refreshToken) {
        try {
          const body = await request.json();
          refreshToken = body?.refreshToken;
        } catch {
          // ignore json parse error if empty body
        }
      }

      if (!refreshToken) {
        throw ApiError.unauthorized("Refresh token is required");
      }

      try {
        const result = await authService.refreshAccessToken(refreshToken);

        if (result.accessToken) {
          cookieStore.set("access_token", result.accessToken, {
            httpOnly: true,
            secure: IS_PROD,
            sameSite: "lax",
            path: "/",
            maxAge: 15 * 60, // 15 minutes
          });
        }

        return apiSuccess(null, "Access token refreshed successfully");
      } catch (err) {
        cookieStore.delete("access_token");
        cookieStore.delete("refresh_token");
        cookieStore.delete("authjs.session-token");
        cookieStore.delete("__Secure-authjs.session-token");
        cookieStore.delete("next-auth.session-token");
        cookieStore.delete("__Secure-next-auth.session-token");
        throw err;
      }
    },
  },
  {
    method: "POST",
  }
);
