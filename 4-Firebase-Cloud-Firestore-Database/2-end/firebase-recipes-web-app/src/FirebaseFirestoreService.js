import firebase from 'firebase';

const config = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

if (!firebase.apps.length) {
    firebase.initializeApp(config);
}

const firestore = firebase.firestore();

const create = (collection, document) => {
    return firestore.collection(collection).add(document);
};

const read = (collection) => {
    return firestore.collection(collection).get();
};

const update = (collection, id, document) => {
    return firestore.collection(collection).doc(id).update(document);
};

const FirebaseFirestoreService = {
    create,
    read,
    update,
};

export default FirebaseFirestoreService;
