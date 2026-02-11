/**
 * Restaurant Controller
 * Handles restaurant operations
 */

const db = require('../config/database');
const { uploadConfig } = require('../config/uploadConfig');
const Restaurant = require('../models/Restaurant');

class RestaurantController {
    /**
     * Get all restaurants
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getAllRestaurants(req, res) {
        try {
            const {
                page = 1,
                limit = 12,
                is_open,
                category_id,
                search,
                min_rating,
                sort_by
            } = req.query;
            
            const filters = {
                is_open: is_open ? is_open === 'true' : undefined,
                category_id: category_id || undefined,
                search: search || undefined,
                min_rating: min_rating || undefined,
                sort_by: sort_by || undefined,
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            };
            
            // Get restaurants with filters
            const restaurants = await Restaurant.getAll(filters);
            
            // Get total count for pagination
            let countSql = `
                SELECT COUNT(DISTINCT r.id) as total
                FROM restaurants r
                LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
                WHERE r.status = 'active'
            `;
            
            const countParams = [];
            
            if (filters.is_open !== undefined) {
                countSql += ' AND r.is_open = ?';
                countParams.push(filters.is_open ? 1 : 0);
            }
            
            if (filters.category_id) {
                countSql += ' AND mi.category_id = ?';
                countParams.push(filters.category_id);
            }
            
            if (filters.search) {
                countSql += ' AND (r.name LIKE ? OR r.description LIKE ? OR r.address LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                countParams.push(searchTerm, searchTerm, searchTerm);
            }
            
            const [countResult] = await db.query(countSql, countParams);
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);
            
            // Format response with image URLs
            const formattedRestaurants = restaurants.map(restaurant => ({
                ...restaurant,
                logo_url: restaurant.logo_url 
                    ? uploadConfig.getFileUrl(restaurant.logo_url, 'restaurant_logo')
                    : null,
                cover_image_url: restaurant.cover_image_url 
                    ? uploadConfig.getFileUrl(restaurant.cover_image_url, 'restaurant_cover')
                    : null,
                avg_rating: restaurant.avg_rating ? parseFloat(restaurant.avg_rating) : 0
            }));
            
            res.status(200).json({
                success: true,
                data: {
                    restaurants: formattedRestaurants,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages,
                        hasNext: parseInt(page) < totalPages,
                        hasPrev: parseInt(page) > 1
                    }
                }
            });
        } catch (error) {
            console.error('Get All Restaurants Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get restaurants'
            });
        }
    }

    /**
     * Get single restaurant by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getRestaurantById(req, res) {
        try {
            const { id } = req.params;
            
            const restaurant = await Restaurant.getById(id);
            
            if (!restaurant) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            // Format response with image URLs
            const formattedRestaurant = {
                ...restaurant,
                logo_url: restaurant.logo_url 
                    ? uploadConfig.getFileUrl(restaurant.logo_url, 'restaurant_logo')
                    : null,
                cover_image_url: restaurant.cover_image_url 
                    ? uploadConfig.getFileUrl(restaurant.cover_image_url, 'restaurant_cover')
                    : null,
                avg_rating: restaurant.avg_rating ? parseFloat(restaurant.avg_rating) : 0
            };
            
            // Get restaurant menu categories
            const categories = await Restaurant.getCategories(id);
            
            // Get featured menu items
            const featuredItems = await Restaurant.getMenu(id, { 
                is_featured: true,
                limit: 6 
            });
            
            // Format menu items with image URLs
            const formattedFeaturedItems = featuredItems.map(item => ({
                ...item,
                image_url: item.image_url 
                    ? uploadConfig.getFileUrl(item.image_url, 'menu')
                    : null
            }));
            
            res.status(200).json({
                success: true,
                data: {
                    restaurant: formattedRestaurant,
                    categories,
                    featured_items: formattedFeaturedItems
                }
            });
        } catch (error) {
            console.error('Get Restaurant By ID Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get restaurant'
            });
        }
    }

    /**
     * Get restaurant menu
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getRestaurantMenu(req, res) {
        try {
            const { id } = req.params;
            const {
                category_id,
                is_vegetarian,
                is_spicy,
                is_featured,
                search,
                sort_by,
                min_price,
                max_price
            } = req.query;
            
            // Check if restaurant exists and is open
            const [restaurant] = await db.query(
                'SELECT id, name, is_open FROM restaurants WHERE id = ? AND status = "active"',
                [id]
            );
            
            if (restaurant.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            if (!restaurant[0].is_open) {
                return res.status(400).json({
                    success: false,
                    error: 'Restaurant is currently closed'
                });
            }
            
            const filters = {
                category_id: category_id || undefined,
                is_vegetarian: is_vegetarian ? is_vegetarian === 'true' : undefined,
                is_spicy: is_spicy ? is_spicy === 'true' : undefined,
                is_featured: is_featured ? is_featured === 'true' : undefined,
                search: search || undefined,
                sort_by: sort_by || undefined,
                min_price: min_price ? parseFloat(min_price) : undefined,
                max_price: max_price ? parseFloat(max_price) : undefined
            };
            
            const menuItems = await Restaurant.getMenu(id, filters);
            
            // Format response with image URLs
            const formattedMenuItems = menuItems.map(item => ({
                ...item,
                image_url: item.image_url 
                    ? uploadConfig.getFileUrl(item.image_url, 'menu')
                    : null,
                discounted_price: item.discounted_price || null,
                final_price: item.discounted_price || item.price
            }));
            
            // Get categories for filter
            const categories = await Restaurant.getCategories(id);
            
            res.status(200).json({
                success: true,
                data: {
                    restaurant: {
                        id: restaurant[0].id,
                        name: restaurant[0].name
                    },
                    menu_items: formattedMenuItems,
                    categories,
                    filters: {
                        available: categories.length > 0,
                        vegetarian: menuItems.some(item => item.is_vegetarian),
                        spicy: menuItems.some(item => item.is_spicy),
                        price_range: {
                            min: menuItems.length > 0 ? Math.min(...menuItems.map(item => item.discounted_price || item.price)) : 0,
                            max: menuItems.length > 0 ? Math.max(...menuItems.map(item => item.discounted_price || item.price)) : 0
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Get Restaurant Menu Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get restaurant menu'
            });
        }
    }

    /**
     * Get restaurant reviews
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getRestaurantReviews(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10 } = req.query;
            
            // Check if restaurant exists
            const [restaurant] = await db.query(
                'SELECT id, name FROM restaurants WHERE id = ?',
                [id]
            );
            
            if (restaurant.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            const reviews = await Restaurant.getReviews(id, {
                page: parseInt(page),
                limit: parseInt(limit)
            });
            
            // Format response with profile picture URLs
            const formattedReviews = reviews.reviews.map(review => ({
                ...review,
                user_profile_picture: review.profile_picture 
                    ? uploadConfig.getFileUrl(review.profile_picture, 'profile')
                    : null
            }));
            
            res.status(200).json({
                success: true,
                data: {
                    restaurant: {
                        id: restaurant[0].id,
                        name: restaurant[0].name
                    },
                    reviews: formattedReviews,
                    pagination: reviews.pagination,
                    summary: reviews.summary
                }
            });
        } catch (error) {
            console.error('Get Restaurant Reviews Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get restaurant reviews'
            });
        }
    }

    /**
     * Submit restaurant review
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async submitReview(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const {
                rating,
                food_rating,
                delivery_rating,
                service_rating,
                comment,
                order_id
            } = req.body;
            
            // Validate input
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    error: 'Rating must be between 1 and 5'
                });
            }
            
            // Check if restaurant exists
            const [restaurant] = await db.query(
                'SELECT id FROM restaurants WHERE id = ? AND status = "active"',
                [id]
            );
            
            if (restaurant.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            // Check if user has ordered from this restaurant
            if (order_id) {
                const [order] = await db.query(
                    'SELECT id FROM orders WHERE id = ? AND user_id = ? AND restaurant_id = ? AND status = "delivered"',
                    [order_id, userId, id]
                );
                
                if (order.length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'You can only review orders you have received from this restaurant'
                    });
                }
                
                // Check if review already exists for this order
                const [existingReview] = await db.query(
                    'SELECT id FROM reviews WHERE order_id = ?',
                    [order_id]
                );
                
                if (existingReview.length > 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'You have already reviewed this order'
                    });
                }
            }
            
            // Check if user has already reviewed this restaurant (without order_id)
            const [existingRestaurantReview] = await db.query(
                'SELECT id FROM reviews WHERE user_id = ? AND restaurant_id = ? AND order_id IS NULL',
                [userId, id]
            );
            
            if (existingRestaurantReview.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'You have already reviewed this restaurant'
                });
            }
            
            const reviewData = {
                user_id: userId,
                restaurant_id: id,
                order_id: order_id || null,
                rating: parseFloat(rating),
                food_rating: food_rating ? parseFloat(food_rating) : null,
                delivery_rating: delivery_rating ? parseFloat(delivery_rating) : null,
                service_rating: service_rating ? parseFloat(service_rating) : null,
                comment: comment || null,
                is_verified: order_id ? true : false,
                status: 'pending' // Will be approved by admin
            };
            
            const [result] = await db.query(
                'INSERT INTO reviews SET ?',
                [reviewData]
            );
            
            // Update restaurant rating
            await db.query(
                `CALL UpdateRestaurantRating(?)`,
                [id]
            );
            
            res.status(201).json({
                success: true,
                message: 'Review submitted successfully. It will be visible after approval.',
                data: {
                    review_id: result.insertId
                }
            });
        } catch (error) {
            console.error('Submit Review Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to submit review'
            });
        }
    }

    /**
     * Search restaurants
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async searchRestaurants(req, res) {
        try {
            const { q, category_id, limit = 10 } = req.query;
            
            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query must be at least 2 characters long'
                });
            }
            
            const restaurants = await Restaurant.search(q.trim(), {
                category_id: category_id || undefined,
                limit: parseInt(limit)
            });
            
            // Format response with image URLs
            const formattedRestaurants = restaurants.map(restaurant => ({
                ...restaurant,
                logo_url: restaurant.logo_url 
                    ? uploadConfig.getFileUrl(restaurant.logo_url, 'restaurant_logo')
                    : null,
                avg_rating: restaurant.avg_rating ? parseFloat(restaurant.avg_rating) : 0
            }));
            
            res.status(200).json({
                success: true,
                data: {
                    query: q,
                    results: formattedRestaurants,
                    count: formattedRestaurants.length
                }
            });
        } catch (error) {
            console.error('Search Restaurants Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search restaurants'
            });
        }
    }

    /**
     * Get nearby restaurants
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getNearbyRestaurants(req, res) {
        try {
            const { lat, lng, radius = 10 } = req.query;
            
            if (!lat || !lng) {
                return res.status(400).json({
                    success: false,
                    error: 'Latitude and longitude are required'
                });
            }
            
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            const radiusKm = parseFloat(radius);
            
            if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid coordinates or radius'
                });
            }
            
            const restaurants = await Restaurant.getNearby(latitude, longitude, radiusKm);
            
            // Format response with image URLs
            const formattedRestaurants = restaurants.map(restaurant => ({
                ...restaurant,
                logo_url: restaurant.logo_url 
                    ? uploadConfig.getFileUrl(restaurant.logo_url, 'restaurant_logo')
                    : null,
                distance_km: parseFloat(restaurant.distance_km).toFixed(1)
            }));
            
            res.status(200).json({
                success: true,
                data: {
                    location: { latitude, longitude },
                    radius: radiusKm,
                    restaurants: formattedRestaurants,
                    count: formattedRestaurants.length
                }
            });
        } catch (error) {
            console.error('Get Nearby Restaurants Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get nearby restaurants'
            });
        }
    }

    /**
     * Get restaurant statistics (for restaurant owners)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getRestaurantStatistics(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            
            // Check if user owns this restaurant
            const [restaurant] = await db.query(
                'SELECT id, name, owner_id FROM restaurants WHERE id = ?',
                [id]
            );
            
            if (restaurant.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            if (restaurant[0].owner_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to view statistics for this restaurant'
                });
            }
            
            const statistics = await Restaurant.getStatistics(id);
            
            // Get recent orders
            const [recentOrders] = await db.query(
                `SELECT 
                    o.id,
                    o.order_number,
                    o.total_amount,
                    o.status,
                    o.created_at,
                    o.customer_name,
                    o.customer_phone,
                    COUNT(DISTINCT oi.id) as item_count
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.restaurant_id = ?
                GROUP BY o.id
                ORDER BY o.created_at DESC
                LIMIT 10`,
                [id]
            );
            
            // Get popular menu items
            const popularItems = await db.query(
                `SELECT 
                    mi.id,
                    mi.name,
                    mi.price,
                    mi.image_url,
                    SUM(oi.quantity) as total_ordered,
                    SUM(oi.subtotal) as total_revenue
                FROM menu_items mi
                LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
                LEFT JOIN orders o ON oi.order_id = o.id
                WHERE mi.restaurant_id = ? AND o.status = 'delivered'
                GROUP BY mi.id, mi.name, mi.price, mi.image_url
                ORDER BY total_ordered DESC
                LIMIT 5`,
                [id]
            );
            
            // Format response
            const response = {
                success: true,
                data: {
                    restaurant: {
                        id: restaurant[0].id,
                        name: restaurant[0].name
                    },
                    statistics: {
                        ...statistics,
                        completion_rate: statistics.total_orders > 0 
                            ? ((statistics.completed_orders / statistics.total_orders) * 100).toFixed(1)
                            : 0
                    },
                    recent_orders: recentOrders,
                    popular_items: popularItems.map(item => ({
                        ...item,
                        image_url: item.image_url 
                            ? uploadConfig.getFileUrl(item.image_url, 'menu')
                            : null
                    })),
                    charts: {
                        // You can add chart data here for daily/weekly sales
                        daily_sales: await this.getDailySalesData(id, 7),
                        order_status_distribution: await this.getOrderStatusDistribution(id)
                    }
                }
            };
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Get Restaurant Statistics Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get restaurant statistics'
            });
        }
    }

    /**
     * Get daily sales data for charts
     * @param {number} restaurantId - Restaurant ID
     * @param {number} days - Number of days
     * @returns {Promise<Array>} - Daily sales data
     */
    static async getDailySalesData(restaurantId, days = 7) {
        try {
            const [salesData] = await db.query(
                `SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as order_count,
                    SUM(total_amount) as total_sales,
                    AVG(total_amount) as avg_order_value
                FROM orders 
                WHERE restaurant_id = ? 
                    AND status = 'delivered'
                    AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at)
                ORDER BY date`,
                [restaurantId, days]
            );
            
            return salesData;
        } catch (error) {
            console.error('Get Daily Sales Data Error:', error);
            return [];
        }
    }

