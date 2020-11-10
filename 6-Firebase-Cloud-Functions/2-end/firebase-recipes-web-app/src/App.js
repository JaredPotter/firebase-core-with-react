import './App.css';
import React from 'react';
import FirebaseAuthService from './FirebaseAuthService';
import FirebaseFirestoreRestService from './FirebaseFirestoreRestService';
import AddEditRecipeForm from './components/AddEditRecipeForm';

function App() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [user, setUser] = React.useState(null);
    const [disableRecipeForm, setDisableRecipeForm] = React.useState(false);
    const [currentRecipe, setCurrentRecipe] = React.useState(null);
    const [categoryFilter, setCategoryFilter] = React.useState('');
    const [servesFilter, setServesFilter] = React.useState('');
    const [orderBy, setOrderBy] = React.useState('publishDateDesc');
    const [recipesPerPage, setRecipesPerPage] = React.useState(3);
    const [
        collectionDocumentCount,
        setCollectionDocumentCount,
    ] = React.useState(0);
    const [currentPageNumber, setCurrentPageNumber] = React.useState(1);
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

        try {
            const response = await FirebaseFirestoreRestService.readDocuments(
                'recipes',
                queries,
                orderByField,
                orderByDirection,
                recipesPerPage,
                null,
                currentPageNumber
            );

            if (response && response.documents) {
                setCollectionDocumentCount(response.collectionDocumentCount);

                const fetchedRecipes = response.documents;

                fetchedRecipes.forEach((recipe) => {
                    const unixPublishDate = recipe.publishDate;
                    recipe.publishDate = new Date(unixPublishDate * 1000);

                    return recipe;
                });

                setRecipes(fetchedRecipes);
            } else {
                throw { message: 'Failed to load recipes!' };
            }
        } catch (error) {
            alert(error.message);
            throw error;
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            const authResponse = await FirebaseAuthService.loginUser(
                username,
                password
            );

            setUser(authResponse.user);
        } catch (error) {
            alert(error.message);
            throw error;
        }

        setUsername('');
        setPassword('');
    }

    function handleLogout() {
        FirebaseAuthService.logoutUser();
        setUser(null);
    }

    function handleSendPasswordResetEmail() {
        FirebaseAuthService.sendResetPassword(username);
        alert('Reset Email Sent');
    }

    async function handleLoginWithGoogle() {
        try {
            const loginResult = await FirebaseAuthService.loginWithGoogle();

            const user = loginResult.user;

            setUser(user);
        } catch (error) {
            alert(error.message);
            throw error;
        }
    }

    async function handleAddRecipe(newRecipe) {
        try {
            setDisableRecipeForm(true);

            newRecipe.publishDate = newRecipe.publishDate.getTime() / 1000;

            const response = await FirebaseFirestoreRestService.createDocument(
                'recipes',
                newRecipe
            );

            setDisableRecipeForm(false);

            fetchRecipes();

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
                updatedRecipe.publishDate.getTime() / 1000;

            await FirebaseFirestoreRestService.updateDocument(
                'recipes',
                updatedRecipe.id,
                updatedRecipe
            );

            setDisableRecipeForm(false);

            fetchRecipes();

            alert(
                `successfully updated recipe with an ID = ${updatedRecipe.id}`
            );

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
                await FirebaseFirestoreRestService.deleteDocument(
                    'recipes',
                    recipeId
                );

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

    function buildPagination() {
        const totalNumberOfPages = Math.ceil(
            collectionDocumentCount / recipesPerPage
        );

        const pages = [];

        for (let i = 1; i < totalNumberOfPages + 1; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setCurrentPageNumber(i)}
                    className={
                        currentPageNumber === i
                            ? 'selected-page page-button'
                            : 'page-button'
                    }
                >
                    {i}
                </button>
            );
        }

        return pages;
    }

    return (
        <div className="App">
            {user ? (
                <>
                    <h3>Welcome, {user.email}</h3>
                    <button onClick={handleLogout}>Logout</button>
                </>
            ) : (
                <>
                    <form onSubmit={handleSubmit}>
                        <label>
                            Username (email):
                            <input
                                type="email"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </label>
                        <label>
                            Password:
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </label>
                        <button type="submit">Login</button>
                    </form>
                    <button onClick={handleSendPasswordResetEmail}>
                        Send Password Reset Email
                    </button>
                    <button onClick={handleLoginWithGoogle}>
                        Login with Google
                    </button>
                </>
            )}

            <h1>Firebase Recipes</h1>
            <label>
                Category:
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value=""></option>
                    <option value="breadsSandwichesPizza">
                        Breads, Sandwiches, and Pizza
                    </option>
                    <option value="eggsBreakfast">Eggs & Breakfast</option>
                    <option value="dessertsBakedGoods">
                        Desserts & Baked Goods
                    </option>
                    <option value="fishSeafood">Fish & Seafood</option>
                    <option value="vegetables">Vegetables</option>
                </select>
            </label>
            <label>
                Serves:
                <select
                    value={servesFilter}
                    onChange={(e) => setServesFilter(e.target.value)}
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
            <label>
                Order By:
                <select
                    value={orderBy}
                    onChange={(e) => setOrderBy(e.target.value)}
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
            {recipes && recipes.length > 0 ? (
                <div className="recipe-list-container">
                    <div className="recipe-list">
                        {recipes.map((recipe) => {
                            return (
                                <div className="recipe-card" key={recipe.id}>
                                    <div>ID: {recipe.id}</div>
                                    <div>Name: {recipe.name}</div>
                                    <div className="recipe-image">
                                        <img
                                            src={recipe.imageUrl}
                                            alt={recipe.name}
                                        />
                                    </div>
                                    <div>
                                        Category:{' '}
                                        {lookupCategoryLabel(recipe.category)}
                                    </div>
                                    <div>
                                        Publish Date:{' '}
                                        {formatDate(recipe.publishDate)}
                                    </div>
                                    <div>Description: {recipe.description}</div>
                                    <div>Serves: {recipe.serves}</div>
                                    <div>
                                        Total Time: {recipe.totalTime} minutes
                                    </div>
                                    {user ? (
                                        <button
                                            onClick={() =>
                                                handleRecipeEditClick(recipe.id)
                                            }
                                        >
                                            EDIT
                                        </button>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                    <label>
                        Recipes Per Page:
                        <select
                            value={recipesPerPage}
                            onChange={handleRecipesPerPageChange}
                        >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                    </label>
                    <div>{buildPagination()}</div>
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
    );
}

export default App;
