export type UserRole = "admin" | "staff";

export type AuthErrorCode =
  | "invalid_credentials"
  | "pending_approval"
  | "no_profile"
  | "email_not_verified";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  role: UserRole;
  isActive: boolean;
  defaultTipoCambio: number | null;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  code?: AuthErrorCode;
}

export interface SignUpResult extends AuthResult {
  requireEmailVerification?: boolean;
  verifyEmailMethod?: "code" | "link";
}
