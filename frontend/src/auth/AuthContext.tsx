import * as React from 'react';
import { Session } from "../types/domain";

export type AuthContextValue = {
  session: Session | null;
  error: string;
  busy: boolean;
  checkSession: () => Promise<void>;
  authenticate: (kind: 'guest' | 'register' | 'login', payload: object) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuth() {
  const auth = React.useContext(AuthContext);
  if (!auth) throw new Error('Authentication provider is missing.');
  return auth;
}
