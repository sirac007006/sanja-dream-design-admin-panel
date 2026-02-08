const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT p.*, s.name as subcategory_name FROM products_epoxy p LEFT JOIN subcategories_epoxy s ON p.subcategory_id = s.subcategory_id ORDER BY p.created_at DESC');
        const subcategories = await pool.query('SELECT * FROM subcategories_epoxy ORDER BY name');
        res.render('products/index', { products: result.rows, subcategories: subcategories.rows });
    } catch (err) {
        console.error(err);
        res.render('error', { message: 'Greška' });
    }
});

module.exports = router;
