const DButils = require("./DButils");

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
 * Retrieves the list of recipe IDs that have been marked as favorites by the user.
 * 
 * @param {string} user_id - The unique identifier of the user.
 * @returns {Promise<Array>} A promise that resolves to an array of recipe IDs marked as favorite by the user.
 * @throws Will throw an error if the database operation fails.
 */
async function getFavoriteRecipes(user_id) {
    try {
        const recipes_id = await DButils.execQuery(
            `SELECT recipe_id FROM FavoriteRecipes WHERE user_id = ?`,
            [user_id]
        );
        return recipes_id;
    } catch (error) {
        console.error("Error fetching favorite recipes:", error);
        throw error;
    }
}

module.exports = {
    markAsFavorite,
    unMarkAsFavorite,
    getFavoriteRecipes,
};
