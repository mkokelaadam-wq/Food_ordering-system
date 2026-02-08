-- ============================================
-- FOOD ORDERING SYSTEM DATABASE SETUP
-- Database: food_ordering_db
-- ============================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS food_ordering_db;
USE food_ordering_db;

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
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- MENU ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(255),
    available BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_available (available)
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    order_number VARCHAR(20) UNIQUE,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    delivery_address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    payment_method ENUM('cash', 'card', 'mobile') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    notes TEXT,
    estimated_delivery TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    menu_item_id INT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id),
    INDEX idx_menu_item_id (menu_item_id)
);

-- ============================================
-- PAYMENTS TABLE (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_status (status)
);

-- ============================================
-- REVIEWS TABLE (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    menu_item_id INT,
    order_id INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_menu_item_id (menu_item_id),
    INDEX idx_user_id (user_id)
);

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert admin user (password: admin123)
INSERT INTO users (name, email, password, phone, role) VALUES
('Admin User', 'admin@foodexpress.com', '$2a$10$YourHashedPasswordHere', '0712345678', 'admin')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert sample customer (password: customer123)
INSERT INTO users (name, email, password, phone, address) VALUES
('John Doe', 'john@example.com', '$2a$10$YourHashedPasswordHere', '0711111111', '123 Main Street, Dar es Salaam'),
('Jane Smith', 'jane@example.com', '$2a$10$YourHashedPasswordHere', '0722222222', '456 Another Road, Mwanza')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert menu items
INSERT INTO menu_items (name, description, price, category, image_url, available, featured) VALUES
('Chips Mayai', 'Crispy fries mixed with scrambled eggs, served with kachumbari', 3000.00, 'Breakfast', 'chips-mayai.jpg', TRUE, TRUE),
('Mandazi', 'Soft Swahili doughnuts, perfect with tea or coffee', 500.00, 'Breakfast', 'mandazi.jpg', TRUE, FALSE),
('Chai Maziwa', 'Traditional tea with milk and spices', 300.00, 'Drinks', 'chai.jpg', TRUE, TRUE),
('Chicken Curry', 'Spicy chicken curry served with rice or chapati', 8000.00, 'Lunch', 'chicken-curry.jpg', TRUE, TRUE),
('Nyama Choma', 'Grilled meat served with kachumbari and ugali', 12000.00, 'Dinner', 'nyama-choma.jpg', TRUE, TRUE),
('Fish Fry', 'Fresh fried fish with chips and lemon', 9000.00, 'Dinner', 'fish-fry.jpg', TRUE, FALSE),
('Pilau', 'Spiced rice with tender beef or chicken', 6000.00, 'Lunch', 'pilau.jpg', TRUE, TRUE),
('Fresh Juice', 'Orange, Mango or Passion fruit juice', 2000.00, 'Drinks', 'juice.jpg', TRUE, FALSE),
('Fruit Salad', 'Mixed seasonal fruits with yogurt', 3500.00, 'Dessert', 'fruit-salad.jpg', TRUE, FALSE),
('Ice Cream', 'Vanilla, Chocolate or Strawberry', 2500.00, 'Dessert', 'ice-cream.jpg', TRUE, TRUE),
('Ugali & Sukuma', 'Traditional maize flour with collard greens', 4000.00, 'Lunch', 'ugali-sukuma.jpg', TRUE, FALSE),
('Beef Stew', 'Tender beef stew with vegetables', 7000.00, 'Dinner', 'beef-stew.jpg', TRUE, TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert sample orders
INSERT INTO orders (user_id, order_number, total_amount, status, delivery_address, phone, payment_method) VALUES
(2, 'ORD1001', 11000.00, 'delivered', '123 Main Street, Dar es Salaam', '0711111111', 'cash'),
(3, 'ORD1002', 16000.00, 'preparing', '456 Another Road, Mwanza', '0722222222', 'mobile'),
(2, 'ORD1003', 4500.00, 'pending', '123 Main Street, Dar es Salaam', '0711111111', 'cash')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert sample order items
INSERT INTO order_items (order_id, menu_item_id, quantity, price, subtotal) VALUES
(1, 1, 2, 3000.00, 6000.00),  -- 2 Chips Mayai
(1, 4, 1, 8000.00, 8000.00),  -- 1 Chicken Curry
(2, 5, 1, 12000.00, 12000.00), -- 1 Nyama Choma
(2, 8, 2, 2000.00, 4000.00),  -- 2 Fresh Juice
(3, 2, 3, 500.00, 1500.00),   -- 3 Mandazi
(3, 3, 2, 300.00, 600.00),    -- 2 Chai Maziwa
(3, 9, 1, 3500.00, 3500.00)   -- 1 Fruit Salad
ON DUPLICATE KEY UPDATE subtotal = quantity * price;

-- ============================================
-- STORED PROCEDURES (Optional)
-- ============================================

-- Procedure to calculate order total
DELIMITER //
CREATE PROCEDURE CalculateOrderTotal(IN order_id INT)
BEGIN
    SELECT SUM(subtotal) as total_amount
    FROM order_items
    WHERE order_id = order_id;
END //
DELIMITER ;

-- Procedure to get daily sales
DELIMITER //
CREATE PROCEDURE GetDailySales(IN sale_date DATE)
BEGIN
    SELECT 
        DATE(created_at) as sale_date,
        COUNT(*) as orders_count,
        SUM(total_amount) as total_sales
    FROM orders
    WHERE DATE(created_at) = sale_date
    GROUP BY DATE(created_at);
END //
DELIMITER ;

-- ============================================
-- VIEWS (Optional)
-- ============================================

-- View for available menu items
CREATE VIEW available_menu AS
SELECT id, name, price, category
FROM menu_items
WHERE available = TRUE
ORDER BY category, name;

-- View for order details with user info
CREATE VIEW order_details_view AS
SELECT 
    o.id as order_id,
    o.order_number,
    o.total_amount,
    o.status,
    o.created_at,
    u.name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone
FROM orders o
LEFT JOIN users u ON o.user_id = u.id;

-- ============================================
-- TRIGGERS (Optional)
-- ============================================

-- Trigger to generate order number
DELIMITER //
CREATE TRIGGER before_order_insert
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    IF NEW.order_number IS NULL THEN
        SET NEW.order_number = CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD((SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) + 1, 4, '0'));
    END IF;
END //
DELIMITER ;

-- Trigger to update order total when items change
DELIMITER //
CREATE TRIGGER after_order_item_change
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders o
    SET o.total_amount = (
        SELECT SUM(subtotal) 
        FROM order_items 
        WHERE order_id = NEW.order_id
    ),
    o.updated_at = CURRENT_TIMESTAMP
    WHERE o.id = NEW.order_id;
END //
DELIMITER ;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_menu_items_category_price ON menu_items(category, price);
CREATE INDEX idx_order_items_order_menu ON order_items(order_id, menu_item_id);

-- ============================================
-- DATABASE USERS AND PERMISSIONS (For Production)
-- ============================================
-- CREATE USER 'food_app'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON food_ordering_db.* TO 'food_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- END OF DATABASE SETUP
-- ============================================
