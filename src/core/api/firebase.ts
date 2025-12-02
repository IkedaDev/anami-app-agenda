import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore"; // Usamos initializeFirestore en lugar de getFirestore

/**
 * CONFIGURACIÓN MULTI-ENTORNO
 * * React Native nos da la variable global __DEV__:
 * - true: Estás corriendo en local (expo start)
 * - false: Es una build de producción (APK/IPA instalada)
 */

// 1. Configuración de Desarrollo
const devConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 2. Configuración de Producción
const prodConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY_PROD ||
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_PROD ||
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID_PROD ||
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_PROD ||
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD ||
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID_PROD ||
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 3. Selección automática
const firebaseConfig = __DEV__ ? devConfig : prodConfig;

if (!firebaseConfig.apiKey) {
  console.error(
    `Firebase Error: API Key no encontrada. Entorno: ${
      __DEV__ ? "DEV" : "PROD"
    }`
  );
}

// Inicializar Firebase App
const app = initializeApp(firebaseConfig);

// 4. Inicializar Firestore con la corrección para React Native
// 'experimentalForceLongPolling: true' soluciona el error de timeout/conexión
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
