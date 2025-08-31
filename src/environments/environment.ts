// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyAc5IDI2how-YtxRDBIAnR-ykewSjeLALs',
    authDomain: 'my-recipe-book-anteuz.firebaseapp.com',
    databaseURL: 'https://my-recipe-book-anteuz.firebaseio.com',
    projectId: 'my-recipe-book-anteuz',
    storageBucket: 'my-recipe-book-anteuz.appspot.com',
    messagingSenderId: '943220346016',
    appId: '1:943220346016:web:your-app-id-here' // Add your actual app ID
  },
  auth: {
    // Development settings
    useEmulator: false, // Set to true to use Firebase Auth Emulator
    emulatorUrl: 'http://localhost:9099',
    enableDebugMode: true,
    // Google OAuth settings
    googleAuth: {
      clientId: '943220346016-your-google-client-id.apps.googleusercontent.com', // Add your actual client ID
      scopes: ['email', 'profile']
    }
  },
  api: {
    baseUrl: 'http://localhost:4200',
    timeout: 30000
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.