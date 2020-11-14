import './App.scss';
import React from 'react';
import FirebaseAuthService from './FirebaseAuthService';
import FirebaseFirestoreRestService from './FirebaseFirestoreRestService';
import LoginForm from './components/LoginForm';
import AddEditRecipeForm from './components/AddEditRecipeForm';

const SECONDS_MULTIPLIER = 1000;

function App() {
  const [user, setUser] = React.useState(null);
  const [disableRecipeForm, setDisableRecipeForm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentRecipe, setCurrentRecipe] = React.useState(null);
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [servesFilter, setServesFilter] = React.useState('');
  const [orderBy, setOrderBy] = React.useState('publishDateDesc');
  const [recipesPerPage, setRecipesPerPage] = React.useState(3);
  const [currentPageNumber, setCurrentPageNumber] = React.useState(1);
  const [isLastPage, setIsLastPage] = React.useState(false);
  const [totalNumberOfPages, setTotalNumberOfPages] = React.useState(0);
  const [recipes, setRecipes] = React.useState(() => {
    fetchRecipes();

    return [];
  });
  React.useEffect(() => {
    fetchRecipes();
  }, [
    categoryFilter,
    servesFilter,
    user,
    orderBy,
    recipesPerPage,
    currentPageNumber,
  ]);

  FirebaseAuthService.subscribeToAuthChanges(setUser);

  async function fetchRecipes() {
    const queries = [];

    if (categoryFilter) {
      queries.push({
        field: 'category',
        condition: '==',
        value: categoryFilter,
      });
    }

    if (servesFilter) {
      if (servesFilter === '7+') {
        queries.push({
          field: 'serves',
          condition: '>=',
          value: 7,
        });
      } else {
        queries.push({
          field: 'serves',
          condition: '==',
          value: Number(servesFilter),
        });
      }
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
        case 'totalTimeDesc':
          orderByField = 'totalTime';
          orderByDirection = 'desc';
          break;
        case 'totalTimeAsc':
          orderByField = 'totalTime';
          orderByDirection = 'asc';
          break;
        default:
          break;
      }
    }

    setIsLoading(true);

    try {
      const response = await FirebaseFirestoreRestService.readDocuments({
        collection: 'recipes',
        queries: queries,
        orderByField: orderByField,
        orderByDirection: orderByDirection,
        perPage: recipesPerPage,
        cursorId: null,
        pageNumber: currentPageNumber,
      });

      if (response && response.documents) {
        const totalNumberOfPages = Math.ceil(
          response.collectionDocumentCount / recipesPerPage
        );

        setTotalNumberOfPages(totalNumberOfPages);

        const nextPageResponse = await FirebaseFirestoreRestService.readDocuments(
          {
            collection: 'recipes',
            queries: queries,
            orderByField: orderByField,
            orderByDirection: orderByDirection,
            perPage: recipesPerPage,
            cursorId: null,
            currentPageNumber: currentPageNumber + 1,
          }
        );

        if (
          nextPageResponse &&
          nextPageResponse.documents &&
          nextPageResponse.documents.length === 0
        ) {
          setIsLastPage(true);
        } else {
          setIsLastPage(false);
        }

        const fetchedRecipes = response.documents;

        fetchedRecipes.forEach((recipe) => {
          const unixPublishDate = recipe.publishDate;
          recipe.publishDate = new Date(unixPublishDate * SECONDS_MULTIPLIER);

          return recipe;
        });

        if (fetchedRecipes.length === 0 && currentPageNumber !== 1) {
          setCurrentPageNumber(currentPageNumber - 1);
        }

        setRecipes(fetchedRecipes);
      } else {
        throw { message: 'Failed to load recipes!' };
      }
    } catch (error) {
      alert(error.message);
      throw error;
    }

    setIsLoading(false);
  }

  async function handleAddRecipe(newRecipe) {
    try {
      setDisableRecipeForm(true);

      newRecipe.publishDate =
        newRecipe.publishDate.getTime() / SECONDS_MULTIPLIER;

      const response = await FirebaseFirestoreRestService.createDocument(
        'recipes',
        newRecipe
      );

      setDisableRecipeForm(false);
      fetchRecipes();
      window.scrollTo(0, 0);
      alert(`successfully create a recipe with an ID = ${response.id}`);
    } catch (error) {
      alert(error.message);

      throw error;
    }
  }

  async function handleUpdateRecipe(updatedRecipe) {
    try {
      setDisableRecipeForm(true);

      updatedRecipe.publishDate =
        updatedRecipe.publishDate.getTime() / SECONDS_MULTIPLIER;

      await FirebaseFirestoreRestService.updateDocument(
        'recipes',
        updatedRecipe.id,
        updatedRecipe
      );

      setDisableRecipeForm(false);
      fetchRecipes();
      window.scrollTo(0, 0);
      alert(`successfully updated recipe with an ID = ${updatedRecipe.id}`);
      setCurrentRecipe(null);
    } catch (error) {
      alert(error.message);

      setDisableRecipeForm(false);

      throw error;
    }
  }

  async function handleDeleteRecipe(recipeId) {
    const deleteConfirmation = window.confirm(
      'Are you sure you want to delete this recipe?'
    );

    if (deleteConfirmation) {
      try {
        await FirebaseFirestoreRestService.deleteDocument('recipes', recipeId);

        fetchRecipes();

        setCurrentRecipe(null);

        alert(`successfully deleted recipe with an ID = ${recipeId}`);
      } catch (error) {
        alert(error.message);

        throw error;
      }
    }
  }

  function handleCancelClick() {
    setCurrentRecipe(null);
    window.scrollTo(0, 0);
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
    let dd = date.getUTCDate();
    let mm = date.getUTCMonth() + 1;
    const yyyy = date.getFullYear();

    if (dd < 10) {
      dd = '0' + dd;
    }

    if (mm < 10) {
      mm = '0' + mm;
    }

    return `${mm}-${dd}-${yyyy}`;
  }

  return (
    <div className="app">
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
            Serves:
            <select
              value={servesFilter}
              onChange={(e) => setServesFilter(e.target.value)}
              className="select"
            >
              <option value=""></option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7+">7+</option>
            </select>
          </label>
          <label className="input-label">
            Order By:
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className="select"
            >
              <option value=""></option>
              <option value="publishDateDesc">
                Publish Date (newest - oldest)
              </option>
              <option value="publishDateAsc">
                Publish Date (oldest - newest)
              </option>
              <option value="totalTimeDesc">
                Total Time Minutes (most - least)
              </option>
              <option value="totalTimeAsc">
                Total Time Minutes (least - most)
              </option>
            </select>
          </label>
        </div>
        {(recipes && recipes.length > 0) || isLoading ? (
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

              <div className="recipe-list">
                {recipes.map((recipe) => {
                  return (
                    <div className="recipe-card" key={recipe.id}>
                      <div>
                        <div>Name: {recipe.name}</div>
                        <div className="recipe-image-box">
                          <img
                            src={recipe.imageUrl}
                            alt={recipe.name}
                            className="recipe-image"
                          />
                        </div>
                        <div>
                          Category: {lookupCategoryLabel(recipe.category)}
                        </div>
                        <div>
                          Publish Date: {formatDate(recipe.publishDate)}
                        </div>
                        <div>Description: {recipe.description}</div>
                        <div>Serves: {recipe.serves}</div>
                        <div>Total Time: {recipe.totalTime} minutes</div>
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
                })}
              </div>
            </div>
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
              <div className="row">
                <button
                  className={
                    currentPageNumber === 1
                      ? 'primary-button hidden'
                      : 'primary-button'
                  }
                  onClick={() => setCurrentPageNumber(currentPageNumber - 1)}
                >
                  Previous
                </button>
                <div>Page {currentPageNumber}</div>
                <button
                  className={
                    isLastPage ? 'primary-button hidden' : 'primary-button'
                  }
                  onClick={() => setCurrentPageNumber(currentPageNumber + 1)}
                >
                  Next
                </button>
              </div>
              <div className="row">
                {!categoryFilter && !servesFilter
                  ? new Array(totalNumberOfPages)
                      .fill(0)
                      .map((value, index) => {
                        return (
                          <button
                            key={index + 1}
                            onClick={() => setCurrentPageNumber(index + 1)}
                            className={
                              currentPageNumber === index + 1
                                ? 'selected-page primary-button page-button'
                                : 'primary-button page-button'
                            }
                          >
                            {index + 1}
                          </button>
                        );
                      })
                  : null}
              </div>
            </div>
          </div>
        ) : (
          <h5>No Recipes Found!</h5>
        )}

        {user ? (
          <AddEditRecipeForm
            handleAddRecipe={handleAddRecipe}
            handleUpdateRecipe={handleUpdateRecipe}
            handleDeleteRecipe={handleDeleteRecipe}
            existingRecipe={currentRecipe}
            handleCancelClick={handleCancelClick}
            disabled={disableRecipeForm}
          />
        ) : null}
      </div>
    </div>
  );
}

export default App;
