require('dotenv').config();
const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const apiKey = process.env.apiKey;

/**
 * Get recipe details with options for full or preview information.
 * @param {number} recipe_id 
 * @param {boolean} full - If true, return full details; otherwise return preview details.
 * @returns {object} Recipe details object.
 */
async function getRecipeDetails(recipe_id, full = false) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, ...rest } = recipe_info.data;

    if (full) {
        // Return full details
        return {
            id: id,
            title: title,
            readyInMinutes: readyInMinutes,
            image: image,
            aggregateLikes: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree,
            ...rest // Include all remaining properties for full details
        };
    } else {
        // Return preview details
        return {
            id: id,
            title: title,
            readyInMinutes: readyInMinutes,
            image: image,
            aggregateLikes: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree,
            summary: recipe_info.data.summary // Include summary for preview
        };
    }
}

/**
 * Get recipes list from spoonacular response and extract relevant recipe data.
 * @param {Array<number>} recipeIds - Array of recipe IDs.
 * @param {boolean} full - If true, return full details; otherwise return preview details.
 * @returns {Array<object>} Array of recipe details.
 */
async function fetchRecipesDetailsByIds(recipeIds, full = false) {
    return await Promise.all(recipeIds.map(id => getRecipeDetails(id, full)));
}

/**
 * Search for recipes by criteria and return either full or preview details.
 * @param {string} recipeName - Recipe name to search for.
 * @param {string} cuisine - Type of cuisine.
 * @param {string} diet - Dietary preference.
 * @param {string} intolerance - Intolerances to filter by.
 * @param {number} number - Number of recipes to return.
 * @param {boolean} full - If true, return full details; otherwise return preview details.
 * @returns {Array<object>} Array of recipe search results.
 */
async function searchRecipe(recipeName, cuisine, diet, intolerance, number, full = false) {
    try {
        const cleanNumber = parseInt(
            (typeof number === 'string' ? number.trim() : number || '5'),
            10
        );
        const response = await axios.get(`${api_domain}/complexSearch`, {
            params: {
                query: recipeName.trim(),
                cuisine: cuisine ? cuisine.trim() : undefined,
                diet: diet ? diet.trim() : undefined,
                intolerances: intolerance ? intolerance.trim() : undefined,
                number: cleanNumber,
                apiKey: apiKey.trim()
            }
        });

        if (response.data.results.length === 0) {
            return { message: 'No recipes were found for the given search criteria.' };
        }
        
        const recipeIds = response.data.results.map((element) => element.id);
        return await fetchRecipesDetailsByIds(recipeIds, full); // Pass full flag to get full or preview data
    } catch (error) {
        console.error("Error fetching recipes:", error);
        throw new Error("Failed to fetch recipes from Spoonacular.");
    }
}

async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: apiKey
        }
    });
}

exports.getRecipeDetails = getRecipeDetails;
exports.searchRecipe = searchRecipe;
