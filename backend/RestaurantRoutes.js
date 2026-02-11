const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');

// @route   GET /api/restaurants
// @desc    Get all restaurants
// @access  Public
router.get('/', restaurantController.getAllRestaurants);

// @route   GET /api/restaurants/:id
// @desc    Get single restaurant
// @access  Public
router.get('/:id', restaurantController.getRestaurantById);

// @route   GET /api/restaurants/:id/menu
// @desc    Get restaurant menu items
// @access  Public
router.get('/:id/menu', restaurantController.getRestaurantMenu);

// @route   POST /api/restaurants
// @desc    Create new restaurant (Admin only)
// @access  Private/Admin
router.post('/', restaurantController.createRestaurant);

// @route   PUT /api/restaurants/:id
// @desc    Update restaurant (Admin only)
// @access  Private/Admin
router.put('/:id', restaurantController.updateRestaurant);

// @route   DELETE /api/restaurants/:id
// @desc    Delete restaurant (Admin only)
// @access  Private/Admin
router.delete('/:id', restaurantController.deleteRestaurant);

module.exports = router;
