# Firebase Authentication Setup Guide

This guide explains how to configure Firebase Authentication with Google Sign-In for both development and production environments.

## Prerequisites

1. Firebase project with Authentication enabled
2. Google OAuth 2.0 credentials configured in Firebase Console
3. Domain authorization for your app

## Firebase Console Configuration

### 1. Enable Google Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `my-recipe-book-anteuz`
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Google** provider
5. Add your OAuth 2.0 client ID and secret

### 2. Configure Authorized Domains

Add these domains to your authorized domains list:

**Development:**
- `localhost`
- `127.0.0.1`

**Production:**
- `my-recipe-book-anteuz.web.app`
- `my-recipe-book-anteuz.firebaseapp.com`
- Your custom domain (if any)

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Create or update OAuth 2.0 Client ID:
   - **Application type**: Web application
   - **Authorized JavaScript origins**:
     - `http://localhost:4200` (development)
     - `https://my-recipe-book-anteuz.web.app` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:4200/__/auth/handler` (development)
     - `https://my-recipe-book-anteuz.web.app/__/auth/handler` (production)

## Environment Configuration

Update the following files with your actual Firebase configuration:

### Development Environment (`src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    databaseURL: 'https://your-project.firebaseio.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'your-sender-id',
    appId: 'your-app-id'
  },
  auth: {
    useEmulator: false, // Set to true for local testing
    emulatorUrl: 'http://localhost:9099',
    enableDebugMode: true,
    googleAuth: {
      clientId: 'your-google-client-id.apps.googleusercontent.com',
      scopes: ['email', 'profile']
    }
  }
};
```

### Production Environment (`src/environments/environment.prod.ts`)

```typescript
export const environment = {
  production: true,
  firebase: {
    // Same config as development
  },
  auth: {
    useEmulator: false,
    enableDebugMode: false,
    googleAuth: {
      clientId: 'your-google-client-id.apps.googleusercontent.com',
      scopes: ['email', 'profile']
    }
  }
};
```

## Security Configuration

### Database Rules (`database.rules.json`)

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

### Storage Rules (`storage.rules`)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing Configuration

### Local Development with Emulators

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Start emulators: `firebase emulators:start --only auth`
3. Set `useEmulator: true` in development environment
4. Access Auth Emulator UI at: `http://localhost:4000/auth`

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.service.spec.ts

# Run tests in watch mode
npm test -- --watch
```

## Deployment

### Build and Deploy

```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
npm run deploy

# Deploy only hosting
npm run deploy:hosting

# Deploy only database/storage rules
npm run deploy:rules
```

## Troubleshooting

### Common Issues

1. **Popup blocked**: Ensure pop-ups are allowed in browser settings
2. **Redirect not working**: Check authorized redirect URIs in Google Cloud Console
3. **CORS errors**: Verify authorized domains in Firebase Console
4. **Token issues**: Ensure Firebase project is properly configured

### Debug Mode

Enable debug mode in development environment to see detailed authentication logs:

```typescript
auth: {
  enableDebugMode: true
}
```

## Security Best Practices

1. **Never expose sensitive keys**: Use environment variables for production
2. **Validate tokens server-side**: Always verify Firebase ID tokens on your backend
3. **Implement proper logout**: Clear all user data and tokens on sign-out
4. **Use HTTPS in production**: Ensure all production URLs use HTTPS
5. **Monitor authentication events**: Set up logging for security monitoring

## Mobile Considerations

For mobile apps (Capacitor/Cordova):
- Use `signInWithRedirect` instead of `signInWithPopup`
- Handle redirect results properly
- Configure deep linking for OAuth callbacks
- Test on actual devices, not just simulators