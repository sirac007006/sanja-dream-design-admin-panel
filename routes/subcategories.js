const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT s.*, c.name as category_name FROM subcategories_epoxy s LEFT JOIN categories_epoxy c ON s.category_id = c.category_id ORDER BY s.name');
        const categories = await pool.query('SELECT * FROM categories_epoxy ORDER BY name');
        res.render('subcategories/index', { subcategories: result.rows, categories: categories.rows });
    } catch (err) {
        console.error(err);
        res.render('error', { message: 'Greška' });
    }
});

module.exports = router;
