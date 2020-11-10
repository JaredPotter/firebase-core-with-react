import './AddEditRecipeForm.css';
import React from 'react';

function AddEditRecipeForm({
    handleAddRecipe,
    handleUpdateRecipe,
    handleDeleteRecipe,
    existingRecipe,
    handleCancelClick,
    disabled,
}) {
    React.useEffect(() => {
        if (existingRecipe) {
            setName(existingRecipe.name);
            setCategory(existingRecipe.category);
            setDescription(existingRecipe.description);
            setServes(existingRecipe.serves);
            setPrepTime(existingRecipe.prepTime);
            setCookTime(existingRecipe.cookTime);
            setPublishDate(
                existingRecipe.publishDate.toISOString().split('T')[0]
            );
            setDirections(existingRecipe.directions);
            setIngredients(existingRecipe.ingredients);
        } else {
            setName('');
            setCategory('');
            setDescription('');
            setServes(4);
            setPrepTime('');
            setCookTime('');
            setPublishDate('');
            setDirections('');
            setIngredients([]);
        }
    }, [existingRecipe, disabled]);

    const [name, setName] = React.useState('');
    const [category, setCategory] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [serves, setServes] = React.useState(4);
    const [prepTime, setPrepTime] = React.useState('');
    const [cookTime, setCookTime] = React.useState('');
    const [publishDate, setPublishDate] = React.useState(() => {
        const now = new Date().toISOString().split('T')[0];

        return now;
    });
    const [directions, setDirections] = React.useState('');
    const [ingredients, setIngredients] = React.useState([]);
    const [ingredientAmount, setIngredientAmount] = React.useState('');
    const [ingredientUnit, setIngredientUnit] = React.useState('');
    const [ingredientName, setIngredientName] = React.useState('');

    function handleRecipeFormSubmit(event) {
        event.preventDefault();

        if (ingredients.length === 0) {
            alert(
                'Ingredients cannot be empty. Please add at least 1 ingredient.'
            );
            return;
        }

        const prepTimeNumber = Number(prepTime);
        const cookTimeNumber = Number(cookTime);

        const isPublished = new Date(publishDate) <= new Date() ? true : false;

        const newRecipe = {
            name,
            category,
            description,
            serves: Number(serves),
            prepTime: prepTimeNumber,
            cookTime: cookTimeNumber,
            totalTime: prepTimeNumber + cookTimeNumber,
            directions,
            publishDate: new Date(publishDate),
            isPublished,
            ingredients,
        };

        if (existingRecipe) {
            newRecipe.id = existingRecipe.id;
            handleUpdateRecipe(newRecipe);
        } else {
            handleAddRecipe(newRecipe);
        }
    }

    function handleAddIngredientClick() {
        if (!ingredientAmount || !ingredientUnit || !ingredientName) {
            alert('Missing ingredient field. Please double check.');
            return;
        }

        const ingredient = {
            amount: ingredientAmount,
            unit: ingredientUnit,
            name: ingredientName,
        };

        setIngredients([...ingredients, ingredient]);
        setIngredientAmount('');
        setIngredientUnit('');
        setIngredientName('');
    }

    function handleDeleteIngredient(ingredientName) {
        const remainingIngredients = ingredients.filter((ingredient) => {
            return ingredient.name !== ingredientName;
        });

        setIngredients(remainingIngredients);
    }

    return (
        <form
            onSubmit={handleRecipeFormSubmit}
            className="add-edit-recipe-form-container"
        >
            <h3>{existingRecipe ? 'Update The Recipe' : 'Add a New Recipe'}</h3>
            <label>
                Recipe Name:
                <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={disabled}
                />
            </label>
            <label>
                Category:
                <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={disabled}
                >
                    <option value="" disabled></option>
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
                Description:
                <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={disabled}
                />
            </label>
            <label>
                Serves (persons):
                <input
                    required
                    type="number"
                    value={serves}
                    onChange={(e) => setServes(e.target.value)}
                    disabled={disabled}
                />
            </label>
            <label>
                Prep Time:
                <select
                    required
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    disabled={disabled}
                >
                    <option value="" disabled></option>
                    <option value="5">5 Minutes</option>
                    <option value="10">10 Minutes</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes</option>
                </select>
            </label>
            <label>
                Cook Time:
                <select
                    required
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    disabled={disabled}
                >
                    <option value="" disabled></option>
                    <option value="5">5 Minutes</option>
                    <option value="10">10 Minutes</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes</option>
                </select>
            </label>
            <label>
                Directions:
                <textarea
                    required
                    value={directions}
                    onChange={(e) => setDirections(e.target.value)}
                    disabled={disabled}
                />
            </label>
            <label>
                Publish Date:
                <input
                    type="date"
                    required
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    disabled={disabled}
                />
            </label>
            <div className="ingredients-list">
                <div>Ingredients:</div>
                {ingredients && ingredients.length > 0
                    ? ingredients.map((ingredient) => {
                          return (
                              <div key={ingredient.name}>
                                  <span>{ingredient.amount} </span>
                                  <span>{ingredient.unit} </span>
                                  <span>{ingredient.name} </span>
                                  <button
                                      type="button"
                                      disabled={disabled}
                                      onClick={() =>
                                          handleDeleteIngredient(
                                              ingredient.name
                                          )
                                      }
                                  >
                                      Delete
                                  </button>
                              </div>
                          );
                      })
                    : null}
                <div className="ingredient-form">
                    <label>
                        Ingredient:
                        <input
                            type="text"
                            value={ingredientName}
                            onChange={(e) => setIngredientName(e.target.value)}
                            disabled={disabled}
                        />
                    </label>
                    <label>
                        Amount:
                        <input
                            type="text"
                            value={ingredientAmount}
                            onChange={(e) =>
                                setIngredientAmount(e.target.value)
                            }
                            disabled={disabled}
                        />
                    </label>
                    <label>
                        Unit:
                        <input
                            type="text"
                            value={ingredientUnit}
                            onChange={(e) => setIngredientUnit(e.target.value)}
                            disabled={disabled}
                        />
                    </label>
                    <button
                        type="button"
                        onClick={handleAddIngredientClick}
                        disabled={disabled}
                    >
                        Add Ingredient
                    </button>
                </div>
            </div>

            <button type="submit" disabled={disabled}>
                {existingRecipe ? 'Update Recipe' : 'Create Recipe'}
            </button>
            {existingRecipe ? (
                <>
                    <button
                        type="button"
                        onClick={handleCancelClick}
                        disabled={disabled}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDeleteRecipe(existingRecipe.id)}
                        disabled={disabled}
                    >
                        Delete
                    </button>
                </>
            ) : null}
        </form>
    );
}

export default AddEditRecipeForm;
