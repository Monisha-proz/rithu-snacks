import bcrypt from "bcryptjs";
import { ApiError } from "@/lib/api/api-error";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/lib/auth/jwt";
import { userRepository } from "@/features/users/repositories/user.repository";
import type { LoginInput } from "@/lib/validations/auth";

export const authService = {
  async authenticateUser(data: LoginInput) {
    const user = await userRepository.findByEmail(data.email);
    if (!user || !user.password_hash) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    if (user.status !== "active") {
      throw ApiError.forbidden("Your account is inactive or blocked");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const userUuid = user.uuid || user.id.toString();
    const userRole = user.roleName || user.role?.name || "CUSTOMER";

    await userRepository.update(user.id, { last_login_at: new Date() } as never);

    const accessToken = generateAccessToken({
      userId: userUuid, // Pass UUID string into JWT
      email: user.email ?? "",
      role: userRole,
    });

    const refreshToken = generateRefreshToken({
      userId: userUuid,
    });

    return {
      user: {
        id: userUuid, // Expose user's UUID in the id property of response DTO sent to FE
        name: user.name,
        email: user.email ?? "",
        phone: user.phone ?? null,
        role: userRole,
      },
      accessToken,
      refreshToken,
    };
  },

  async refreshAccessToken(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || user.status !== "active") {
      throw ApiError.unauthorized("User account is inactive or no longer exists");
    }

    const userUuid = user.uuid || user.id.toString();
    const userRole = user.roleName || user.role?.name || "CUSTOMER";

    const accessToken = generateAccessToken({
      userId: userUuid,
      email: user.email ?? "",
      role: userRole,
    });

    return { accessToken };
  },
};
