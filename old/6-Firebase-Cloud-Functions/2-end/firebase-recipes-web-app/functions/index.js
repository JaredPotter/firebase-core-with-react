const recipesApiApp = require('./recipes-api');
const firebaseConfig = require('./FirebaseConfig');
const functions = firebaseConfig.functions;
const firestore = firebaseConfig.firestore;
const storageBucket = firebaseConfig.storageBucket;
const admin = firebaseConfig.admin;

exports.api = functions.https.onRequest(recipesApiApp);

exports.onCreateRecipe = functions.firestore
  .document('recipes/{recipeId}')
  .onCreate(async (snap, context) => {
    const countDocRef = firestore.collection('recipeCounts').doc('all');
    const countDoc = await countDocRef.get();

    if (countDoc.exists) {
      countDocRef.update({ count: admin.firestore.FieldValue.increment(1) });
    } else {
      countDocRef.set({ count: 1 });
    }

    const recipe = snap.data();

    if (recipe.isPublished) {
      const countPublishDocRef = firestore
        .collection('recipeCounts')
        .doc('published');
      const countPublishDoc = await countPublishDocRef.get();

      if (countPublishDoc.exists) {
        countPublishDocRef.update({
          count: admin.firestore.FieldValue.increment(1),
        });
      } else {
        countPublishDocRef.set({ count: 1 });
      }
    }
  });

exports.onUpdateRecipe = functions.firestore
  .document('recipes/{recipeId}')
  .onUpdate(async (change, context) => {
    const oldRecipe = change.before.data();
    const newRecipe = change.after.data();

    let publishCount = 0;

    if (!oldRecipe.isPublished && newRecipe.isPublished) {
      publishCount += 1;
    } else if (oldRecipe.isPublished && !newRecipe.isPublished) {
      publishCount += -1;
    }

    if (publishCount !== 0) {
      const publishedCountDocRef = firestore
        .collection('recipeCounts')
        .doc('published');
      const publishedCountDoc = await publishedCountDocRef.get();

      if (publishedCountDoc.exists) {
        publishedCountDocRef.update({
          count: admin.firestore.FieldValue.increment(publishCount),
        });
      } else {
        if (publishCount > 0) {
          publishedCountDocRef.set({ count: publishCount });
        } else {
          publishedCountDocRef.set({ count: 0 });
        }
      }
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

    const docRef = firestore.collection('recipeCounts').doc('all');
    const doc = await docRef.get();

    if (doc.exists) {
      docRef.update({
        count: admin.firestore.FieldValue.increment(-1),
      });
    } else {
      docRef.set({ count: 0 });
    }

    if (recipe.isPublished) {
      const publishedDocRef = firestore
        .collection('recipeCounts')
        .doc('published');
      const publishedDoc = await publishedDocRef.get();

      if (publishedDoc.exists) {
        publishedDocRef.update({
          count: admin.firestore.FieldValue.increment(-1),
        });
      } else {
        publishedDocRef.set({ count: 0 });
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
      }
    });
  });

console.log('🚀🚀🚀 SERVER STARTED 🚀🚀🚀');
