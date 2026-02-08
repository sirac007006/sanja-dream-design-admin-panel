const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Auth middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        return next();
    }
    res.redirect('/login');
};

// Make session available to all views
app.use((req, res, next) => {
    res.locals.isLoggedIn = req.session.isLoggedIn || false;
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const subcategoriesRoutes = require('./routes/subcategories');
const ordersRoutes = require('./routes/orders');
const loyaltyRoutes = require('./routes/loyalty');
const apiRoutes = require('./routes/api');

app.use('/', authRoutes);
app.use('/dashboard', requireAuth, dashboardRoutes);
app.use('/users', requireAuth, usersRoutes);
app.use('/products', requireAuth, productsRoutes);
app.use('/categories', requireAuth, categoriesRoutes);
app.use('/subcategories', requireAuth, subcategoriesRoutes);
app.use('/orders', requireAuth, ordersRoutes);
app.use('/loyalty', requireAuth, loyaltyRoutes);
app.use('/api', requireAuth, apiRoutes);

// Redirect root to dashboard
app.get('/', (req, res) => {
    if (req.session.isLoggedIn) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { message: 'Došlo je do greške!' });
});

app.use((req, res) => {
    res.status(404).render('error', { message: 'Stranica nije pronađena!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Admin panel running on http://localhost:${PORT}`);
});