    /**
     * Get order status distribution
     * @param {number} restaurantId - Restaurant ID
     * @returns {Promise<Object>} - Status distribution
     */
    static async getOrderStatusDistribution(restaurantId) {
        try {
            const [distribution] = await db.query(
                `SELECT 
                    status,
                    COUNT(*) as count
                FROM orders 
                WHERE restaurant_id = ?
                GROUP BY status`,
                [restaurantId]
            );
            
            return distribution;
        } catch (error) {
            console.error('Get Order Status Distribution Error:', error);
            return [];
        }
    }

    /**
     * Create new restaurant (Admin/Restaurant Owner)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async createRestaurant(req, res) {
        try {
            const userId = req.user.id;
            const {
                name,
                description,
                phone,
                email,
                address,
                location,
                latitude,
                longitude,
                delivery_fee,
                min_order_amount,
                estimated_delivery_time,
                opening_time,
                closing_time
            } = req.body;
            
            // Validate required fields
            if (!name || !description || !phone || !address) {
                return res.status(400).json({
                    success: false,
                    error: 'Name, description, phone, and address are required'
                });
            }
            
            const restaurantData = {
                name: name.trim(),
                description: description.trim(),
                owner_id: req.user.role === 'admin' ? null : userId,
                phone: phone.trim(),
                email: email ? email.trim() : null,
                address: address.trim(),
                location: location || null,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                delivery_fee: delivery_fee ? parseFloat(delivery_fee) : 0,
                min_order_amount: min_order_amount ? parseFloat(min_order_amount) : 0,
                estimated_delivery_time: estimated_delivery_time || '30-45 minutes',
                opening_time: opening_time || '08:00:00',
                closing_time: closing_time || '22:00:00',
                is_open: true,
                status: req.user.role === 'admin' ? 'active' : 'pending'
            };
            
            const restaurantId = await Restaurant.create(restaurantData);
            
            res.status(201).json({
                success: true,
                message: req.user.role === 'admin' 
                    ? 'Restaurant created successfully' 
                    : 'Restaurant created successfully. It will be active after approval.',
                data: {
                    restaurant_id: restaurantId
                }
            });
        } catch (error) {
            console.error('Create Restaurant Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create restaurant'
            });
        }
    }

    /**
     * Update restaurant (Admin/Restaurant Owner)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async updateRestaurant(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const updateData = req.body;
            
            // Check if restaurant exists and user has permission
            const [restaurant] = await db.query(
                'SELECT id, owner_id FROM restaurants WHERE id = ?',
                [id]
            );
            
            if (restaurant.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            if (restaurant[0].owner_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to update this restaurant'
                });
            }
            
            // Remove any fields that shouldn't be updated
            delete updateData.id;
            delete updateData.owner_id;
            delete updateData.status; // Status changes should be through separate endpoint
            delete updateData.rating;
            delete updateData.created_at;
            
            const success = await Restaurant.update(id, updateData);
            
            if (!success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update restaurant'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Restaurant updated successfully'
            });
        } catch (error) {
            console.error('Update Restaurant Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update restaurant'
            });
        }
    }

    /**
     * Upload restaurant logo
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async uploadRestaurantLogo(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }
            
            // Check if restaurant exists and user has permission
            const [restaurant] = await db.query(
                'SELECT id, owner_id, logo_url FROM restaurants WHERE id = ?',
                [id]
            );
            
            if (restaurant.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            if (restaurant[0].owner_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to update this restaurant'
                });
            }
            
            // Delete old logo if exists
            if (restaurant[0].logo_url) {
                await uploadConfig.deleteFile(
                    uploadConfig.getFilePath(restaurant[0].logo_url, 'restaurant_logo')
                );
            }
            
            // Update restaurant with new logo
            const [result] = await db.query(
                'UPDATE restaurants SET logo_url = ?, updated_at = NOW() WHERE id = ?',
                [req.file.filename, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            const logoUrl = uploadConfig.getFileUrl(req.file.filename, 'restaurant_logo');
            
            res.status(200).json({
                success: true,
                message: 'Restaurant logo uploaded successfully',
                data: {
                    logo_url: req.file.filename,
                    logo_url_full: logoUrl
                }
            });
        } catch (error) {
            console.error('Upload Restaurant Logo Error:', error);
            
            // Delete uploaded file if error occurred
            if (req.file) {
                await uploadConfig.deleteFile(req.file.path);
            }
            
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to upload restaurant logo'
            });
        }
    }

    /**
     * Upload restaurant cover image
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async uploadRestaurantCover(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }
            
            // Check if restaurant exists and user has permission
            const [restaurant] = await db.query(
                'SELECT id, owner_id, cover_image_url FROM restaurants WHERE id = ?',
                [id]
            );
            
            if (restaurant.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            if (restaurant[0].owner_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to update this restaurant'
                });
            }
            
            // Delete old cover if exists
            if (restaurant[0].cover_image_url) {
                await uploadConfig.deleteFile(
                    uploadConfig.getFilePath(restaurant[0].cover_image_url, 'restaurant_cover')
                );
            }
            
            // Update restaurant with new cover
            const [result] = await db.query(
                'UPDATE restaurants SET cover_image_url = ?, updated_at = NOW() WHERE id = ?',
                [req.file.filename, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            const coverUrl = uploadConfig.getFileUrl(req.file.filename, 'restaurant_cover');
            
            res.status(200).json({
                success: true,
                message: 'Restaurant cover image uploaded successfully',
                data: {
                    cover_image_url: req.file.filename,
                    cover_image_url_full: coverUrl
                }
            });
        } catch (error) {
            console.error('Upload Restaurant Cover Error:', error);
            
            // Delete uploaded file if error occurred
            if (req.file) {
                await uploadConfig.deleteFile(req.file.path);
            }
            
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to upload restaurant cover image'
            });
        }
    }

    /**
     * Update restaurant status (Admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async updateRestaurantStatus(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only administrators can update restaurant status'
                });
            }
            
            const { id } = req.params;
            const { status } = req.body;
            
            if (!status || !['active', 'inactive', 'pending'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Valid status is required (active, inactive, or pending)'
                });
            }
            
            const success = await Restaurant.updateStatus(id, status);
            
            if (!success) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: `Restaurant status updated to ${status}`
            });
        } catch (error) {
            console.error('Update Restaurant Status Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update restaurant status'
            });
        }
    }

    /**
     * Update restaurant open status
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async updateRestaurantOpenStatus(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { is_open } = req.body;
            
            if (typeof is_open !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    error: 'is_open must be a boolean value'
                });
            }
            
            // Check if restaurant exists and user has permission
            const [restaurant] = await db.query(
                'SELECT id, owner_id FROM restaurants WHERE id = ?',
                [id]
            );
            
            if (restaurant.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            if (restaurant[0].owner_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to update this restaurant'
                });
            }
            
            const success = await Restaurant.updateOpenStatus(id, is_open);
            
            if (!success) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: `Restaurant is now ${is_open ? 'open' : 'closed'}`
            });
        } catch (error) {
            console.error('Update Restaurant Open Status Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update restaurant open status'
            });
        }
    }

    /**
     * Delete restaurant (Admin/Restaurant Owner)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async deleteRestaurant(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            
            // Check if restaurant exists and user has permission
            const [restaurant] = await db.query(
                'SELECT id, owner_id, logo_url, cover_image_url FROM restaurants WHERE id = ?',
                [id]
            );
            
            if (restaurant.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Restaurant not found'
                });
            }
            
            if (restaurant[0].owner_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to delete this restaurant'
                });
            }
            
            // Delete logo and cover images
            if (restaurant[0].logo_url) {
                await uploadConfig.deleteFile(
                    uploadConfig.getFilePath(restaurant[0].logo_url, 'restaurant_logo')
                );
            }
            
            if (restaurant[0].cover_image_url) {
                await uploadConfig.deleteFile(
                    uploadConfig.getFilePath(restaurant[0].cover_image_url, 'restaurant_cover')
                );
            }
            
            const success = await Restaurant.delete(id);
            
            if (!success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to delete restaurant'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Restaurant deleted successfully'
            });
        } catch (error) {
            console.error('Delete Restaurant Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete restaurant'
            });
        }
    }

    /**
     * Get all categories (public)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getAllCategories(req, res) {
        try {
            const { restaurant_id, is_active = true } = req.query;
            
            const Category = require('../models/Category');
            const categories = await Category.getAll({
                restaurant_id: restaurant_id || undefined,
                is_active: is_active === 'true'
            });
            
            // Format response with icon URLs
            const formattedCategories = categories.map(category => ({
                ...category,
                icon_url: category.icon 
                    ? uploadConfig.getFileUrl(category.icon, 'category')
                    : null
            }));
            
            res.status(200).json({
                success: true,
                data: {
                    categories: formattedCategories
                }
            });
        } catch (error) {
            console.error('Get All Categories Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get categories'
            });
        }
    }
}

module.exports = RestaurantController;
