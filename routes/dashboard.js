const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const users = await pool.query('SELECT COUNT(*) FROM users_epoxy');
        const orders = await pool.query('SELECT COUNT(*) FROM orders_epoxy');
        const products = await pool.query('SELECT COUNT(*) FROM products_epoxy');
        const categories = await pool.query('SELECT COUNT(*) FROM categories_epoxy');
        const loyalty = await pool.query('SELECT COALESCE(SUM(points_earned), 0) as total FROM loyalty_points_epoxy');
        
        const recentOrders = await pool.query('SELECT o.*, u.first_name, u.last_name FROM orders_epoxy o LEFT JOIN users_epoxy u ON o.user_id = u.user_id ORDER BY o.created_at DESC LIMIT 5');
        const recentUsers = await pool.query('SELECT * FROM users_epoxy ORDER BY created_at DESC LIMIT 5');

        res.render('dashboard', {
            stats: {
                totalUsers: parseInt(users.rows[0].count) || 0,
                totalOrders: parseInt(orders.rows[0].count) || 0,
                totalProducts: parseInt(products.rows[0].count) || 0,
                totalCategories: parseInt(categories.rows[0].count) || 0,
                totalLoyaltyPoints: parseInt(loyalty.rows[0].total) || 0
            },
            recentOrders: recentOrders.rows,
            recentUsers: recentUsers.rows
        });
    } catch (err) {
        console.error(err);
        res.render('error', { message: 'Greška pri učitavanju' });
    }
});

module.exports = router;
