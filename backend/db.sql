-- ============================================
-- FOOD EXPRESS DATABASE SETUP
-- Database: food_express_db
-- ============================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS food_express_db;
USE food_express_db;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    profile_picture VARCHAR(255) DEFAULT 'default-avatar.jpg',
    role ENUM('customer', 'restaurant', 'admin', 'delivery') DEFAULT 'customer',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- ============================================
-- RESTAURANTS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS restaurants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INT,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    logo_url VARCHAR(255),
    cover_image_url VARCHAR(255),
    rating DECIMAL(3, 2) DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    estimated_delivery_time VARCHAR(50),
    opening_time TIME,
    closing_time TIME,
    is_open BOOLEAN DEFAULT TRUE,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_owner (owner_id),
    INDEX idx_status (status),
    INDEX idx_is_open (is_open),
    FULLTEXT idx_search (name, description, address)
);

-- ============================================
-- CATEGORIES TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    restaurant_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_active (is_active),
    UNIQUE KEY unique_category_restaurant (name, restaurant_id)
);

-- ============================================
-- MENU ITEMS TABLE (IMPROVED)
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discounted_price DECIMAL(10, 2),
    category_id INT,
    restaurant_id INT,
    image_url VARCHAR(255),
    ingredients TEXT,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_spicy BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    preparation_time INT, -- in minutes
    calories INT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_available (is_available),
    INDEX idx_featured (is_featured),
    FULLTEXT idx_search (name, description, ingredients)
);

-- ============================================
-- CART TABLE (NEW - VERY IMPORTANT)
-- ============================================
CREATE TABLE IF NOT EXISTS cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    quantity INT DEFAULT 1,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, menu_item_id, restaurant_id),
    INDEX idx_user (user_id),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_user_restaurant (user_id, restaurant_id)
);

-- ============================================
-- ORDERS TABLE (IMPROVED)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    restaurant_id INT,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_method ENUM('cash_on_delivery', 'credit_card', 'mobile_money', 'bank_transfer') DEFAULT 'cash_on_delivery',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    delivery_address TEXT NOT NULL,
    delivery_instructions TEXT,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    assigned_driver_id INT NULL,
    estimated_delivery_time TIMESTAMP NULL,
    actual_delivery_time TIMESTAMP NULL,
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_driver_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number),
    INDEX idx_created_at (created_at),
    INDEX idx_payment_status (payment_status)
);

-- ============================================
-- ORDER ITEMS TABLE (IMPROVED)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    menu_item_id INT,
    menu_item_name VARCHAR(100) NOT NULL,
    menu_item_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL,
    INDEX idx_order (order_id),
    INDEX idx_menu_item (menu_item_id)
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    provider VARCHAR(50),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    failure_reason TEXT,
    refund_reason TEXT,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date)
);

-- ============================================
-- REVIEWS & RATINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    restaurant_id INT,
    order_id INT,
    menu_item_id INT NULL,
    rating DECIMAL(2,1) CHECK (rating >= 1 AND rating <= 5),
    food_rating INT CHECK (food_rating >= 1 AND food_rating <= 5),
    delivery_rating INT CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    service_rating INT CHECK (service_rating >= 1 AND service_rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE, -- Verified purchase
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_rating (rating),
    UNIQUE KEY unique_order_review (order_id) -- One review per order
);

-- ============================================
-- FAVORITES TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    restaurant_id INT NULL,
    menu_item_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, restaurant_id, menu_item_id),
    INDEX idx_user (user_id)
);

-- ============================================
-- NOTIFICATIONS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('order', 'promotion', 'system', 'alert') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    related_id INT, -- order_id or promotion_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- PROMOTIONS/COUPONS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS promotions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed', 'free_delivery') DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    usage_limit INT DEFAULT 1,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_active (is_active),
    INDEX idx_validity (valid_from, valid_until)
);

