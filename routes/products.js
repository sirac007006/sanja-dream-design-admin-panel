const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { cloudinary, upload } = require('../config/cloudinary');

// GET - Lista proizvoda
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, s.name as subcategory_name,
                   COUNT(DISTINCT pi.image_id) as image_count,
                   (SELECT image_url FROM product_images_epoxy WHERE product_id = p.product_id AND is_primary = true LIMIT 1) as primary_image
            FROM products_epoxy p 
            LEFT JOIN subcategories_epoxy s ON p.subcategory_id = s.subcategory_id
            LEFT JOIN product_images_epoxy pi ON p.product_id = pi.product_id
            GROUP BY p.product_id, s.name
            ORDER BY p.created_at DESC
        `);
        const subcategories = await pool.query('SELECT * FROM subcategories_epoxy ORDER BY name');
        res.render('products/index', { products: result.rows, subcategories: subcategories.rows });
    } catch (err) {
        console.error(err);
        res.render('error', { message: 'Greška' });
    }
});

// GET - Detalji proizvoda sa slikama
router.get('/:id', async (req, res) => {
    try {
        const product = await pool.query('SELECT * FROM products_epoxy WHERE product_id = $1', [req.params.id]);
        const images = await pool.query('SELECT * FROM product_images_epoxy WHERE product_id = $1 ORDER BY is_primary DESC, display_order ASC', [req.params.id]);
        
        res.json({
            product: product.rows[0],
            images: images.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška' });
    }
});

// POST - Upload slika za proizvod (može više odjednom)
router.post('/:id/images', upload.array('images', 10), async (req, res) => {
    const productId = req.params.id;
    
    try {
        // Proveri da li proizvod postoji
        const productCheck = await pool.query('SELECT product_id FROM products_epoxy WHERE product_id = $1', [productId]);
        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Proizvod ne postoji' });
        }

        // Proveri da li je ova prva slika (ako nema primary, postavi ovu kao primary)
        const existingImages = await pool.query('SELECT COUNT(*) as count FROM product_images_epoxy WHERE product_id = $1', [productId]);
        const isFirstImage = existingImages.rows[0].count == 0;

        // Sačuvaj sve uploadovane slike
        const uploadedImages = [];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const isPrimary = isFirstImage && i === 0; // Prva slika je primary ako nema drugih

            const result = await pool.query(
                `INSERT INTO product_images_epoxy (product_id, image_url, is_primary, display_order) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING *`,
                [productId, file.path, isPrimary, i]
            );
            uploadedImages.push(result.rows[0]);
        }

        res.json({ 
            success: true, 
            images: uploadedImages,
            message: `Uploadovano ${req.files.length} slika` 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška pri upload-u' });
    }
});

// PUT - Postavi primarnu sliku
router.put('/:productId/images/:imageId/primary', async (req, res) => {
    const { productId, imageId } = req.params;
    
    try {
        // Skini primary sa svih slika ovog proizvoda
        await pool.query('UPDATE product_images_epoxy SET is_primary = false WHERE product_id = $1', [productId]);
        
        // Postavi ovu sliku kao primary
        await pool.query('UPDATE product_images_epoxy SET is_primary = true WHERE image_id = $1 AND product_id = $2', [imageId, productId]);
        
        res.json({ success: true, message: 'Primarna slika postavljena' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška' });
    }
});

// DELETE - Obriši sliku
router.delete('/:productId/images/:imageId', async (req, res) => {
    const { productId, imageId } = req.params;
    
    try {
        // Uzmi URL slike iz baze
        const imageData = await pool.query('SELECT image_url, is_primary FROM product_images_epoxy WHERE image_id = $1', [imageId]);
        
        if (imageData.rows.length === 0) {
            return res.status(404).json({ error: 'Slika ne postoji' });
        }

        const imageUrl = imageData.rows[0].image_url;
        const wasPrimary = imageData.rows[0].is_primary;

        // Izvuci public_id iz Cloudinary URL-a
        // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567/folder/filename.jpg
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1].split('.')[0]; // filename bez ekstenzije
        const folder = urlParts.slice(7, -1).join('/'); // folder path
        const publicId = folder + '/' + fileName;

        // Obriši sa Cloudinary-a
        await cloudinary.uploader.destroy(publicId);

        // Obriši iz baze
        await pool.query('DELETE FROM product_images_epoxy WHERE image_id = $1', [imageId]);

        // Ako je ova bila primary, postavi prvu preostalu sliku kao primary
        if (wasPrimary) {
            await pool.query(
                `UPDATE product_images_epoxy 
                 SET is_primary = true 
                 WHERE product_id = $1 
                 AND image_id = (SELECT image_id FROM product_images_epoxy WHERE product_id = $1 ORDER BY display_order LIMIT 1)`,
                [productId]
            );
        }

        res.json({ success: true, message: 'Slika obrisana' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Greška pri brisanju' });
    }
});

module.exports = router;