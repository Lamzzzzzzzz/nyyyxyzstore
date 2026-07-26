/* ============================================================
   BACKEND / ROUTES / PRODUCTS.JS
   NyyyxyzModzOfc - Product Routes
   ============================================================ */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

// ============================================================
//  ROUTES
// ============================================================

// GET semua produk
router.get('/', productController.getAllProducts);

// GET produk by ID
router.get('/:id', productController.getProductById);

// GET produk by kategori (game)
router.get('/category/:game', productController.getProductsByCategory);

// POST tambah produk (admin only)
router.post('/', auth.verifyAdmin, productController.createProduct);

// PUT update produk (admin only)
router.put('/:id', auth.verifyAdmin, productController.updateProduct);

// DELETE hapus produk (admin only)
router.delete('/:id', auth.verifyAdmin, productController.deleteProduct);

// PATCH update stok / sold count
router.patch('/:id/sold', productController.updateSoldCount);

// ============================================================
//  EXPORT
// ============================================================
module.exports = router;
