export type UserRoleName =
  | 'ADMIN'
  | 'CLIENT'
  | 'ENGINEER'
  | 'AGENCY'
  | 'INVESTOR'
  | 'BUYER'
  | 'SELLER';

export type AuthProviderName = 'LOCAL' | 'GOOGLE' | 'GITHUB' | 'LINKEDIN';

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  errorCode?: string;
}

export interface AuthSessionPayload {
  sub: string;
  email: string;
  roles: UserRoleName[];
  mfaVerified: boolean;
}
