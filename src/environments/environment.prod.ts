export const environment = {
  production: true,
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
    // Production settings
    useEmulator: false,
    emulatorUrl: '',
    enableDebugMode: false,
    // Google OAuth settings
    googleAuth: {
      clientId: '943220346016-your-google-client-id.apps.googleusercontent.com', // Add your actual client ID
      scopes: ['email', 'profile']
    }
  },
  api: {
    baseUrl: 'https://my-recipe-book-anteuz.web.app',
    timeout: 30000
  }
};