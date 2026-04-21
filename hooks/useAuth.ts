import { useState, useEffect } from 'react';
import { User } from '../types';
import { firebaseService } from '../services/firebaseService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseService.auth.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const role = await firebaseService.auth.getUserRole(firebaseUser.uid);
          setUser({
            username: firebaseUser.email || 'unknown',
            role: role as 'admin' | 'user',
            password: '' // Not needed locally
          });
        } catch (e) {
          console.error("Error fetching user role:", e);
          setUser({ username: firebaseUser.email || 'unknown', role: 'user' });
        }
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (username: string, pass: string) => {
    await firebaseService.auth.login(username, pass);
    return true; // throw error if failed, handled by caller
  };

  const handleRegister = async (newUser: User) => {
    await firebaseService.auth.register(newUser.username, newUser.password || '', newUser.role);
    return true;
  };

  const handleLogout = () => firebaseService.auth.logout();

  return { user, isAuthLoading, handleLogin, handleRegister, handleLogout };
};
