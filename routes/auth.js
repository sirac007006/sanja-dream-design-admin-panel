const express = require('express');
const router = express.Router();
require('dotenv').config();

// Login page
router.get('/login', (req, res) => {
    if (req.session.isLoggedIn) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
});

// Login POST
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'perica021!!!';
    
    if (username === adminUser && password === adminPass) {
        req.session.isLoggedIn = true;
        req.session.username = username;
        res.redirect('/dashboard');
    } else {
        res.render('login', { error: 'Pogrešno korisničko ime ili lozinka!' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
