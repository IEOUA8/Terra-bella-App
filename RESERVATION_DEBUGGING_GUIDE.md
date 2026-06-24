# 🛠️ Reservation System Debugging Guide

This comprehensive guide is designed to help you test, verify, and debug the reservation creation process in the application.

---

## 📋 1. Component Checklist

Ensure these components are correctly implemented and interacting:

- [ ] **`src/hooks/useReservations.js`**: Contains `createReservation` logic, Supabase calls, and notifications.
- [ ] **`src/components/ReservationForm.jsx`**: User interface for selecting dates and times.
- [ ] **`src/components/QuickReservationModal.jsx`**: Admin modal for quick bookings.
- [ ] **`src/pages/AdminPage.jsx`**: Parent component for admin actions.
- [ ] **`Supabase Database`**: `reservations` table with RLS policies enabled.

---

## 🧪 2. Step-by-Step Testing Guide

### Scenario A: Resident Reservation
1.  **Login**: Access the app as a Resident.
2.  **Navigate**: Go to Dashboard.
3.  **Select Area**: Click on a Social Area card (e.g., "BBQ Zone").
4.  **Pick Date**: Choose a future date.
5.  **Pick Time**: Select an available time slot (green/unselected).
6.  **Confirm**: Click "Confirmar Reserva".
    *   *Expected*: Success toast appears, redirected to dashboard, reservation appears in "Mis Reservas".

### Scenario B: Admin Quick Reservation
1.  **Login**: Access the app as an Admin.
2.  **Open Modal**: Click "Reserva Rápida" in the top bar.
3.  **Fill Details**: Select Area, Date, Time.
4.  **Submit**: Click "Crear Reserva".
    *   *Expected*: Success toast appears, table updates immediately.

---

## 💻 3. Console Debugging Commands

Open Chrome DevTools (**F12** or **Right Click > Inspect**), go to the **Console** tab.

### Check if Function is Called
We have added specific logs to `useReservations.js`. Look for:
*   `🚀 Starting createReservation:` - Shows input data.
*   `💾 Inserting reservation into Supabase:` - Shows payload sent to DB.
*   `✅ Reservation created successfully:` - Confirms DB insertion.
*   `DEBUG: Sending payload to Edge Function:` - Confirms notification trigger.

### Manually Trigger a Log Check
If you suspect the button isn't working, paste this in the console to see if the hook is active (only works if you have React DevTools or expose the hook, otherwise rely on the logs above).

---

## 🗄️ 4. SQL Verification Queries

Use the Supabase **SQL Editor** to verify data.

**Verify Latest Reservation:**