/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */

// Import Firebase scripts via CDN (Service Workers often require importScripts instead of ES modules)
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfBOeIhpL88_-vG2hpQcyTWmH_vkIMcQQ",
  authDomain: "terrabella-app-f38c1.firebaseapp.com",
  projectId: "terrabella-app-f38c1",
  storageBucket: "terrabella-app-f38c1.firebasestorage.app",
  messagingSenderId: "863033099248",
  appId: "1:863033099248:web:c3e326a04799c7200d5335"
};

// Initialize Firebase (Compat version)
try {
  firebase.initializeApp(firebaseConfig);
  console.log('[firebase-messaging-sw.js] Firebase initialized successfully');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Error initializing Firebase:', error);
}

// Retrieve Firebase Messaging object
let messaging;
try {
  messaging = firebase.messaging();
} catch (error) {
  console.error('[firebase-messaging-sw.js] Error getting messaging instance:', error);
}

// Handle Background Messages
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Customize notification here
    const notificationTitle = payload.notification?.title || "Nueva Notificación";
    const notificationOptions = {
      body: payload.notification?.body || "Has recibido una nueva actualización.",
      icon: '/apple-touch-icon.png', // Ensure this icon exists in public folder or use a default
      data: payload.data || {},
      // Add explicit badge if available
      badge: '/favicon.ico' 
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}