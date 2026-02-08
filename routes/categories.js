const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories_epoxy ORDER BY display_order, name');
        res.render('categories/index', { categories: result.rows });
    } catch (err) {
        console.error(err);
        res.render('error', { message: 'Greška' });
    }
});

module.exports = router;
