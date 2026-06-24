# Push Notification System Verification Checklist

This document outlines the steps to verify the correct implementation and functionality of the push notification system, following the recent fixes and optimizations.

---

## 1. System Fixes Applied

*   **Service Worker Config**: Updated `public/firebase-messaging-sw.js` to use `importScripts` and the Firebase Compat API, resolving module loading errors in the Service Worker context.
*   **Linting Rules**: Added ESLint directives to suppress `no-undef` errors for global variables (`firebase`, `importScripts`) that are valid in the Service Worker environment.
*   **Background Handling**: Implemented `onBackgroundMessage` to correctly handle notifications when the app is closed or in the background.

---

## 2. Step-by-Step Verification Instructions

### A. Verify Service Worker Registration
1.  **Deployment/Start**: Ensure the app is running (`npm run dev`).
2.  **Browser Developer Tools**:
    *   Open the app in Chrome (or any Chromium-based browser).
    *   Open Developer Tools (`F12` or `Right Click > Inspect`).
    *   Go to the **Application** tab.
    *   Navigate to **Service Workers** on the left sidebar.
3.  **Status Check**:
    *   Confirm you see `firebase-messaging-sw.js` listed.
    *   Status should be green and say **"Activated and is running"**.
    *   If it says "Redundant" or "Error", click "Unregister", then refresh the page.

### B. Verify Token Generation
1.  Log in to the application.
2.  Open the **Console** tab in Developer Tools.
3.  Look for the log message: `FCM Token generated: <token_string>`.
4.  If you see `Permission denied`, ensure you have clicked "Allow" on the browser's notification permission prompt.

---

## 3. Debugging Commands (Browser Console)

Copy and paste these commands into your browser console to diagnose issues manually.

**Check Service Worker Registration:**