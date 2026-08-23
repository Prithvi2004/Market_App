/**
 * Authentication Store using Zustand and SecureStore/AsyncStorage persistence.
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signInWithEmail as apiSignInWithEmail,
  signUpWithEmail as apiSignUpWithEmail,
  signInWithGoogleCredential as apiSignInWithGoogle,
  signInGuest as apiSignInGuest,
  sendPasswordReset as apiSendPasswordReset,
  FirebaseUser,
  AuthResult,
} from '../services/firebaseAuth';

const AUTH_USER_KEY = 'marketpulse_auth_user';
const AUTH_TOKEN_KEY = 'marketpulse_auth_token';

interface AuthState {
  user: FirebaseUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName?: string) => Promise<void>;
  signInWithGoogle: (emailOrUser?: string | FirebaseUser, name?: string, token?: string) => Promise<void>;
  signInGuestDemo: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

// Storage helpers with web & native fallbacks
async function setStoredItem(key: string, value: string) {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function getStoredItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    }
    const val = await SecureStore.getItemAsync(key);
    if (val) return val;
    return await AsyncStorage.getItem(key);
  } catch {
    return await AsyncStorage.getItem(key);
  }
}

async function removeStoredItem(key: string) {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    await AsyncStorage.removeItem(key);
  }
}

import { apiPost } from '../api/client';

async function syncUserToFirestore(user: FirebaseUser) {
  try {
    await apiPost('/api/users/sync', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL || '',
      isGuest: Boolean(user.isGuest),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    // Non-blocking sync log
    console.log('[Firestore User Sync Notice] Sync fallback:', err);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,

  initializeAuth: async () => {
    try {
      set({ isInitializing: true });
      const storedUser = await getStoredItem(AUTH_USER_KEY);
      const storedToken = await getStoredItem(AUTH_TOKEN_KEY);

      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser) as FirebaseUser;
        set({
          user,
          token: storedToken,
          isAuthenticated: true,
          isInitializing: false,
          error: null,
        });
        syncUserToFirestore(user);
        return;
      }
    } catch {
      // Fall through to unauthenticated
    } finally {
      set({ isInitializing: false });
    }
  },

  signIn: async (email: string, pass: string) => {
    try {
      set({ isLoading: true, error: null });
      const result: AuthResult = await apiSignInWithEmail(email.trim(), pass);
      await setStoredItem(AUTH_USER_KEY, JSON.stringify(result.user));
      await setStoredItem(AUTH_TOKEN_KEY, result.idToken);
      set({
        user: result.user,
        token: result.idToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      syncUserToFirestore(result.user);
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || 'Login failed. Please check your credentials.',
      });
      throw err;
    }
  },

  signUp: async (email: string, pass: string, displayName?: string) => {
    try {
      set({ isLoading: true, error: null });
      const result: AuthResult = await apiSignUpWithEmail(email.trim(), pass, displayName?.trim());
      await setStoredItem(AUTH_USER_KEY, JSON.stringify(result.user));
      await setStoredItem(AUTH_TOKEN_KEY, result.idToken);
      set({
        user: result.user,
        token: result.idToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      syncUserToFirestore(result.user);
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || 'Registration failed. Please check your details.',
      });
      throw err;
    }
  },

  signInWithGoogle: async (emailOrUser?: string | FirebaseUser, name?: string, token?: string) => {
    try {
      set({ isLoading: true, error: null });
      let user: FirebaseUser;
      let idToken: string;

      if (typeof emailOrUser === 'object' && emailOrUser !== null) {
        user = emailOrUser;
        idToken = token || `google_token_${user.uid}_${Date.now()}`;
      } else {
        const result: AuthResult = await apiSignInWithGoogle(emailOrUser, name);
        user = result.user;
        idToken = result.idToken;
      }

      await setStoredItem(AUTH_USER_KEY, JSON.stringify(user));
      await setStoredItem(AUTH_TOKEN_KEY, idToken);
      set({
        user,
        token: idToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      syncUserToFirestore(user);
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || 'Google sign-in failed. Please try again.',
      });
      throw err;
    }
  },

  signInGuestDemo: async () => {
    try {
      set({ isLoading: true, error: null });
      const result: AuthResult = await apiSignInGuest('Institutional Alpha Trader');
      await setStoredItem(AUTH_USER_KEY, JSON.stringify(result.user));
      await setStoredItem(AUTH_TOKEN_KEY, result.idToken);
      set({
        user: result.user,
        token: result.idToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      syncUserToFirestore(result.user);
    } catch (err: any) {
      set({
        isLoading: false,
        error: 'Failed to launch guest demo session.',
      });
      throw err;
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      await apiSendPasswordReset(email.trim());
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || 'Failed to send password reset link.',
      });
      throw err;
    }
  },

  signOut: async () => {
    try {
      await removeStoredItem(AUTH_USER_KEY);
      await removeStoredItem(AUTH_TOKEN_KEY);
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
