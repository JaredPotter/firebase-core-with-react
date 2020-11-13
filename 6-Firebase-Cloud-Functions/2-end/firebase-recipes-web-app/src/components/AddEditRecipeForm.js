import FirebaseStorageService from '../FirebaseStorageService';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

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
      setPublishDate(existingRecipe.publishDate.toISOString().split('T')[0]);
      setDirections(existingRecipe.directions);
      setIngredients(existingRecipe.ingredients);
      setImageUrl(existingRecipe.imageUrl);
      setUploadProgress(-1);
      fileInputRef.current.value = null;
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
      setImageUrl('');
      setUploadProgress(-1);
      fileInputRef.current.value = null;
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
  const [imageUrl, setImageUrl] = React.useState('');
  const [uploadProgress, setUploadProgress] = React.useState(-1);

  const fileInputRef = React.useRef();

  async function handleFileChanged(event) {
    const files = event.target.files;
    const file = files[0];
    const documentId = uuidv4();

    try {
      const downloadUrl = await FirebaseStorageService.uploadFile(
        file,
        `recipes/${documentId}`,
        setUploadProgress
      );

      setImageUrl(downloadUrl);
    } catch (error) {
      setUploadProgress(-1);
      fileInputRef.current.value = null;
      alert(error.message);
      throw error;
    }
  }

  function handleCancelImageClick() {
    fileInputRef.current.value = null;
    setImageUrl('');
    setUploadProgress(-1);
  }

  function handleRecipeFormSubmit(event) {
    event.preventDefault();

    if (ingredients.length === 0) {
      alert('Ingredients cannot be empty. Please add at least 1 ingredient.');
      return;
    }

    if (!imageUrl) {
      alert('Missing recipe image. Please add recipe image.');
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
      imageUrl: imageUrl ? imageUrl : '',
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
      <h2 className="text-center form-title">
        {existingRecipe ? 'Update The Recipe' : 'Add a New Recipe'}
      </h2>
      <div className="top-form-section">
        <div className="image-input-box">
          Recipe Image
          <br />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChanged}
            ref={fileInputRef}
            disabled={disabled}
            hidden={uploadProgress > -1 || imageUrl}
          />
          {!imageUrl && uploadProgress > -1 ? (
            <div>
              <label htmlFor="file">Upload Progress:</label>
              <progress id="file" value={uploadProgress} max="100">
                {uploadProgress}%
              </progress>
              <span>{uploadProgress}%</span>
            </div>
          ) : null}
          {imageUrl ? (
            <div className="image-preview">
              <img src={imageUrl} alt={imageUrl} className="image" />
              <button
                type="button"
                onClick={handleCancelImageClick}
                disabled={disabled}
                className="secondary-button"
              >
                Cancel Image
              </button>
            </div>
          ) : null}
        </div>
        <div className="fields">
          <label className="recipe-label input-label">
            Recipe Name:
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
              className="input-text"
            />
          </label>
          <label className="recipe-label input-label">
            Category:
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={disabled}
              className="select"
            >
              <option value="" disabled></option>
              <option value="breadsSandwichesPizza">
                Breads, Sandwiches, and Pizza
              </option>
              <option value="eggsBreakfast">Eggs & Breakfast</option>
              <option value="dessertsBakedGoods">Desserts & Baked Goods</option>
              <option value="fishSeafood">Fish & Seafood</option>
              <option value="vegetables">Vegetables</option>
            </select>
          </label>
          <label className="recipe-label input-label">
            Description:
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={disabled}
              className="input-text"
            />
          </label>
          <label className="recipe-label input-label">
            Serves (persons):
            <input
              required
              type="number"
              value={serves}
              onChange={(e) => setServes(e.target.value)}
              disabled={disabled}
              className="input-text"
            />
          </label>
          <label className="recipe-label input-label">
            Prep Time:
            <select
              required
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              disabled={disabled}
              className="select"
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
          <label className="recipe-label input-label">
            Cook Time:
            <select
              required
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              disabled={disabled}
              className="select"
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
          <label className="recipe-label input-label">
            Directions:
            <textarea
              required
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              disabled={disabled}
              className="input-text"
            />
          </label>
          <label className="recipe-label input-label">
            Publish Date:
            <input
              type="date"
              required
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              disabled={disabled}
              className="input-text"
            />
          </label>
        </div>
      </div>

      <div className="ingredients-list">
        <h3 className="text-center">Ingredients</h3>
        <table className="ingredients-table">
          <thead>
            <tr>
              <th className="table-header">Ingredient</th>
              <th className="table-header">Amount</th>
              <th className="table-header">Unit</th>
              <th className="table-header">Delete</th>
            </tr>
          </thead>
          <tbody>
            {ingredients && ingredients.length > 0
              ? ingredients.map((ingredient) => {
                  return (
                    <tr key={ingredient.name}>
                      <td className="table-data text-center">
                        {ingredient.name}
                      </td>
                      <td className="table-data text-center">
                        {ingredient.amount}
                      </td>
                      <td className="table-data text-center">
                        {ingredient.unit}
                      </td>
                      <td className="table-data ingredient-delete-box">
                        <button
                          type="button"
                          disabled={disabled}
                          className="secondary-button"
                          onClick={() =>
                            handleDeleteIngredient(ingredient.name)
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
        {ingredients && ingredients.length === 0 ? (
          <h3 className="text-center no-ingredients">
            No Ingredients Added Yet
          </h3>
        ) : null}
        <div className="ingredient-form">
          <label className="ingredient-label">
            Ingredient:
            <input
              type="text"
              value={ingredientName}
              onChange={(e) => setIngredientName(e.target.value)}
              disabled={disabled}
              className="ingredient-input input-text"
            />
          </label>
          <label className="ingredient-label">
            Amount:
            <input
              type="text"
              value={ingredientAmount}
              onChange={(e) => setIngredientAmount(e.target.value)}
              disabled={disabled}
              className="ingredient-input input-text"
            />
          </label>
          <label className="ingredient-label">
            Unit:
            <input
              type="text"
              value={ingredientUnit}
              onChange={(e) => setIngredientUnit(e.target.value)}
              disabled={disabled}
              className="ingredient-input input-text"
            />
          </label>
          <button
            type="button"
            onClick={handleAddIngredientClick}
            disabled={disabled}
            className="primary-button"
          >
            Add Ingredient
          </button>
        </div>
      </div>
      <div className="action-buttons">
        <button
          type="submit"
          className="primary-button action-button"
          disabled={disabled}
        >
          {existingRecipe ? 'Update Recipe' : 'Create Recipe'}
        </button>
        {existingRecipe ? (
          <>
            <button
              type="button"
              onClick={handleCancelClick}
              className="primary-button action-button"
              disabled={disabled}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleDeleteRecipe(existingRecipe.id)}
              className="secondary-button action-button"
              disabled={disabled}
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}

export default AddEditRecipeForm;
