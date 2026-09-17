/**
 * Temporary frontend state manager for authentication verification flows.
 * Preserves user verification data (e.g. email) across page transitions
 * without exposing sensitive user information in browser URLs or route parameters.
 *
 * Registration and Forgot Password states are strictly kept separate.
 */
class AuthFlowState {
  private registrationEmail: string = "";
  private forgotPasswordEmail: string = "";

  // -------------------------------------------------------------
  // Registration Flow State
  // -------------------------------------------------------------
  setRegistrationEmail(email: string): void {
    this.registrationEmail = email.trim().toLowerCase();
  }

  getRegistrationEmail(): string {
    if (this.registrationEmail) {
      return this.registrationEmail;
    }
    // Fallback to existing application architecture pending_registration in sessionStorage
    const pending = this.getPendingRegistration();
    if (pending?.email) {
      this.registrationEmail = pending.email.trim().toLowerCase();
      return this.registrationEmail;
    }
    return "";
  }

  clearRegistrationEmail(): void {
    this.registrationEmail = "";
  }

  setPendingRegistration(data: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
  }): void {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("pending_registration", JSON.stringify(data));
      } catch {
        // Ignore storage errors
      }
    }
    if (data?.email) {
      this.registrationEmail = data.email.trim().toLowerCase();
    }
  }

  getPendingRegistration(): {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
  } | null {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("pending_registration");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            return parsed;
          }
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
    return null;
  }

  clearPendingRegistration(): void {
    this.registrationEmail = "";
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("pending_registration");
      } catch {
        // Ignore storage errors
      }
    }
  }

  // -------------------------------------------------------------
  // Forgot Password Flow State
  // -------------------------------------------------------------
  setForgotPasswordEmail(email: string): void {
    this.forgotPasswordEmail = email.trim().toLowerCase();
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("fp_verification_email", this.forgotPasswordEmail);
      } catch {
        // Ignore storage errors
      }
    }
  }

  getForgotPasswordEmail(): string {
    if (this.forgotPasswordEmail) {
      return this.forgotPasswordEmail;
    }
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("fp_verification_email");
        if (saved) {
          this.forgotPasswordEmail = saved.trim().toLowerCase();
          return this.forgotPasswordEmail;
        }
      } catch {
        // Ignore storage errors
      }
    }
    return "";
  }

  clearForgotPasswordEmail(): void {
    this.forgotPasswordEmail = "";
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("fp_verification_email");
      } catch {
        // Ignore storage errors
      }
    }
  }
}

export const authFlowState = new AuthFlowState();
