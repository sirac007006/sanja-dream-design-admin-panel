const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const points = await pool.query('SELECT lp.*, u.first_name, u.last_name, u.email FROM loyalty_points_epoxy lp LEFT JOIN users_epoxy u ON lp.user_id = u.user_id ORDER BY lp.created_at DESC');
        const stats = await pool.query('SELECT COALESCE(SUM(points_earned), 0) as total_earned, COALESCE(SUM(points_spent), 0) as total_spent, COUNT(DISTINCT user_id) as unique_users FROM loyalty_points_epoxy');
        const users = await pool.query('SELECT user_id, first_name, last_name, email FROM users_epoxy ORDER BY first_name');
        
        res.render('loyalty/index', { 
            points: points.rows, 
            stats: {
                totalEarned: parseInt(stats.rows[0].total_earned) || 0,
                totalSpent: parseInt(stats.rows[0].total_spent) || 0,
                uniqueUsers: parseInt(stats.rows[0].unique_users) || 0
            },
            users: users.rows 
        });
    } catch (err) {
        console.error(err);
        res.render('error', { message: 'Greška' });
    }
});

module.exports = router;
