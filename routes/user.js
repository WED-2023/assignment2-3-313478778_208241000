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
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites/add', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
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
    const recipe_id = req.body.recipeId;

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


router.get('/PrivateRecipe/:recipeId/preview', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    // Ensure user is authenticated
    if (!user_id) {
      return res.status(401).send({ message: "Unauthorized: Please log in to view your recipes." });
    }

    const recipeId = req.params.recipeId;
    const query = `
      SELECT id, image_url AS image, recipe_name AS title, readyInMinutes,
             aggregateLikes, vegetarian, vegan, glutenFree, summary
      FROM user_recipes
      WHERE id = ? AND user_id = ?`;
    const recipe = await DButils.execQuery(query, [recipeId, user_id]);

    if (!recipe.length) {
      return res.status(404).send({ message: "Recipe not found or access denied." });
    }

    res.status(200).send(recipe[0]);
  } catch (error) {
    next(error);
  }
});


router.get('/PrivateRecipe/:recipeId/view', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    // Ensure user is authenticated
    if (!user_id) {
      return res.status(401).send({ message: "Unauthorized: Please log in to view your recipes." });
    }

    const recipeId = req.params.recipeId;
    const query = `
      SELECT id, image_url AS image, recipe_name AS title, readyInMinutes,
             servings, vegetarian, vegan, glutenFree, aggregateLikes, summary,
             ingredients, instructions
      FROM user_recipes
      WHERE id = ? AND user_id = ?`;
    const recipe = await DButils.execQuery(query, [recipeId, user_id]);

    if (!recipe.length) {
      return res.status(404).send({ message: "Recipe not found or access denied." });
    }

    // Parse ingredients and instructions
    const parsedRecipe = {
      ...recipe[0],
      extendedIngredients: recipe[0].ingredients.split(',').map(ing => ({ original: ing.trim() })),
      _instructions: recipe[0].instructions.split(',').map(step => ({ step: step.trim() }))
    };

    res.status(200).send(parsedRecipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
