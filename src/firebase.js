import { auth, db, app } from "./firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendEmailVerification,
  applyActionCode,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Export authentication functions
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await storeFirebaseToken(user);
    return { success: true, user };
  } catch (error) {
    console.error("Login error:", { error: error.message, code: error.code });
    return { success: false, error: error.message };
  }
};

export const register = async (email, password, displayName = "") => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    await sendEmailVerification(user);
    await storeFirebaseToken(user);
    return {
      success: true,
      user,
      verificationEmailSent: true,
    };
  } catch (error) {
    console.error("Registration error:", { error: error.message, code: error.code });
    return { success: false, error: error.message };
  }
};

export const verifyEmail = async (actionCode) => {
  try {
    await applyActionCode(auth, actionCode);
    return { success: true };
  } catch (error) {
    console.error("Email verification error:", { error: error.message, code: error.code });
    return { success: false, error: error.message };
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await storeFirebaseToken(user);
    return { success: true, user };
  } catch (error) {
    console.error("Google sign-in error:", { error: error.message, code: error.code });
    return { success: false, error: error.message };
  }
};

export const setupRecaptcha = (phoneNumber) => {
  window.recaptchaVerifier = undefined;
  const recaptchaContainer = document.getElementById("recaptcha-container");
  if (!recaptchaContainer) {
    throw new Error("Recaptcha container not found in the DOM");
  }
  const recaptchaVerifier = new RecaptchaVerifier(
    recaptchaContainer,
    {
      size: "normal",
      callback: (response) => {
        console.log("reCAPTCHA verified");
      },
      "expired-callback": () => {
        console.log("reCAPTCHA expired");
      },
    },
    auth
  );
  return recaptchaVerifier.render().then(() => {
    return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  });
};

export const confirmPhoneCode = async (confirmationResult, code) => {
  try {
    const result = await confirmationResult.confirm(code);
    const user = result.user;
    await storeFirebaseToken(user);
    return { success: true, user };
  } catch (error) {
    console.error("Phone code confirmation error:", { error: error.message, code: error.code });
    return { success: false, error: error.message };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("firebaseToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userPurpose");
    localStorage.removeItem("companyName");
    return { success: true };
  } catch (error) {
    console.error("Logout error:", { error: error.message, code: error.code });
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const getIdToken = async (user = null, forceRefresh = false) => {
  if (!user) {
    user = auth.currentUser;
  }
  if (user) {
    return await user.getIdToken(forceRefresh);
  }
  return null;
};

export const storeFirebaseToken = async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken();
      localStorage.setItem("firebaseToken", token);
      setTimeout(() => {
        refreshToken(user);
      }, 55 * 60 * 1000);
      return token;
    } catch (error) {
      console.error("Error getting Firebase token:", { error: error.message, code: error.code });
      return null;
    }
  } else {
    localStorage.removeItem("firebaseToken");
    return null;
  }
};

export const refreshToken = async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken(true);
      localStorage.setItem("firebaseToken", token);
      setTimeout(() => {
        refreshToken(user);
      }, 55 * 60 * 1000);
      return token;
    } catch (error) {
      console.error("Error refreshing token:", { error: error.message, code: error.code });
      return null;
    }
  }
  return null;
};

export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      await storeFirebaseToken(user);
    }
    callback(user);
  });
};

export const setupFetchInterceptor = () => {
  const originalFetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    if (url.startsWith("/api/")) {
      const token = localStorage.getItem("firebaseToken");
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }
    return originalFetch(url, options);
  };
};

export const isEmailVerified = () => {
  const user = auth.currentUser;
  return user ? user.emailVerified : false;
};

// Export Firebase services
export { auth, app, db };