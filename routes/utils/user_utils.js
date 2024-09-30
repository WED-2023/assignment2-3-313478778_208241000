const DButils = require("./DButils");
const { getRecipeInformation } = require('./recipes_utils');

/**
 * Adds a recipe to the user's list of favorite recipes.
 * 
 * @param {string} user_id - The unique identifier of the user.
 * @param {number} recipe_id - The unique identifier of the recipe to be marked as favorite.
 * @throws Will throw an error if the database operation fails.
 */
async function markAsFavorite(user_id, recipe_id) {
    try {
        await DButils.execQuery(
            `INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)`,
            [user_id, recipe_id]
        );
    } catch (error) {
        console.error("Error marking as favorite:", error);
        throw error;
    }
}

/**
 * Removes a recipe from the user's list of favorite recipes.
 * 
 * @param {string} user_id - The unique identifier of the user.
 * @param {number} recipe_id - The unique identifier of the recipe to be removed from favorites.
 * @throws Will throw an error if the database operation fails.
 */
async function unMarkAsFavorite(user_id, recipe_id) {
    try {
        await DButils.execQuery(
            `DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?`,
            [user_id, recipe_id]
        );
    } catch (error) {
        console.error("Error unmarking as favorite:", error);
        throw error;
    }
}

/**
 * Retrieves detailed information for all favorite recipes of the user.
 * 
 * @param {string} user_id - The unique identifier of the user.
 * @returns {Promise<Array>} A promise that resolves to an array of detailed favorite recipes.
 * @throws Will throw an error if the database operation fails or if fetching recipe information fails.
 */
async function getAllFavoriteRecipes(user_id) {
    try {
        // Step 1: Get favorite recipe IDs directly from the database
        const fav_recipes_id = await DButils.execQuery(
            `SELECT recipe_id FROM favorites WHERE user_id = ?`,
            [user_id]
        );

        // Step 2: Fetch detailed information for each favorite recipe
        const recipeDetailsPromises = fav_recipes_id.map(async (recipe) => {
            const recipe_id = recipe.recipe_id; // Access recipe_id from the retrieved favorites
            const recipeDetails = await getRecipeInformation(recipe_id); // Fetch recipe information without user_id
            return { ...recipeDetails, isFavorite: true }; // Add isFavorite property
        });

        // Step 3: Resolve all promises and return the results
        return await Promise.all(recipeDetailsPromises);
    } catch (error) {
        console.error("Error fetching all favorite recipes:", error);
        throw error; // Rethrow error for further handling
    }
}

module.exports = {
    markAsFavorite,
    unMarkAsFavorite,
    getAllFavoriteRecipes, // Export the updated function
};
