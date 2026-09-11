# Firebase Authentication Setup

This project uses Firebase Authentication for user management. Follow these steps to set up Firebase for your EcoDrop application.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "ecodrop-app")
4. Follow the setup wizard

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

## 3. Get Firebase Configuration

1. In your Firebase project, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select the web icon (</>)
4. Register your app with a nickname (e.g., "EcoDrop Web")
5. Copy the Firebase configuration object

## 4. Update Firebase Configuration

1. Open `src/lib/firebase.ts`
2. Replace the placeholder configuration with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## 5. Test the Application

1. Run `npm run dev`
2. Navigate to `http://localhost:8081`
3. Click "Start Recycling Today" or any CTA button
4. Try creating a new account
5. Test logging in and out

## Features Implemented

- ✅ User registration with email/password
- ✅ User login with email/password
- ✅ Protected routes (/user, /volunteer, /admin)
- ✅ User authentication state management
- ✅ Logout functionality
- ✅ User display name in navigation
- ✅ Automatic redirect to login for protected routes

## Security Notes

- All routes except `/` require authentication
- Users are automatically redirected to home page if not logged in
- User session persists across browser refreshes
- Logout clears the session and redirects to home page

## Troubleshooting

If you encounter issues:

1. **Firebase config errors**: Double-check your configuration values
2. **Authentication not working**: Ensure Email/Password is enabled in Firebase Console
3. **Build errors**: Make sure all dependencies are installed with `npm install`
4. **CORS issues**: Firebase handles CORS automatically for web apps

## Next Steps

After setting up Firebase:

1. Configure Firestore for user data storage
2. Add user profile management
3. Implement role-based access control
4. Add password reset functionality
5. Set up email verification
