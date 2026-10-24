# Integration status after review

This package preserves the working mobile login, catalogue, cart, checkout, and order history, and adds mobile customer service-request and dealer-application forms backed by Firestore functions.

## Still requires configuration / implementation before claiming fully complete
- Firestore rules must be reviewed and published. Existing `firebase/firestore.rules` permits service request owner reads and admin updates; dealer application rules are not yet present and must be added before the dealer form can write.
- Admin dashboard currently uses local demo data; it is not connected to Firebase. It must be wired to Firestore and protected by a trusted admin role before use.
- Dealer wholesale pricing and bulk order creation are not yet implemented; this version only submits and displays dealer application status.
- Instagram JSON is a starter only. It does not have a working AI image generation provider, public image hosting, or configured Meta API credentials.
- Do not activate any workflow or deploy an admin panel until secrets, permissions, and rules have been reviewed.

## Next steps
1. Merge the dealerApplications Firestore rule described in the handoff; don't replace your currently working rules without testing.
2. Install dependencies in mobile with `npm install`, then run `npx expo start --offline --clear`.
3. Test service request create/list and dealer application create/list on a test account.
4. Wire admin panel to Firebase and configure admin authorization.
5. Configure Instagram publishing and test manually before enabling daily schedule.
