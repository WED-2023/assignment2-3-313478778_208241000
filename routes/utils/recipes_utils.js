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


// async function searchRecipe(recipeName, cuisine, diet, intolerance, number, username) {
//     const response = await axios.get(`${api_domain}/complexSearch`, {
//         params: {
//             query: recipeName,
//             cuisine: cuisine,
//             diet: diet,
//             intolerances: intolerance,
//             number: number,
//             apiKey: process.env.spooncular_apiKey
//         }
//     });

//     return getRecipesPreview(response.data.results.map((element) => element.id), username);
// }


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
};

//Itay

// require('dotenv').config();
// const axios = require("axios");
// const api_domain = "https://api.spoonacular.com/recipes";
// const apiKey = process.env.apiKey;

// /**
//  * Get recipe details with options for full or preview information.
//  * @param {number} recipe_id
//  * @param {boolean} full - If true, return full details; otherwise return preview details.
//  * @returns {object} Recipe details object.
//  */
// async function getRecipeDetails(recipe_id, full = false) {
//     let recipe_info = await getRecipeInformation(recipe_id);
//     let {
//         id,
//         title,
//         readyInMinutes,
//         image,
//         aggregateLikes,
//         vegan,
//         vegetarian,
//         glutenFree,
//         extendedIngredients,
//         instructions,
//         analyzedInstructions
//     } = recipe_info.data;

//     if (full) {
//         // Return only the relevant full details
//         return {
//             id: id,
//             title: title,
//             readyInMinutes: readyInMinutes,
//             image: image,
//             aggregateLikes: aggregateLikes,
//             vegan: vegan,
//             vegetarian: vegetarian,
//             glutenFree: glutenFree,
//             extendedIngredients: extendedIngredients,
//             instructions: instructions,
//             analyzedInstructions: analyzedInstructions
//         };
//     } else {
//         // Return preview details
//         return {
//             id: id,
//             title: title,
//             readyInMinutes: readyInMinutes,
//             image: image,
//             aggregateLikes: aggregateLikes,
//             vegan: vegan,
//             vegetarian: vegetarian,
//             glutenFree: glutenFree,
//             summary: recipe_info.data.summary // Include summary for preview
//         };
//     }
// }



// /**
//  * Get recipes list from spoonacular response and extract relevant recipe data.
//  * @param {Array<number>} recipeIds - Array of recipe IDs.
//  * @param {boolean} full - If true, return full details; otherwise return preview details.
//  * @returns {Array<object>} Array of recipe details.
//  */
// async function fetchRecipesDetailsByIds(recipeIds, full = false) {
//     return await Promise.all(recipeIds.map(id => getRecipeDetails(id, full)));
// }

// /**
//  * Search for recipes by criteria and return either full or preview details.
//  * @param {string} recipeName - Recipe name to search for.
//  * @param {string} cuisine - Type of cuisine.
//  * @param {string} diet - Dietary preference.
//  * @param {string} intolerance - Intolerances to filter by.
//  * @param {number} number - Number of recipes to return.
//  * @param {boolean} full - If true, return full details; otherwise return preview details.
//  * @returns {Array<object>} Array of recipe search results.
//  */
// async function searchRecipe(recipeName, cuisine, diet, intolerance, number, full = false) {
//     try {
//         const cleanNumber = parseInt(
//             (typeof number === 'string' ? number.trim() : number || '5'),
//             10
//         );
//         const response = await axios.get(`${api_domain}/complexSearch`, {
//             params: {
//                 query: recipeName.trim(),
//                 cuisine: cuisine ? cuisine.trim() : undefined,
//                 diet: diet ? diet.trim() : undefined,
//                 intolerances: intolerance ? intolerance.trim() : undefined,
//                 number: cleanNumber,
//                 apiKey: apiKey.trim()
//             }
//         });

//         if (response.data.results.length === 0) {
//             return { message: 'No recipes were found for the given search criteria.' };
//         }
        
//         const recipeIds = response.data.results.map((element) => element.id);
//         return await fetchRecipesDetailsByIds(recipeIds, full); // Pass full flag to get full or preview data
//     } catch (error) {
//         console.error("Error fetching recipes:", error);
//         throw new Error("Failed to fetch recipes from Spoonacular.");
//     }
// }

// async function getRecipeInformation(recipe_id) {
//     return await axios.get(`${api_domain}/${recipe_id}/information`, {
//         params: {
//             includeNutrition: false,
//             apiKey: apiKey
//         }
//     });
// }

// exports.getRecipeDetails = getRecipeDetails;
// exports.searchRecipe = searchRecipe;




//Amit
// const axios = require("axios");
// require("dotenv").config();
// const api_domain = "https://api.spoonacular.com/recipes";
// const DButils = require("./DButils");
// // const { getFavoriteRecipes } = require("./user_utils"); // Importing the function from user_utils

