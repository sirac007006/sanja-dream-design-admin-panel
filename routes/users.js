const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users_epoxy ORDER BY created_at DESC');
        res.render('users/index', { users: result.rows });
    } catch (err) {
        console.error(err);
        res.render('error', { message: 'Greška' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await pool.query('SELECT * FROM users_epoxy WHERE user_id = $1', [req.params.id]);
        if (user.rows.length === 0) return res.render('error', { message: 'Korisnik nije pronađen' });
        
        const loyalty = await pool.query('SELECT * FROM loyalty_points_epoxy WHERE user_id = $1 ORDER BY created_at DESC', [req.params.id]);
        const orders = await pool.query('SELECT * FROM orders_epoxy WHERE user_id = $1 ORDER BY created_at DESC', [req.params.id]);
        
        res.render('users/detail', { user: user.rows[0], loyaltyPoints: loyalty.rows, orders: orders.rows });
    } catch (err) {
        console.error(err);
        res.render('error', { message: 'Greška' });
    }
});

module.exports = router;
