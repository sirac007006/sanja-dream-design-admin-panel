const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// USERS
router.post('/users', async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone, role } = req.body;
        const exists = await pool.query('SELECT * FROM users_epoxy WHERE email = $1', [email]);
        if (exists.rows.length > 0) return res.status(400).json({ error: 'Email već postoji' });
        
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO users_epoxy (first_name, last_name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', 
            [first_name, last_name, email, hash, phone || null, role || 'customer']);
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM users_epoxy WHERE user_id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Greška' });
    }
});

// PRODUCTS
router.post('/products', async (req, res) => {
    try {
        const { name, slug, description, subcategory_id, price, sale_price, stock_quantity, is_featured, is_new, is_on_sale } = req.body;
        const result = await pool.query(
            'INSERT INTO products_epoxy (name, slug, description, subcategory_id, price, sale_price, stock_quantity, is_featured, is_new, is_on_sale) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [name, slug, description || null, subcategory_id || null, price, sale_price || null, stock_quantity || 0, is_featured === true, is_new === true, is_on_sale === true]
        );
        res.json({ success: true, product: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška' });
    }
});

router.put('/products/:id', async (req, res) => {
    try {
        const { name, slug, price, sale_price, stock_quantity, is_featured, is_new, is_on_sale } = req.body;
        await pool.query(
            'UPDATE products_epoxy SET name=$1, slug=$2, price=$3, sale_price=$4, stock_quantity=$5, is_featured=$6, is_new=$7, is_on_sale=$8, updated_at=CURRENT_TIMESTAMP WHERE product_id=$9',
            [name, slug, price, sale_price || null, stock_quantity || 0, is_featured === true, is_new === true, is_on_sale === true, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška' });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM products_epoxy WHERE product_id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Greška' });
    }
});

// CATEGORIES
router.post('/categories', async (req, res) => {
    try {
        const { name, slug, description, icon, display_order, is_active } = req.body;
        const result = await pool.query(
            'INSERT INTO categories_epoxy (name, slug, description, icon, display_order, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, slug, description || null, icon || null, display_order || 0, is_active === true]
        );
        res.json({ success: true, category: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška' });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const { name, slug, icon, display_order, is_active } = req.body;
        await pool.query(
            'UPDATE categories_epoxy SET name=$1, slug=$2, icon=$3, display_order=$4, is_active=$5 WHERE category_id=$6',
            [name, slug, icon || null, display_order || 0, is_active === true, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška' });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM categories_epoxy WHERE category_id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Greška' });
    }
});

// SUBCATEGORIES
router.post('/subcategories', async (req, res) => {
    try {
        const { category_id, name, slug, description, icon, display_order, is_active } = req.body;
        const result = await pool.query(
            'INSERT INTO subcategories_epoxy (category_id, name, slug, description, icon, display_order, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [category_id, name, slug, description || null, icon || null, display_order || 0, is_active === true]
        );
        res.json({ success: true, subcategory: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška' });
    }
});

router.put('/subcategories/:id', async (req, res) => {
    try {
        const { category_id, name, slug, is_active } = req.body;
        await pool.query(
            'UPDATE subcategories_epoxy SET category_id=$1, name=$2, slug=$3, is_active=$4 WHERE subcategory_id=$5',
            [category_id, name, slug, is_active === true, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška' });
    }
});

router.delete('/subcategories/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM subcategories_epoxy WHERE subcategory_id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Greška' });
    }
});

// ORDERS
router.put('/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE orders_epoxy SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2', [status, req.params.id]);
        await pool.query('INSERT INTO order_tracking_epoxy (order_id, status, description) VALUES ($1, $2, $3)', [req.params.id, status, 'Status promijenjen u: ' + status]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška' });
    }
});

// LOYALTY
router.post('/loyalty', async (req, res) => {
    try {
        const { user_id, points_earned, points_spent, reason } = req.body;
        await pool.query('INSERT INTO loyalty_points_epoxy (user_id, points_earned, points_spent, reason) VALUES ($1, $2, $3, $4)', 
            [user_id, points_earned || 0, points_spent || 0, reason]);
        const net = (parseInt(points_earned) || 0) - (parseInt(points_spent) || 0);
        await pool.query('UPDATE users_epoxy SET loyalty_points = loyalty_points + $1 WHERE user_id = $2', [net, user_id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška' });
    }
});

router.put('/loyalty/:id', async (req, res) => {
    try {
        const { points_earned, points_spent, reason } = req.body;
        await pool.query(
            'UPDATE loyalty_points_epoxy SET points_earned=$1, points_spent=$2, reason=$3 WHERE points_id=$4',
            [points_earned || 0, points_spent || 0, reason, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška' });
    }
});

router.delete('/loyalty/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM loyalty_points_epoxy WHERE points_id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Greška' });
    }
});

module.exports = router;
