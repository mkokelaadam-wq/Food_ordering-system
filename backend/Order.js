const pool = require('../config/database');

class Order {
    // Create new order
    static async create(orderData, items) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Insert order
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (user_id, total_amount, delivery_address, phone, payment_method) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    orderData.user_id,
                    orderData.total_amount,
                    orderData.delivery_address,
                    orderData.phone,
                    orderData.payment_method || 'cash'
                ]
            );
            
            const orderId = orderResult.insertId;
            
            // Insert order items
            for (const item of items) {
                await connection.execute(
                    `INSERT INTO order_items (order_id, menu_item_id, quantity, price, subtotal) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [orderId, item.menu_item_id, item.quantity, item.price, item.subtotal]
                );
            }
            
            await connection.commit();
            return orderId;
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get user orders
    static async getByUser(userId) {
        const [rows] = await pool.execute(
            `SELECT o.*, 
                    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
             FROM orders o 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    }
}

module.exports = Order;
