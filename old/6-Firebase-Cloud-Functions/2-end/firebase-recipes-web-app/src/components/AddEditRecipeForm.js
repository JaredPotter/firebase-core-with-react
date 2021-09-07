import { useState, useEffect } from 'react';
import ImageUploadPreview from './ImageUploadPreview';

function AddEditRecipeForm({
  handleAddRecipe,
  handleUpdateRecipe,
  handleDeleteRecipe,
  existingRecipe,
  handleCancelClick,
}) {
  useEffect(() => {
    if (existingRecipe) {
      setName(existingRecipe.name);
      setCategory(existingRecipe.category);
      setPublishDate(existingRecipe.publishDate.toISOString().split('T')[0]);
      setDirections(existingRecipe.directions);
      setIngredients(existingRecipe.ingredients);
      setImageUrl(existingRecipe.imageUrl);
    } else {
      resetForm();
    }
  }, [existingRecipe]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [publishDate, setPublishDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [directions, setDirections] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [ingredientName, setIngredientName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

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

    const isPublished = new Date(publishDate) <= new Date() ? true : false;

    const newRecipe = {
      name,
      category,
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

    resetForm();
  }

  function resetForm() {
    setName('');
    setCategory('');
    setPublishDate('');
    setDirections('');
    setIngredients([]);
    setImageUrl('');
  }

  function handleAddIngredient(e) {
    if (e.key && e.key !== 'Enter') {
      return;
    }

    e.preventDefault();

    if (!ingredientName) {
      alert('Missing ingredient field. Please double check.');
      return;
    }

    const ingredient = ingredientName;

    setIngredients([...ingredients, ingredient]);
    setIngredientName('');
  }

  function handleDeleteIngredient(ingredientName) {
    const remainingIngredients = ingredients.filter((ingredient) => {
      return ingredient !== ingredientName;
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
          <ImageUploadPreview
            basePath="recipes"
            existingImageUrl={imageUrl}
            handleUploadFinish={(downloadUrl) => setImageUrl(downloadUrl)}
            handleUploadCancel={() => setImageUrl('')}
          ></ImageUploadPreview>
        </div>
        <div className="fields">
          <label className="recipe-label input-label">
            Recipe Name:
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-text"
            />
          </label>
          <label className="recipe-label input-label">
            Category:
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select"
            >
              <option></option>
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
            Directions:
            <textarea
              required
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              className="input-text directions"
            />
          </label>
          <label className="recipe-label input-label">
            Publish Date:
            <input
              type="date"
              required
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
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
              <th className="table-header">Delete</th>
            </tr>
          </thead>
          <tbody>
            {ingredients && ingredients.length > 0
              ? ingredients.map((ingredient) => {
                  return (
                    <tr key={ingredient}>
                      <td className="table-data text-center">{ingredient}</td>
                      <td className="ingredient-delete-box">
                        <button
                          type="button"
                          className="secondary-button ingredient-delete-button"
                          onClick={() => handleDeleteIngredient(ingredient)}
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
              onKeyPress={handleAddIngredient}
              className="input-text"
              placeholder="ex. 1 cup of sugar"
            />
          </label>
          <button
            type="button"
            onClick={handleAddIngredient}
            className="primary-button add-ingredient-button"
          >
            Add Ingredient
          </button>
        </div>
      </div>
      <div className="action-buttons">
        <button type="submit" className="primary-button action-button">
          {existingRecipe ? 'Update Recipe' : 'Create Recipe'}
        </button>
        {existingRecipe ? (
          <>
            <button
              type="button"
              onClick={handleCancelClick}
              className="primary-button action-button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleDeleteRecipe(existingRecipe.id)}
              className="secondary-button action-button"
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
