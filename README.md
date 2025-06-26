# JosenianBorrowEase

An Ionic/Angular application for borrowing and managing items within an institution.

## Firebase Setup

### Firestore Indexes

If you encounter Firestore index errors like:
```
Error: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Follow these steps:
1. Click on the provided link in the error message
2. This will take you directly to the Firebase Console with the proper index configuration
3. Click "Create Index" on the Firebase Console page
4. Wait for the index to finish building (this can take a few minutes)

The app requires the following indexes:
- Collection: `borrowRequests`, Fields: `status` (Ascending) + `requestDate` (Descending)
- Collection: `borrowRequests`, Fields: `requesterEmail` (Ascending) + `requestDate` (Descending)

### CORS Configuration for Firebase Storage

If you encounter CORS errors when uploading images to Firebase Storage, follow these steps:

1. Install Google Cloud SDK (which includes gsutil):
   - Download from: https://cloud.google.com/sdk/docs/install
   - Follow the installation instructions for your OS

2. Authenticate with Google Cloud:
   ```
   gcloud auth login
   ```

3. Deploy the CORS configuration using gsutil:
   ```
   gsutil cors set cors.json gs://YOUR-FIREBASE-BUCKET.appspot.com
   ```
   Note: Replace YOUR-FIREBASE-BUCKET with your actual Firebase project ID

4. Alternatively, you can go to the Firebase Console:
   - Navigate to Storage in the Firebase Console
   - Go to Rules
   - Make sure your rules allow reading and writing for authenticated users:

   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read;
         allow write: if request.auth != null;
       }
     }
   }
   ```

## Development

### Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Run the application locally:
   ```
   ionic serve
   ```

### Firebase Configuration

The application uses Firebase for authentication, storage, and database. Make sure to update the Firebase configuration in your environment files:

1. Update `src/environments/environment.ts` for development
2. Update `src/environments/environment.prod.ts` for production

### Building for Production

```
ionic build --prod
```

## Features

- User authentication with Firebase
- Item browsing and filtering by department
- Item borrowing request system
- Request approval workflow
- Item management for administrators
- Real-time updates with Firebase
