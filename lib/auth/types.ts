export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface SignUpResult extends AuthResult {
  requireEmailVerification?: boolean;
  verifyEmailMethod?: "code" | "link";
}
