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

const firestore = firebase.firestore();

const createDocument = (collection, document) => {
    return firestore.collection(collection).add(document);
};

const readDocument = (collection, id) => {
    return firestore.collection(collection).doc(id).get();
};

const readDocuments = async (
    collection,
    queries,
    orderByField,
    orderByDirection,
    perPage,
    cursorId
) => {
    let collectionRef = firestore.collection(collection);

    if (queries && queries.length > 0) {
        for (const query of queries) {
            const queryField = query.field;
            const queryCondition = query.condition;
            const queryValue = query.value;
            collectionRef = collectionRef.where(
                queryField,
                queryCondition,
                queryValue
            );
        }
    }

    if (orderByField && orderByDirection) {
        collectionRef = collectionRef.orderBy(orderByField, orderByDirection);
    }

    if (perPage) {
        collectionRef = collectionRef.limit(perPage);
    }

    if (cursorId) {
        const document = await readDocument(collection, cursorId);

        collectionRef = collectionRef.startAfter(document);
    }

    return collectionRef.get();
};

const updateDocument = (collection, id, document) => {
    return firestore.collection(collection).doc(id).update(document);
};

const deleteDocument = (collection, id) => {
    return firestore.collection(collection).doc(id).delete();
};

const FirebaseFirestoreService = {
    createDocument,
    readDocument,
    readDocuments,
    updateDocument,
    deleteDocument,
};

export default FirebaseFirestoreService;
