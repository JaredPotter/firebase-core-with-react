const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const firebaseConfig = require('./FirebaseConfig');
const utilities = require('./utilities');

const FIRESTORE_RECIPE_COLLECTION = process.env.FIRESTORE_RECIPE_COLLECTION;

if (!FIRESTORE_RECIPE_COLLECTION) {
  console.log(
    'environment variable not set. Please add FIRESTORE_RECIPE_COLLECTION to your .env file. Aborting Now.'
  );

  return;
}

const firebaseAuth = firebaseConfig.auth;
const firestore = firebaseConfig.firestore;

const app = express();

app.use(cors({ origin: true }));

app.use(bodyParser.json());

// ~~ RESTFUL CRUD WEB API ENDPOINTS ~~

app.post('/recipes', async (request, response) => {
  const authorizationHeader = request.headers['authorization'];

  if (!authorizationHeader) {
    response.status(401).send('Missing Authorization header');
    return;
  }

  try {
    await utilities.authorizeUser(authorizationHeader, firebaseAuth);
  } catch (error) {
    response.status(401).send(error.message);
    return;
  }

  const newRecipe = request.body;
  const missingFields = utilities.validateRecipePostPut(newRecipe);

  if (missingFields) {
    response
      .status(400)
      .send(`Recipe is not valid. Missing/invalid fields: ${missingFields}`);
    return;
  }

  const recipe = utilities.sanitizeRecipePostPut(newRecipe);

  try {
    const firestoreResponse = await firestore
      .collection(FIRESTORE_RECIPE_COLLECTION)
      .add(recipe);

    const recipeId = firestoreResponse.id;

    response.status(201).send({ id: recipeId });
  } catch (error) {
    response.status(400).send(error.message);
    return;
  }
});

app.get('/recipes', async (request, response) => {
  const authorizationHeader = request.headers['authorization'];
  const queryObject = request.query;
  const category = queryObject['category'] ? queryObject['category'] : '';
  const orderByField = queryObject['orderByField']
    ? queryObject['orderByField']
    : '';
  const orderByDirection = queryObject['orderByDirection']
    ? queryObject['orderByDirection']
    : 'asc';
  const pageNumber = queryObject['pageNumber'] ? queryObject['pageNumber'] : '';
  const perPage = queryObject['perPage'] ? queryObject['perPage'] : '';
  const cursorId = queryObject['cursorId'] ? queryObject['cursorId'] : '';

  let isAuth = false;
  let collectionRef = firestore.collection(FIRESTORE_RECIPE_COLLECTION);

  try {
    await utilities.authorizeUser(authorizationHeader, firebaseAuth);

    isAuth = true;
  } catch (error) {
    collectionRef = collectionRef.where('isPublished', '==', true);
  }

  if (category) {
    collectionRef = collectionRef.where('category', '==', category);
  }

  if (orderByField) {
    collectionRef = collectionRef.orderBy(orderByField, orderByDirection);
  }

  if (perPage) {
    collectionRef = collectionRef.limit(Number(perPage));
  }

  if (pageNumber > 0 && perPage) {
    const pageNumberMultiplier = pageNumber - 1;
    const offset = pageNumberMultiplier * perPage;
    collectionRef = collectionRef.offset(offset);
  } else if (cursorId) {
    try {
      const documentSnapshot = await firestore
        .collection(FIRESTORE_RECIPE_COLLECTION)
        .doc(cursorId)
        .get();
      collectionRef = collectionRef.startAfter(documentSnapshot);
    } catch (error) {
      response.status(400).send(error.message);
      return;
    }
  }

  let recipeCount = 0;
  let countDocRef;

  if (isAuth) {
    countDocRef = firestore.collection('recipeCounts').doc('all');
  } else {
    countDocRef = firestore.collection('recipeCounts').doc('published');
  }

  const countDoc = await countDocRef.get();

  if (countDoc.exists) {
    const countDocData = countDoc.data();

    if (countDocData) {
      recipeCount = countDocData.count;
    }
  }

  try {
    const firestoreResponse = await collectionRef.get();
    const fetchedRecipes = firestoreResponse.docs.map((recipe) => {
      const id = recipe.id;
      const data = recipe.data();
      data.publishDate = data.publishDate._seconds;

      return { ...data, id };
    });
    const payload = {
      recipeCount,
      documents: fetchedRecipes,
    };

    response.status(200).send(payload);
  } catch (error) {
    response.status(400).send(error.message);
  }
});

app.get('/recipes/:id', async (request, response) => {
  const id = request.params.id;

  try {
    const documentSnapshot = await firestore
      .collection(FIRESTORE_RECIPE_COLLECTION)
      .doc(id)
      .get();

    if (documentSnapshot.exists) {
      const recipeData = documentSnapshot.data();

      recipeData.publishDate = recipeData.publishDate._seconds;

      const recipe = { ...recipeData, id };

      response.status(200).send(recipe);
    } else {
      response.status(404).send('Document does not exist');
    }
  } catch (error) {
    response.status(400).send(error.message);
  }
});

app.patch('/recipes/:id', async (request, response) => {
  const authorizationHeader = request.headers['authorization'];

  if (!authorizationHeader) {
    response.status(401).send('Missing Authorization header');
    return;
  }

  try {
    await utilities.authorizeUser(authorizationHeader, firebaseAuth);
  } catch (error) {
    response.status(401).send(error.message);
    return;
  }

  const id = request.params.id;
  const newRecipe = request.body;
  const recipe = utilities.sanitizeRecipePatch(newRecipe);

  try {
    await firestore
      .collection(FIRESTORE_RECIPE_COLLECTION)
      .doc(id)
      .set(recipe, { merge: true });

    response.status(200).send({ id });
  } catch (error) {
    response.status(400).send(error.message);
  }
});

app.put('/recipes/:id', async (request, response) => {
  const authorizationHeader = request.headers['authorization'];

  if (!authorizationHeader) {
    response.status(401).send('Missing Authorization header');
    return;
  }

  try {
    await utilities.authorizeUser(authorizationHeader, firebaseAuth);
  } catch (error) {
    response.status(401).send(error.message);
    return;
  }

  const id = request.params.id;
  const newRecipe = request.body;
  const missingFields = utilities.validateRecipePostPut(newRecipe);

  if (missingFields) {
    response
      .status(400)
      .send(`Recipe is not valid. Missing/invalid fields: ${missingFields}`);
    return;
  }

  const recipe = utilities.sanitizeRecipePostPut(newRecipe);

  try {
    await firestore.collection(FIRESTORE_RECIPE_COLLECTION).doc(id).set(recipe);

    response.status(200).send({ id });
  } catch (error) {
    response.status(400).send(error.message);
  }
});

app.delete('/recipes/:id', async (request, response) => {
  const authorizationHeader = request.headers['authorization'];

  if (!authorizationHeader) {
    response.status(401).send('Missing Authorization header');
    return;
  }

  try {
    await utilities.authorizeUser(authorizationHeader, firebaseAuth);
  } catch (error) {
    response.status(401).send(error.message);
  }

  const id = request.params.id;

  try {
    await firestore.collection(FIRESTORE_RECIPE_COLLECTION).doc(id).delete();
    response.status(200).send();
  } catch (error) {
    response.status(400).send(error.message);
  }
});

module.exports = app;
