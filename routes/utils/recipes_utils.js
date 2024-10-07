const axios = require("axios");
require("dotenv").config();
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");
// const { getFavoriteRecipes } = require("./user_utils"); // Importing the function from user_utils

/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    try {
        const recipe_info = await axios.get(`${api_domain}/${recipe_id}/information`, {
            params: {
                includeNutrition: false,
                apiKey: process.env.SPOONACULAR_API_KEY // Consistent naming
            }
        });

        const recipe = recipe_info.data;

        // Format the recipe data
        const formattedRecipe = {
            id: recipe.id,
            title: recipe.title,
            readyInMinutes: recipe.readyInMinutes,
            image: recipe.image,
            aggregateLikes: recipe.aggregateLikes,
            vegan: recipe.vegan,
            vegetarian: recipe.vegetarian,
            glutenFree: recipe.glutenFree,
            summary: recipe.summary,
            extendedIngredients: recipe.extendedIngredients,
            analyzedInstructions: recipe.analyzedInstructions,
        };

        return formattedRecipe; // Return the formatted recipe
    } catch (error) {
        console.error("Error fetching recipe information:", error);
        throw new Error("Failed to fetch recipe information. Please try again later."); // Improved error handling
    }
}




// async function getRecipeDetails(recipe_id) {
//     let recipe_info = await getRecipeInformation(recipe_id);
//     let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, summary, analyzedInstructions, extendedIngredients } = recipe_info.data;

//     return {
//         id: id,
//         title: title,
//         readyInMinutes: readyInMinutes,
//         image: image,
//         popularity: aggregateLikes,
//         vegan: vegan,
//         vegetarian: vegetarian,
//         glutenFree: glutenFree,
//         summary: summary,
//         analyzedInstructions: analyzedInstructions,
//         extendedIngredients: extendedIngredients,
//     };
// }


async function searchRecipe(recipeName, cuisine, diet, intolerance, number, username) {
    try {
        const response = await axios.get(`${api_domain}/complexSearch`, {
            params: {
                query: recipeName,
                cuisine: cuisine,
                diet: diet,
                intolerances: intolerance,
                number: number,
                apiKey: process.env.SPOONACULAR_API_KEY // Use the correct environment variable name
            }
        });
        return getRecipeInformation(response.data.results.map((element) => element.id), username);
    } catch (error) {
        if (error.response && error.response.status === 402) {
            // Spoonacular API limit error
            throw { status: 402, message: "API limit exceeded. Please try again tomorrow." };
        }
        throw error;
    }
}


/**
 * Retrieves three random recipes from the Spoonacular API
 * and checks if any of them are in the user's favorites if the user is logged in.
 * 
 * @param {string} user_id - The unique identifier of the user (may be undefined).
 * @returns {Promise<Array>} A promise that resolves to an array of objects containing recipe data and favorite status.
 */
async function getRandomRecipes(user_id, number) {
    if (!number || number <= 0) {
        throw new Error("Invalid number of recipes requested");
    }

    try {
        // Step 1: Fetch random recipes from the Spoonacular API
        const response = await axios.get(`${api_domain}/random`, {
            params: {
                number: number,
                includeNutrition: false,
                apiKey: process.env.SPOONACULAR_API_KEY, // Consistent naming
            },
        });

        const recipes = response.data.recipes;

        // Step 2: Format the recipes
        const formattedRecipes = recipes.map((recipe) => ({
            id: recipe.id,
            title: recipe.title,
            readyInMinutes: recipe.readyInMinutes,
            image: recipe.image,
            aggregateLikes: recipe.aggregateLikes,
            vegan: recipe.vegan,
            vegetarian: recipe.vegetarian,
            glutenFree: recipe.glutenFree,
            summary: recipe.summary,
            extendedIngredients: recipe.extendedIngredients,
            analyzedInstructions: recipe.analyzedInstructions,
        }));

        // Step 3: Check for favorites if user is logged in
        let favoriteIds = [];
        if (user_id) {
            // Retrieve favorite recipe IDs directly within this function
            const fav_recipes_id = await DButils.execQuery(
                `SELECT recipe_id FROM favorites WHERE user_id = ?`,
                [user_id]
            );
            favoriteIds = fav_recipes_id.map((item) => item.recipe_id); // Extract recipe IDs from results
        }

        // Step 4: Add favorite status to formatted recipes
        return formattedRecipes.map((recipe) => ({
            ...recipe,
            isFavorite: favoriteIds.includes(recipe.id), // Check favorite status
        }));

    } catch (error) {
        console.error("Error fetching random recipes:", error);
        throw new Error("Failed to fetch random recipes. Please try again later."); // Improved error handling
    }
}
module.exports = {
    getRandomRecipes,
    getRecipeInformation,
    searchRecipe,
};