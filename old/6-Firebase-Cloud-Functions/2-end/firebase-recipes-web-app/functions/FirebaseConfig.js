const functions = require("firebase-functions");
const admin = require("firebase-admin");

const FIREBASE_STORAGE_BUCKET = "fir-recipes-3d91c.appspot.com";

const apiFirebaseOption = {
  ...functions.config().firebase,
  credential: admin.credential.applicationDefault(),
};
admin.initializeApp(apiFirebaseOption);

const firestore = admin.firestore();
const settings = { timestampsInSnapshots: true };

firestore.settings(settings);

const storageBucket = admin.storage().bucket(FIREBASE_STORAGE_BUCKET);
const auth = admin.auth();

module.exports = { functions, auth, firestore, storageBucket, admin };
