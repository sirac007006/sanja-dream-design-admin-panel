const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT o.*, u.first_name, u.last_name, u.email FROM orders_epoxy o LEFT JOIN users_epoxy u ON o.user_id = u.user_id ORDER BY o.created_at DESC');
        res.render('orders/index', { orders: result.rows });
    } catch (err) {
        console.error(err);
        res.render('error', { message: 'Greška' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const order = await pool.query('SELECT o.*, u.first_name, u.last_name, u.email, u.phone FROM orders_epoxy o LEFT JOIN users_epoxy u ON o.user_id = u.user_id WHERE o.order_id = $1', [req.params.id]);
        if (order.rows.length === 0) return res.render('error', { message: 'Porudžbina nije pronađena' });
        
        const items = await pool.query('SELECT * FROM order_items_epoxy WHERE order_id = $1', [req.params.id]);
        const tracking = await pool.query('SELECT * FROM order_tracking_epoxy WHERE order_id = $1 ORDER BY created_at DESC', [req.params.id]);
        
        res.render('orders/detail', { order: order.rows[0], items: items.rows, tracking: tracking.rows });
    } catch (err) {
        console.error(err);
        res.render('error', { message: 'Greška' });
    }
});

module.exports = router;