// /**
//  * Get recipes list from spooncular response and extract the relevant recipe data for preview
//  * @param {*} recipes_info 
//  */


// async function getRecipeInformation(recipe_id) {
//     try {
//         const recipe_info = await axios.get(`${api_domain}/${recipe_id}/information`, {
//             params: {
//                 includeNutrition: false,
//                 apiKey: process.env.SPOONACULAR_API_KEY // Consistent naming
//             }
//         });

//         const recipe = recipe_info.data;

//         // Format the recipe data
//         const formattedRecipe = {
//             id: recipe.id,
//             title: recipe.title,
//             readyInMinutes: recipe.readyInMinutes,
//             image: recipe.image,
//             aggregateLikes: recipe.aggregateLikes,
//             vegan: recipe.vegan,
//             vegetarian: recipe.vegetarian,
//             glutenFree: recipe.glutenFree,
//             summary: recipe.summary,
//             extendedIngredients: recipe.extendedIngredients,
//             analyzedInstructions: recipe.analyzedInstructions,
//         };

//         return formattedRecipe; // Return the formatted recipe
//     } catch (error) {
//         console.error("Error fetching recipe information:", error);
//         throw new Error("Failed to fetch recipe information. Please try again later."); // Improved error handling
//     }
// }





// // async function getRecipeDetails(recipe_id) {
// //     let recipe_info = await getRecipeInformation(recipe_id);
// //     let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, summary, analyzedInstructions, extendedIngredients } = recipe_info.data;

// //     return {
// //         id: id,
// //         title: title,
// //         readyInMinutes: readyInMinutes,
// //         image: image,
// //         popularity: aggregateLikes,
// //         vegan: vegan,
// //         vegetarian: vegetarian,
// //         glutenFree: glutenFree,
// //         summary: summary,
// //         analyzedInstructions: analyzedInstructions,
// //         extendedIngredients: extendedIngredients,
// //     };
// // }


// // async function searchRecipe(recipeName, cuisine, diet, intolerance, number, username) {
// //     const response = await axios.get(`${api_domain}/complexSearch`, {
// //         params: {
// //             query: recipeName,
// //             cuisine: cuisine,
// //             diet: diet,
// //             intolerances: intolerance,
// //             number: number,
// //             apiKey: process.env.spooncular_apiKey
// //         }
// //     });

// //     return getRecipesPreview(response.data.results.map((element) => element.id), username);
// // }


// /**
//  * Retrieves three random recipes from the Spoonacular API
//  * and checks if any of them are in the user's favorites if the user is logged in.
//  * 
//  * @param {string} user_id - The unique identifier of the user (may be undefined).
//  * @returns {Promise<Array>} A promise that resolves to an array of objects containing recipe data and favorite status.
//  */
// async function getRandomRecipes(user_id, number) {
//     if (!number || number <= 0) {
//         throw new Error("Invalid number of recipes requested");
//     }

//     try {
//         // Step 1: Fetch random recipes from the Spoonacular API
//         const response = await axios.get(`${api_domain}/random`, {
//             params: {
//                 number: number,
//                 includeNutrition: false,
//                 apiKey: process.env.SPOONACULAR_API_KEY, // Consistent naming
//             },
//         });

//         const recipes = response.data.recipes;

//         // Step 2: Format the recipes
//         const formattedRecipes = recipes.map((recipe) => ({
//             id: recipe.id,
//             title: recipe.title,
//             readyInMinutes: recipe.readyInMinutes,
//             image: recipe.image,
//             aggregateLikes: recipe.aggregateLikes,
//             vegan: recipe.vegan,
//             vegetarian: recipe.vegetarian,
//             glutenFree: recipe.glutenFree,
//             summary: recipe.summary,
//             extendedIngredients: recipe.extendedIngredients,
//             analyzedInstructions: recipe.analyzedInstructions,
//         }));

//         // Step 3: Check for favorites if user is logged in
//         let favoriteIds = [];
//         if (user_id) {
//             // Retrieve favorite recipe IDs directly within this function
//             const fav_recipes_id = await DButils.execQuery(
//                 `SELECT recipe_id FROM favorites WHERE user_id = ?`,
//                 [user_id]
//             );
//             favoriteIds = fav_recipes_id.map((item) => item.recipe_id); // Extract recipe IDs from results
//         }

//         // Step 4: Add favorite status to formatted recipes
//         return formattedRecipes.map((recipe) => ({
//             ...recipe,
//             isFavorite: favoriteIds.includes(recipe.id), // Check favorite status
//         }));

//     } catch (error) {
//         console.error("Error fetching random recipes:", error);
//         throw new Error("Failed to fetch random recipes. Please try again later."); // Improved error handling
//     }
// }
// module.exports = {
//     getRandomRecipes,
//     getRecipeInformation,
// };