-- ============================================
-- DELIVERY ADDRESSES TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    label VARCHAR(50) NOT NULL, -- Home, Work, Other
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Tanzania',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_default (is_default)
);

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert admin user (password: admin123)
INSERT INTO users (name, email, password, phone, role) VALUES
('System Admin', 'admin@foodexpress.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK4YpF7bYr6dG6H2W8LzQ7J6bY1W2', '0712345678', 'admin'),
('Restaurant Owner', 'owner@mamaskitchen.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK4YpF7bYr6dG6H2W8LzQ7J6bY1W2', '0723456789', 'restaurant')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert sample customers
INSERT INTO users (name, email, password, phone, address) VALUES
('John Doe', 'john@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK4YpF7bYr6dG6H2W8LzQ7J6bY1W2', '0711111111', '123 Main Street, Dar es Salaam'),
('Jane Smith', 'jane@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK4YpF7bYr6dG6H2W8LzQ7J6bY1W2', '0722222222', '456 Another Road, Mwanza'),
('Michael Johnson', 'michael@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK4YpF7bYr6dG6H2W8LzQ7J6bY1W2', '0733333333', '789 City Center, Arusha')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert restaurants
INSERT INTO restaurants (name, description, owner_id, phone, address, rating, delivery_fee, min_order_amount, estimated_delivery_time, is_open) VALUES
('Mama''s Kitchen', 'Authentic Tanzanian cuisine with traditional family recipes', 2, '0221234567', 'Samora Avenue, Dar es Salaam', 4.5, 2000.00, 5000.00, '30-45 minutes', TRUE),
('Burger Palace', 'Best gourmet burgers in town with homemade buns', 2, '0222345678', 'Mlimani City, Dar es Salaam', 4.8, 1500.00, 8000.00, '25-40 minutes', TRUE),
('Pizza Hub', 'Wood-fired pizza and Italian specialties', 2, '0223456789', 'Mbezi Beach, Dar es Salaam', 4.3, 2500.00, 10000.00, '35-50 minutes', TRUE),
('Seafood Haven', 'Fresh seafood straight from the Indian Ocean', 2, '0244567890', 'Kunduchi Beach, Dar es Salaam', 4.6, 3000.00, 12000.00, '40-60 minutes', TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert categories
INSERT INTO categories (name, description, restaurant_id, sort_order) VALUES
('Breakfast', 'Morning delights', 1, 1),
('Local Dishes', 'Traditional Tanzanian meals', 1, 2),
('Drinks', 'Beverages and refreshments', 1, 3),
('Burgers', 'Juicy beef and chicken burgers', 2, 1),
('Fries & Sides', 'Crispy accompaniments', 2, 2),
('Pizzas', 'Italian style pizzas', 3, 1),
('Pasta', 'Fresh pasta dishes', 3, 2),
('Seafood', 'Fresh from the ocean', 4, 1),
('Grilled Specials', 'Freshly grilled dishes', 4, 2)
ON DUPLICATE KEY UPDATE name = name;

-- Insert menu items
INSERT INTO menu_items (name, description, price, category_id, restaurant_id, is_available, is_featured) VALUES
-- Mama's Kitchen items
('Chips Mayai', 'Crispy fries mixed with scrambled eggs, served with kachumbari', 3000.00, 1, 1, TRUE, TRUE),
('Mandazi', 'Soft Swahili doughnuts, perfect with tea', 500.00, 1, 1, TRUE, FALSE),
('Chai Maziwa', 'Traditional tea with milk and spices', 300.00, 3, 1, TRUE, TRUE),
('Nyama Choma', 'Grilled meat with kachumbari and ugali', 12000.00, 2, 1, TRUE, TRUE),
('Pilau', 'Spiced rice with tender beef', 6000.00, 2, 1, TRUE, TRUE),
('Ugali & Sukuma', 'Traditional maize flour with collard greens', 4000.00, 2, 1, TRUE, FALSE),

-- Burger Palace items
('Classic Beef Burger', '200g beef patty with lettuce, tomato and special sauce', 8000.00, 4, 2, TRUE, TRUE),
('Chicken Burger', 'Grilled chicken breast with mayo and veggies', 7500.00, 4, 2, TRUE, TRUE),
('Double Cheese Burger', 'Two beef patties with double cheese', 11000.00, 4, 2, TRUE, FALSE),
('French Fries', 'Crispy golden fries', 2000.00, 5, 2, TRUE, FALSE),
('Onion Rings', 'Crispy battered onion rings', 2500.00, 5, 2, TRUE, FALSE),

-- Pizza Hub items
('Margherita Pizza', 'Classic tomato, mozzarella and basil', 12000.00, 6, 3, TRUE, TRUE),
('Pepperoni Pizza', 'Spicy pepperoni with extra cheese', 15000.00, 6, 3, TRUE, TRUE),
('Vegetarian Pizza', 'Mixed vegetables and cheese', 13000.00, 6, 3, TRUE, FALSE),
('Spaghetti Bolognese', 'Classic pasta with meat sauce', 9000.00, 7, 3, TRUE, TRUE),

-- Seafood Haven items
('Grilled Prawns', 'Fresh prawns with garlic butter', 18000.00, 8, 4, TRUE, TRUE),
('Fish & Chips', 'Beer-battered fish with chips', 14000.00, 8, 4, TRUE, TRUE),
('Seafood Platter', 'Mixed seafood grill for two', 35000.00, 9, 4, TRUE, FALSE),
('Calamari Rings', 'Crispy fried calamari', 8000.00, 8, 4, TRUE, FALSE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert sample cart items (if testing)
INSERT INTO cart (user_id, menu_item_id, restaurant_id, quantity) VALUES
(3, 1, 1, 2),  -- John has 2 Chips Mayai from Mama's Kitchen
(3, 7, 2, 1),  -- John has 1 Classic Beef Burger
(4, 12, 3, 1)  -- Jane has 1 Pepperoni Pizza
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- Insert sample orders
INSERT INTO orders (user_id, restaurant_id, order_number, total_amount, subtotal, delivery_fee, status, payment_method, payment_status, delivery_address, customer_name, customer_phone) VALUES
(3, 1, 'ORD20240115001', 15000.00, 13000.00, 2000.00, 'delivered', 'cash_on_delivery', 'paid', '123 Main Street, Dar es Salaam', 'John Doe', '0711111111'),
(4, 2, 'ORD20240115002', 9500.00, 8000.00, 1500.00, 'preparing', 'mobile_money', 'paid', '456 Another Road, Mwanza', 'Jane Smith', '0722222222'),
(5, 3, 'ORD20240115003', 14500.00, 12000.00, 2500.00, 'pending', 'cash_on_delivery', 'pending', '789 City Center, Arusha', 'Michael Johnson', '0733333333')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert order items
INSERT INTO order_items (order_id, menu_item_id, menu_item_name, menu_item_price, quantity, subtotal) VALUES
(1, 4, 'Nyama Choma', 12000.00, 1, 12000.00),
(1, 3, 'Chai Maziwa', 300.00, 2, 600.00),
(1, 2, 'Mandazi', 500.00, 2, 1000.00),
(2, 7, 'Classic Beef Burger', 8000.00, 1, 8000.00),
(3, 12, 'Pepperoni Pizza', 15000.00, 1, 15000.00)
ON DUPLICATE KEY UPDATE subtotal = quantity * menu_item_price;

-- Insert promotions
INSERT INTO promotions (code, name, discount_type, discount_value, min_order_amount, valid_from, valid_until, usage_limit) VALUES
('WELCOME20', 'Welcome Discount 20%', 'percentage', 20.00, 10000.00, '2024-01-01', '2024-12-31', 1),
('FREEDELIVERY', 'Free Delivery', 'free_delivery', 0.00, 15000.00, '2024-01-01', '2024-12-31', 100),
('SAVE1000', 'Save 1000 TSh', 'fixed', 1000.00, 5000.00, '2024-01-01', '2024-06-30', 5)
ON DUPLICATE KEY UPDATE name = name;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Calculate cart total for a user
DELIMITER //
CREATE PROCEDURE GetCartTotal(IN user_id INT)
BEGIN
    SELECT 
        SUM(mi.price * c.quantity) as subtotal,
        COUNT(DISTINCT c.restaurant_id) as restaurant_count,
        SUM(c.quantity) as item_count
    FROM cart c
    JOIN menu_items mi ON c.menu_item_id = mi.id
    WHERE c.user_id = user_id;
END //
DELIMITER ;

-- Get restaurant menu with categories
DELIMITER //
CREATE PROCEDURE GetRestaurantMenu(IN restaurant_id INT)
BEGIN
    SELECT 
        c.name as category_name,
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.discounted_price,
        mi.image_url,
        mi.is_vegetarian,
        mi.is_spicy,
        mi.is_available
    FROM menu_items mi
    JOIN categories c ON mi.category_id = c.id
    WHERE mi.restaurant_id = restaurant_id 
    AND mi.is_available = TRUE
    ORDER BY c.sort_order, mi.sort_order, mi.name;
END //
DELIMITER ;

-- Update restaurant rating
DELIMITER //
CREATE PROCEDURE UpdateRestaurantRating(IN rest_id INT)
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    
    SELECT AVG(rating) INTO avg_rating
    FROM reviews
    WHERE restaurant_id = rest_id AND status = 'approved';
    
    UPDATE restaurants 
    SET rating = COALESCE(avg_rating, 0), 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = rest_id;
END //
DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-generate order number
DELIMITER //
CREATE TRIGGER generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    IF NEW.order_number IS NULL THEN
        SET NEW.order_number = CONCAT(
            'ORD',
            DATE_FORMAT(NOW(), '%Y%m%d'),
            LPAD(
                (SELECT COALESCE(MAX(SUBSTRING(order_number, -5)), 0) + 1 
                 FROM orders 
                 WHERE DATE(created_at) = CURDATE()),
                5, '0'
            )
        );
    END IF;
END //
DELIMITER ;

-- Update order total when order items change
DELIMITER //
CREATE TRIGGER update_order_total
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders o
    SET o.subtotal = (
        SELECT SUM(subtotal) 
        FROM order_items 
        WHERE order_id = NEW.order_id
    ),
    o.total_amount = (
        SELECT SUM(subtotal) 
        FROM order_items 
        WHERE order_id = NEW.order_id
    ) + COALESCE(o.delivery_fee, 0) + COALESCE(o.tax_amount, 0) - COALESCE(o.discount_amount, 0),
    o.updated_at = CURRENT_TIMESTAMP
    WHERE o.id = NEW.order_id;
END //
DELIMITER ;

-- Clear cart after successful order
DELIMITER //
CREATE TRIGGER clear_cart_after_order
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        DELETE FROM cart WHERE user_id = NEW.user_id;
    END IF;
END //
DELIMITER ;

-- ============================================
-- VIEWS
-- ============================================

-- Available restaurants view
CREATE VIEW available_restaurants AS
SELECT 
    r.id,
    r.name,
    r.description,
    r.address,
    r.rating,
    r.delivery_fee,
    r.min_order_amount,
    r.estimated_delivery_time,
    r.logo_url,
    (SELECT COUNT(*) FROM menu_items WHERE restaurant_id = r.id AND is_available = TRUE) as menu_item_count
FROM restaurants r
WHERE r.is_open = TRUE AND r.status = 'active'
ORDER BY r.rating DESC, r.name;

-- User cart view
CREATE VIEW user_cart_view AS
SELECT 
    c.id as cart_id,
    c.user_id,
    c.quantity,
    mi.id as menu_item_id,
    mi.name,
    mi.description,
    mi.price,
    mi.image_url,
    r.id as restaurant_id,
    r.name as restaurant_name,
    r.delivery_fee,
    (mi.price * c.quantity) as item_total
FROM cart c
JOIN menu_items mi ON c.menu_item_id = mi.id
JOIN restaurants r ON c.restaurant_id = r.id
WHERE mi.is_available = TRUE;

-- Order details view
CREATE VIEW order_details AS
SELECT 
    o.id,
    o.order_number,
    o.total_amount,
    o.status,
    o.created_at,
    o.delivery_address,
    o.customer_name,
    o.customer_phone,
    r.name as restaurant_name,
    r.logo_url as restaurant_logo,
    u.name as customer_full_name,
    u.email as customer_email
FROM orders o
LEFT JOIN restaurants r ON o.restaurant_id = r.id
LEFT JOIN users u ON o.user_id = u.id;

-- ============================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_cart_user_restaurant ON cart(user_id, restaurant_id);
CREATE INDEX idx_menu_items_restaurant_category ON menu_items(restaurant_id, category_id, is_available);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_reviews_restaurant_user ON reviews(restaurant_id, user_id, created_at DESC);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC, is_read);

-- ============================================
-- DATABASE USERS AND PERMISSIONS
-- ============================================
-- Uncomment and modify for production:
-- CREATE USER 'foodexpress_app'@'localhost' IDENTIFIED BY 'StrongPassword123!';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON food_express_db.* TO 'foodexpress_app'@'localhost';
-- GRANT EXECUTE ON PROCEDURE food_express_db.* TO 'foodexpress_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- FINAL MESSAGES
-- ============================================
SELECT '✅ Database schema created successfully!' as message;
SELECT COUNT(*) as total_tables, 'tables created' as description FROM information_schema.tables WHERE table_schema = 'food_express_db';
SELECT '🔧 To apply this schema:' as instruction;
SELECT '1. Copy this entire script' as step;
SELECT '2. Run in MySQL client or phpMyAdmin' as step;
SELECT '3. Update .env file with database credentials' as step;

-- ============================================
-- END OF DATABASE SETUP
-- ============================================
