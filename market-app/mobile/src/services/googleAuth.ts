/**
 * Google Sign-In Service
 *
 * Uses @react-native-google-signin/google-signin when compiled into a native
 * build (EAS / expo run:android). Gracefully degrades in Expo Go so the
 * rest of the app still loads and works.
 *
 * Lazy-required so Expo Go doesn't crash at module load time.
 */
import { FirebaseUser } from './firebaseAuth';

export interface GoogleAuthResult {
  user: FirebaseUser;
  idToken?: string;
  accessToken?: string;
}

// Lazy-load the native module — fails silently in Expo Go
function getNativeModule(): { GoogleSignin: any; statusCodes: any } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@react-native-google-signin/google-signin');
  } catch {
    return null;
  }
}

let initialized = false;

export async function promptGoogleOAuth(): Promise<GoogleAuthResult | null> {
  const native = getNativeModule();

  if (!native) {
    throw new Error(
      'Google Sign-In requires a native build.\n\nUse email/password to sign in while the EAS build is in progress.'
    );
  }

  const { GoogleSignin, statusCodes } = native;

  if (!initialized) {
    GoogleSignin.configure({
      webClientId:
        '581648350696-p98uiho5vjeh7ll24q62jjkp6pdhb2j2.apps.googleusercontent.com',
      offlineAccess: false,
      scopes: ['profile', 'email'],
    });
    initialized = true;
  }

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();
    const googleUser = userInfo.data?.user;
    const tokens = await GoogleSignin.getTokens();

    if (!googleUser?.email) {
      throw new Error('No email returned from Google Sign-In.');
    }

    return {
      user: {
        uid: `goog_${googleUser.id || Date.now()}`,
        email: googleUser.email,
        displayName:
          googleUser.name ||
          googleUser.givenName ||
          googleUser.email.split('@')[0],
        photoURL: googleUser.photo || undefined,
        isGuest: false,
      },
      idToken: userInfo.data?.idToken || undefined,
      accessToken: tokens.accessToken,
    };
  } catch (err: any) {
    if (err.code === statusCodes?.SIGN_IN_CANCELLED) return null;
    if (err.code === statusCodes?.IN_PROGRESS) return null;
    if (err.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available on this device.');
    }
    throw new Error(err?.message || 'Google Sign-In failed.');
  }
}
