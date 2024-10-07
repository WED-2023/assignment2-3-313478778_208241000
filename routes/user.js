var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipe_id and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites/add', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipe_id;
    await user_utils.markAsFavorite(user_id, recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
  } catch (error) {
    next(error);
  }
})


/**
 * This path removes a recipe from the user's favorites list.
 */
router.delete('/favorites/remove', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipe_id;

    // Call the function to remove the recipe from the favorites
    await user_utils.unMarkAsFavorite(user_id, recipe_id);

    // Send a success message back to the client
    res.status(200).send("The Recipe was successfully removed from favorites");
  } catch (error) {
    // Pass any error to the next middleware (error handler)
    next(error);
  }
});


/**
 * This path returns the favorite recipes that were saved by the logged-in user
 */
router.get('/favorites/show', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    // Use the getAllFavoriteRecipes function to get detailed favorite recipes
    const favoriteRecipes = await user_utils.getAllFavoriteRecipes(user_id);

    // Send the detailed favorite recipes as a response
    res.status(200).send(favoriteRecipes);
  } catch (error) {
    next(error);
  }
});

router.post('/addRecipe', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const {
      recipe_name,
      image_url,
      readyInMinutes,
      glutenFree,
      vegan,
      vegetarian,
      ingredients, // array from frontend
      instructions, // array from frontend
      numberOfDishes
    } = req.body;

    // Combine dietary preferences into a single string
    const diet = [
      glutenFree ? 'glutenFree' : null,
      vegan ? 'vegan' : null,
      vegetarian ? 'vegetarian' : null,
    ].filter(Boolean).join(',');

    // Validate required fields
    if (!recipe_name || !Array.isArray(instructions) || !Array.isArray(ingredients) || !image_url) {
      throw { status: 400, message: "Recipe name, instructions, ingredients, and image_url are required." };
    }

    // Convert ingredients and instructions arrays into strings to store in DB
    const ingredientsText = ingredients.join(','); // comma-separated string
    const instructionsText = instructions.join(','); // comma-separated string

    // Additional validation for numeric fields
    if (isNaN(readyInMinutes) || isNaN(numberOfDishes)) {
      throw { status: 400, message: "Preparation time and number of dishes must be valid numbers." };
    }
    if (!req.session || !req.session.user_id) {
      return res.status(401).send({ message: "Unauthorized: No user session found" });
    }
    
    // Insert the recipe into the user_recipes table
    const result = await DButils.execQuery(`
      INSERT INTO user_recipes
      (user_id, recipe_name, diet, instructions, ingredients, image_url, prep_time, numberOfDishes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, recipe_name, diet, instructionsText, ingredientsText, image_url, readyInMinutes, numberOfDishes]
    );

    // Send confirmation response
    res.status(201).send({ message: "Recipe added successfully", success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/PrivateRecipes', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    // Ensure user is authenticated
    if (!user_id) {
      return res.status(401).send({ message: "Unauthorized: Please log in to view your recipes." });
    }

    // Fetch all recipes for the logged-in user
    const query = `
      SELECT recipe_id AS id, image_url AS image, recipe_name AS title, prep_time AS readyInMinutes,
             diet, instructions, ingredients
      FROM user_recipes
      WHERE user_id = ?`;
    const recipes = await DButils.execQuery(query, [user_id]);

    // Check if the user has any private recipes
    if (!recipes.length) {
      return res.status(404).send({ message: "No private recipes found for this user." });
    }

    // Transform recipes to structure with parsed diet
    const transformedRecipes = recipes.map(recipe => {
      // Parse diet string into an array
      const dietArray = recipe.diet ? recipe.diet.split(',') : [];

      return {
        id: recipe.id,
        image: recipe.image,
        title: recipe.title,
        readyInMinutes: recipe.readyInMinutes,
        diet: {
          vegetarian: dietArray.includes('vegetarian'),
          vegan: dietArray.includes('vegan'),
          glutenFree: dietArray.includes('gluten free')
        },
        summary: recipe.instructions, // Assuming summary is related to the instructions
        ingredients: recipe.ingredients // Returning ingredients for completeness
      };
    });

    res.status(200).send(transformedRecipes);
  } catch (error) {
    next(error);
  }
});

router.get('/PrivateRecipes/:recipe_id/view', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    // Ensure user is authenticated
    if (!user_id) {
      return res.status(401).send({ message: "Unauthorized: Please log in to view your recipes." });
    }

    const recipe_id = req.params.recipe_id;

    // Fetch the recipe details from user_recipes table
    const query = `
      SELECT recipe_id AS id, image_url AS image, recipe_name AS title, prep_time AS readyInMinutes,
             numberOfDishes AS servings, diet, ingredients, instructions
      FROM user_recipes
      WHERE recipe_id = ? AND user_id = ?`;
    const recipes = await DButils.execQuery(query, [recipe_id, user_id]);

    if (!recipes.length) {
      return res.status(404).send({ message: "Recipe not found or access denied." });
    }

    // Extract the recipe details
    const recipe = recipes[0];

    // Parse ingredients and instructions
    const parsedRecipe = {
      ...recipe,
      extendedIngredients: recipe.ingredients.split(',').map(ing => ({ original: ing.trim() })), // Parse ingredients string into an array of objects
      _instructions: recipe.instructions.split(',').map(step => ({ step: step.trim() })), // Parse instructions string into an array of objects
      diet: {
        vegetarian: recipe.diet.includes('vegetarian'),
        vegan: recipe.diet.includes('vegan'),
        glutenFree: recipe.diet.includes('glutenFree')
      },
    };

    res.status(200).send(parsedRecipe);
  } catch (error) {
    next(error);
  }
});


module.exports = router;
