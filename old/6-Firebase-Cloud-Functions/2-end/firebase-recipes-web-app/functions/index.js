require('dotenv').config();

const recipesApiApp = require('./recipes-api');
const firebaseAdmin = require('./FirebaseConfig');
const functions = firebaseAdmin.functions;
const firestore = firebaseAdmin.firestore;
const storageBucket = firebaseAdmin.storageBucket;

exports.api = functions.https.onRequest(recipesApiApp);

exports.onCreateRecipe = functions.firestore
  .document('recipes/{recipeId}')
  .onCreate(async (snap, context) => {
    const docRef = firestore
      .collection('collectionDocumentCount')
      .doc('allRecipeDocumentsCount');
    const doc = await docRef.get();

    if (doc.exists) {
      docRef.update({ count: firestore.FieldValue.increment(1) });
    } else {
      docRef.set({ count: 1 });
    }
  });

exports.onDeleteRecipe = functions.firestore
  .document('recipes/{recipeId}')
  .onDelete(async (snap, context) => {
    const recipe = snap.data();
    const imageUrl = recipe.imageUrl;

    if (imageUrl) {
      const decodedUrl = decodeURIComponent(imageUrl);
      const startIndex = decodedUrl.indexOf('/o/') + 3;
      const endIndex = decodedUrl.indexOf('?');
      const fullFilePath = decodedUrl.substring(startIndex, endIndex);
      const file = storageBucket.file(fullFilePath);

      console.log(`Attempting to delete: ${fullFilePath}`);

      try {
        await file.delete();
        console.log('Successfully deleted image');
      } catch (error) {
        console.log(`Failed to Delete File: ${error.message}`);
      }
    }

    const docRef = firestore
      .collection('collectionDocumentCount')
      .doc('allRecipeDocumentsCount');
    const doc = await docRef.get();

    if (doc.exists) {
      docRef.update({
        count: firestore.FieldValue.increment(-1),
      });
    } else {
      docRef.set({ count: 0 });
    }

    if (recipe.isPublished) {
      const docRef = firestore
        .collection('collectionDocumentCount')
        .doc('publishedRecipeDocumentsCount');
      const doc = await docRef.get();

      if (doc.exists) {
        docRef.update({
          count: firestore.FieldValue.increment(-1),
        });
      } else {
        docRef.set({ count: 0 });
      }
    }
  });

// CRONJOB TOOL - https://crontab.guru/
const runtimeOptions = {
  timeoutSeconds: 300,
  memory: '256MB',
};

exports.dailyCheckRecipePublishDate = functions
  .runWith(runtimeOptions)
  .pubsub.schedule('0 0 * * *') // at minute 0 (midnight) every day, server time
  .onRun(async () => {
    console.log('dailyCheckRecipePublishDate() called - time to check');

    const snapshot = await firestore
      .collection('recipes')
      .where('isPublished', '==', false)
      .get();

    snapshot.forEach(async (doc) => {
      const data = doc.data();
      const now = Date.now() / 1000;
      const isPublished = data.publishDate._seconds <= now ? true : false;

      if (isPublished) {
        console.log(`Recipe: ${data.name} is now published!`);
        firestore.collection('recipes').doc(doc.id).set(
          { isPublished },
          {
            merge: true,
          }
        );

        const publishedRecipeDocumentsCountRef = firestore
          .collection('collectionDocumentCount')
          .doc('publishedRecipeDocumentsCount');
        const publishedRecipeDocumentsCountDoc = await publishedRecipeDocumentsCountRef.get();

        if (publishedRecipeDocumentsCountDoc.exists) {
          publishedRecipeDocumentsCountRef.update({
            count: firestore.FieldValue.increment(1),
          });
        } else {
          publishedRecipeDocumentsCountRef.set({ count: 1 });
        }
      }
    });
  });

console.log('🚀🚀🚀 SERVER STARTED 🚀🚀🚀');
