const functions = require('firebase-functions');
const admin = require('firebase-admin');
require('dotenv').config();

const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET;

if (!FIREBASE_STORAGE_BUCKET) {
  console.log(
    'environment variable not set. Please add FIREBASE_STORAGE_BUCKET to your .env file. Aborting Now.'
  );

  return;
}

const FIREBASE_SERVICE_ACCOUNT_FILENAME =
  process.env.FIREBASE_SERVICE_ACCOUNT_FILENAME;

if (!FIREBASE_SERVICE_ACCOUNT_FILENAME) {
  console.log(
    'environment variable not set. Please add FIREBASE_SERVICE_ACCOUNT_FILENAME to your .env file. Aborting Now.'
  );

  return;
}

const serviceAccount = require(`./${FIREBASE_SERVICE_ACCOUNT_FILENAME}`);

if (!serviceAccount) {
  console.log(
    'firebase service account not set. Please add firebase service account. Aborting Now.'
  );

  return;
}

const apiFirebaseOption = {
  ...functions.config().firebase,
  credential: admin.credential.cert(serviceAccount),
};
admin.initializeApp(apiFirebaseOption);

const firestore = admin.firestore();
const settings = { timestampsInSnapshots: true };

firestore.settings(settings);

const storageBucket = admin.storage().bucket(FIREBASE_STORAGE_BUCKET);
const auth = admin.auth();

module.exports = { functions, auth, firestore, storageBucket, admin };
