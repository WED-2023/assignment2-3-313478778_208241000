require('dotenv').config();
const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const apiKey = process.env.apiKey;


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: apiKey
        }
    });
}



async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        
    }
}

async function searchRecipe(recipeName, cuisine, diet, intolerance, number) {
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
        return await fetchRecipesDetailsByIds(recipeIds);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      throw new Error("Failed to fetch recipes from Spoonacular.");
    }
  }
  
  async function fetchRecipesDetailsByIds(recipeIds) {
    return await Promise.all(recipeIds.map(id => getRecipeDetails(id)));
}



exports.getRecipeDetails = getRecipeDetails;
exports.searchRecipe = searchRecipe;


