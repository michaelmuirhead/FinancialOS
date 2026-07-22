# HomeVault Firebase Setup — Status

Project: **HomeVault** (`homevault-ee378`) at https://console.firebase.google.com/project/homevault-ee378

## Done (via console)
- Firebase project created, on the Blaze plan
- Authentication enabled: Email/Password and Google sign-in
- Firestore database created (production mode, nam5/US) and the repo's `firestore.rules` published
- Cloud Storage bucket created and the repo's `storage.rules` published (cross-service Firestore permission attached)
- Web app registered ("HomeVault Web") and config values captured into `.env` (attached earlier)

## Left to do — all from your terminal, in your local `FinancialOS` checkout

These need the Firebase CLI and your actual repo files, so they can't be done from the browser.

### 1. Local dev (already usable)
```
npm install
npm run dev
```
Copy the attached `.env` into the repo root first if you haven't.

### 2. Deploy the screenshot-import Cloud Function
```
npm install -g firebase-tools   # if not already installed
firebase login
firebase use homevault-ee378
cd functions && npm install && cd ..
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase deploy --only functions
```
You'll be prompted to paste your Anthropic API key at the `secrets:set` step.

### 3. Deploy the app to Firebase Hosting (this is what gets you a URL for iPad)
```
npm run build
firebase deploy --only hosting
```
This publishes to `https://homevault-ee378.web.app` (and `.firebaseapp.com`). Firebase Hosting doesn't need any separate setup in the console — the site is created automatically the first time you run this deploy command.

## Using it on iPad
1. Open `https://homevault-ee378.web.app` in Safari on the iPad.
2. Tap the Share icon → "Add to Home Screen" — this installs it as a PWA with its own icon.
3. Sign in with email/password or Google (your household and default budget categories get created automatically on first sign-in).
4. Use the "Import from screenshot" quick action on the Dashboard — it'll let you pick a photo or screenshot from your Photos library, then send it through the Cloud Function you deployed in step 2 to extract balances/bills/transactions for review.

Note: steps 2 and 3 are independent — you can deploy Hosting without the Cloud Function, but the screenshot-import button won't do anything useful until the function is deployed too.
