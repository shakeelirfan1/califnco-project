# Firebase integration still required
The current mobile and admin interfaces use local demo state. To make this assignment live:
- Add Firebase SDK and environment configuration to each app.
- Seed `/products` with 50+ records.
- Create `/users/{uid}` profiles through a trusted setup process; never expose admin role assignment to public clients.
- Connect orders and service requests to Firestore.
- Deploy and test `firestore.rules` in the Firebase Emulator before production.
- Configure FCM and verify on a physical Android device.
The included rules are a starting point and need schema-specific tests before deployment.
