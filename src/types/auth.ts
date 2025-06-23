export interface AuthState {
  isAuthenticated: boolean;
  hasAgreedToTerms: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  agreeToTerms: () => void;
}
