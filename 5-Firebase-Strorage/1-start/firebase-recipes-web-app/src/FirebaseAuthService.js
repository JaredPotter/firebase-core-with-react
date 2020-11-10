import firebase from 'firebase';

const config = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

if (!firebase.apps.length) {
    firebase.initializeApp(config);
}

const auth = firebase.auth();

const registerUser = (email, password) => {
    return auth.createUserWithEmailAndPassword(email, password);
};

const loginUser = (email, password) => {
    return auth.signInWithEmailAndPassword(email, password);
};

const logoutUser = () => {
    return auth.signOut();
};

const sendResetPassword = (email) => {
    return auth.sendPasswordResetEmail(email);
};

const loginWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();

    return auth.signInWithPopup(provider);
};

const subscribeToAuthChanges = (handleAuthChange) => {
    auth.onAuthStateChanged((user) => {
        handleAuthChange(user);
    });
};

const FirebaseAuthService = {
    registerUser,
    loginUser,
    logoutUser,
    sendResetPassword,
    loginWithGoogle,
    subscribeToAuthChanges,
};

export default FirebaseAuthService;
