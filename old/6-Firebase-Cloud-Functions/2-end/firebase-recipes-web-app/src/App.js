import './App.scss';
import { useState, useEffect } from 'react';
import FirebaseAuthService from './FirebaseAuthService';
import FirebaseFirestoreService from './FirebaseFirestoreService';
// import FirebaseFirestoreRestService from "./FirebaseFirestoreRestService";
import LoginForm from './components/LoginForm';
import AddEditRecipeForm from './components/AddEditRecipeForm';
import FirebaseConfig from './FirebaseConfig';

const firestore = FirebaseConfig.firestore;

function App() {
  const [user, setUser] = useState(null);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [orderBy, setOrderBy] = useState('publishDateDesc');
  const [recipesPerPage, setRecipesPerPage] = useState(3);
  // const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);
  const [totalNumberOfPages, setTotalNumberOfPages] = useState(0);
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    fetchRecipes(
      categoryFilter,
      user,
      orderBy,
      recipesPerPage,
      null
      // currentPageNumber
    )
      .then((fetchedRecipes) => {
        setRecipes(fetchedRecipes);
      })
      .catch((error) => {
        console.error(error);
        throw error;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [categoryFilter, user, orderBy, recipesPerPage /*currentPageNumber*/]);

  FirebaseAuthService.subscribeToAuthChanges(setUser);

  async function fetchRecipes(
    categoryFilter2,
    user,
    orderBy,
    recipesPerPage,
    cursorId,
    currentPageNumber
  ) {
    const queries = [];

    if (categoryFilter) {
      queries.push({
        field: 'category',
        condition: '==',
        value: categoryFilter,
      });
    }

    if (!user) {
      queries.push({
        field: 'isPublished',
        condition: '==',
        value: true,
      });
    }

    let orderByField;
    let orderByDirection;

    if (orderBy) {
      switch (orderBy) {
        case 'publishDateAsc':
          orderByField = 'publishDate';
          orderByDirection = 'asc';
          break;
        case 'publishDateDesc':
          orderByField = 'publishDate';
          orderByDirection = 'desc';
          break;
        default:
          break;
      }
    }

    let fetchedRecipes = [];

    try {
      const response = await FirebaseFirestoreService.readDocuments({
        collection: 'recipes',
        queries: queries,
        orderByField: orderByField,
        orderByDirection: orderByDirection,
        perPage: recipesPerPage,
        cursorId: cursorId,
      });

      const newRecipes = response.docs.map((recipe) => {
        const id = recipe.id;

        const data = recipe.data();
        data.publishDate = new Date(data.publishDate.seconds * 1000);
        return { ...data, id };
      });

      if (cursorId) {
        fetchedRecipes = [...recipes, ...newRecipes];
      } else {
        fetchedRecipes = [...newRecipes];
      }
      // const response = await FirebaseFirestoreRestService.readDocuments({
      //   collection: "recipes",
      //   queries: queries,
      //   orderByField: orderByField,
      //   orderByDirection: orderByDirection,
      //   perPage: recipesPerPage,
      //   cursorId: cursorId,
      //   pageNumber: currentPageNumber,
      // });

      // if (response && response.documents) {
      //   const totalNumberOfPages = Math.ceil(
      //     response.recipeCount / recipesPerPage
      //   );

      //   setTotalNumberOfPages(totalNumberOfPages);

      //   const query = {
      //     collection: "recipes",
      //     queries: queries,
      //     orderByField: orderByField,
      //     orderByDirection: orderByDirection,
      //     perPage: recipesPerPage,
      //     cursorId: cursorId,
      //     pageNumber: currentPageNumber + 1,
      //   };

      //   const nextPageResponse = await FirebaseFirestoreRestService.readDocuments(
      //     query
      //   );

      //   if (
      //     nextPageResponse &&
      //     nextPageResponse.documents &&
      //     nextPageResponse.documents.length === 0
      //   ) {
      //     setIsLastPage(true);
      //   } else {
      //     setIsLastPage(false);
      //   }

      //   fetchedRecipes = response.documents;

      //   fetchedRecipes.forEach((recipe) => {
      //     const unixPublishDate = recipe.publishDate;
      //     recipe.publishDate = new Date(unixPublishDate * SECONDS_MULTIPLIER);

      //     return recipe;
      //   });

      //   if (fetchedRecipes.length === 0 && currentPageNumber !== 1) {
      //     setCurrentPageNumber(currentPageNumber - 1);
      //   }
      // } else {
      //   throw { message: "Failed to load recipes!" };
      // }
    } catch (error) {
      console.error(error);
      throw error;
    }

    return fetchedRecipes;
  }

  async function handleAddRecipe(newRecipe) {
    try {
      // const response = await FirebaseFirestoreRestService.createDocument(
      //   "recipes",
      //   newRecipe
      // );

      const response = await FirebaseFirestoreService.createDocument(
        'recipes',
        newRecipe
      );

      handleFetchRecipes();

      alert(`successfully created a recipe with an ID = ${response.id}`);
    } catch (error) {
      alert(error.message);

      throw error;
    }
  }

  async function handleUpdateRecipe(updatedRecipe) {
    try {
      debugger;
      // updatedRecipe.publishDate = firestore.Timestamp.fromDate(
      //   updatedRecipe.publishDate
      // );

      // await FirebaseFirestoreRestService.updateDocument(
      //   "recipes",
      //   updatedRecipe.id,
      //   updatedRecipe
      // );
      debugger;
      await FirebaseFirestoreService.updateDocument(
        'recipes',
        updatedRecipe.id,
        updatedRecipe
      );

      handleFetchRecipes();

      // window.scrollTo(0, 0);
      alert(`successfully updated recipe with an ID = ${updatedRecipe.id}`);
      setCurrentRecipe(null);
    } catch (error) {
      alert(error.message);

      throw error;
    }
  }

  async function handleDeleteRecipe(recipeId) {
    const deleteConfirmation = window.confirm(
      'Are you sure you want to delete this recipe? OK for Yes. Cancel for No.'
    );

    if (deleteConfirmation) {
      try {
        // await FirebaseFirestoreRestService.deleteDocument("recipes", recipeId);
        await FirebaseFirestoreService.deleteDocument('recipes', recipeId);

        handleFetchRecipes();
        setCurrentRecipe(null);
        window.scrollTo(0, 0);

        alert(`successfully deleted recipe with an ID = ${recipeId}`);
      } catch (error) {
        alert(error.message);

        throw error;
      }
    }
  }

  function handleCancelClick() {
    setCurrentRecipe(null);
    // window.scrollTo(0, 0);
  }

  function handleRecipeEditClick(recipeId) {
    const selectedRecipe = recipes.find((recipe) => {
      return recipe.id === recipeId;
    });

    if (selectedRecipe) {
      setCurrentRecipe(selectedRecipe);
      window.scrollTo(0, document.body.scrollHeight);
    }
  }

  function handleRecipesPerPageChange(e) {
    const recipesPerPage = e.target.value;

    setRecipes([]);
    setRecipesPerPage(recipesPerPage);
  }

  function handleLoadMoreRecipesClick() {
    const lastRecipe = recipes[recipes.length - 1];
    const cursorId = lastRecipe.id;

    // fetchRecipes(cursorId);
    handleFetchRecipes(cursorId);
  }

  async function handleFetchRecipes(cursorId = '') {
    try {
      const fetchedRecipes = await fetchRecipes(
        categoryFilter,
        user,
        orderBy,
        recipesPerPage,
        cursorId
        // currentPageNumber
      );

      setRecipes(fetchedRecipes);
    } catch (error) {
      alert(error.message);
    }
  }

  function lookupCategoryLabel(categoryKey) {
    const categories = {
      breadsSandwichesPizza: 'Breads, Sandwiches, and Pizza',
      eggsBreakfast: 'Eggs & Breakfast',
      dessertsBakedGoods: 'Desserts & Baked Goods',
      fishSeafood: 'Fish & Seafood',
      vegetables: 'Vegetables',
    };

    return categories[categoryKey];
  }

  function formatDate(date) {
    let day = date.getUTCDate();
    let month = date.getUTCMonth() + 1;
    const year = date.getFullYear();

    if (day < 10) {
      day = '0' + day;
    }

    if (month < 10) {
      month = '0' + month;
    }

    return `${month}-${day}-${year}`;
  }

  return (
    <div className="App">
      <div className="title-row">
        <h1 className="title">Firebase Recipes</h1>
        <LoginForm existingUser={user} />
      </div>
      <div className="main">
        <div className="row apart filters">
          <label className="input-label">
            Category:
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select"
            >
              <option value=""></option>
              <option value="breadsSandwichesPizza">
                Breads, Sandwiches, and Pizza
              </option>
              <option value="eggsBreakfast">Eggs & Breakfast</option>
              <option value="dessertsBakedGoods">Desserts & Baked Goods</option>
              <option value="fishSeafood">Fish & Seafood</option>
              <option value="vegetables">Vegetables</option>
            </select>
          </label>

          <label className="input-label">
            Order By:
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className="select"
            >
              <option value="publishDateDesc">
                Publish Date (newest - oldest)
              </option>
              <option value="publishDateAsc">
                Publish Date (oldest - newest)
              </option>
            </select>
          </label>
        </div>
        <div className="center">
          <div className="recipe-list-box">
            {isLoading ? (
              <div className="fire">
                <div className="flames">
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                </div>
                <div className="logs"></div>
              </div>
            ) : null}
            {!isLoading && recipes && recipes.length === 0 ? (
              <h5 className="no-recipes">No Recipes Found</h5>
            ) : null}
            {!isLoading && recipes && recipes.length > 0 ? (
              <div className="recipe-list">
                {recipes && recipes.length > 0
                  ? recipes.map((recipe) => {
                      return (
                        <div className="recipe-card" key={recipe.id}>
                          {recipe.isPublished === false ? (
                            <div className="unpublished">UNPUBLISHED</div>
                          ) : null}
                          <div className="recipe-name">{recipe.name}</div>
                          <div className="recipe-image-box">
                            <img
                              src={recipe.imageUrl}
                              alt={recipe.name}
                              className="recipe-image"
                            />
                          </div>
                          <div className="recipe-field">
                            Category: {lookupCategoryLabel(recipe.category)}
                          </div>
                          <div className="recipe-field">
                            Publish Date: {formatDate(recipe.publishDate)}
                          </div>
                          {user ? (
                            <button
                              onClick={() => handleRecipeEditClick(recipe.id)}
                              className="primary-button edit-button"
                            >
                              EDIT
                            </button>
                          ) : null}
                        </div>
                      );
                    })
                  : null}
              </div>
            ) : null}
          </div>
          {isLoading || (recipes && recipes.length > 0) ? (
            <>
              <label className="input-label">
                Recipes Per Page:
                <select
                  value={recipesPerPage}
                  onChange={handleRecipesPerPageChange}
                  className="select"
                >
                  <option value="3">3</option>
                  <option value="6">6</option>
                </select>
              </label>
              <div className="pagination">
                <button
                  className="primary-button"
                  onClick={handleLoadMoreRecipesClick}
                >
                  LOAD MORE RECIPES
                </button>
                {/* <div className="row">
                  <button
                    className={
                      currentPageNumber === 1
                        ? "primary-button hidden"
                        : "primary-button"
                    }
                    onClick={() => setCurrentPageNumber(currentPageNumber - 1)}
                  >
                    Previous
                  </button>
                  <div>Page {currentPageNumber}</div>
                  <button
                    className={
                      isLastPage ? "primary-button hidden" : "primary-button"
                    }
                    onClick={() => setCurrentPageNumber(currentPageNumber + 1)}
                  >
                    Next
                  </button>
                </div>
                <div className="row">
                  {!categoryFilter
                    ? new Array(totalNumberOfPages)
                        .fill(0)
                        .map((value, index) => {
                          return (
                            <button
                              key={index + 1}
                              onClick={() => setCurrentPageNumber(index + 1)}
                              className={
                                currentPageNumber === index + 1
                                  ? "selected-page primary-button page-button"
                                  : "primary-button page-button"
                              }
                            >
                              {index + 1}
                            </button>
                          );
                        })
                    : null}
                </div> */}
              </div>
            </>
          ) : null}
        </div>

        {user ? (
          <AddEditRecipeForm
            handleAddRecipe={handleAddRecipe}
            handleUpdateRecipe={handleUpdateRecipe}
            handleDeleteRecipe={handleDeleteRecipe}
            existingRecipe={currentRecipe}
            handleCancelClick={handleCancelClick}
          />
        ) : null}
      </div>
    </div>
  );
}

export default App;
