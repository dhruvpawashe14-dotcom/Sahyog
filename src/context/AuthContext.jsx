import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/auth/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Supabase auth user
  const [profile, setProfile] = useState(null); // profiles row (name, role)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await authService.getSession();
      if (session) {
        setUser(session.user);
        setProfile(await authService.fetchOwnProfile());
      }
      setLoading(false);
    })();

    const unsubscribe = authService.onAuthStateChange(async (session) => {
      setUser(session?.user ?? null);
      setProfile(session ? await authService.fetchOwnProfile() : null);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const { profile } = await authService.signIn(email, password);
    setProfile(profile);
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
