const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const qrisVerify = require('../middleware/qris-verify');

// ============================================================
//  ROUTES
// ============================================================

// Generate QRIS payment
router.post('/qris/generate', paymentController.generateQRIS);

// Verify payment
router.post('/verify', paymentController.verifyPayment);

// Get payment status by ID
router.get('/status/:id', paymentController.getPaymentStatus);

// Get all transactions (admin only)
router.get('/transactions', auth.verifyAdmin, paymentController.getAllTransactions);

// Get transaction by ID
router.get('/transaction/:id', paymentController.getTransactionById);

// Webhook for payment callback (from payment gateway)
router.post('/webhook', qrisVerify.verifyWebhook, paymentController.handleWebhook);

module.exports = router;
