/* ============================================================
   BACKEND / MIDDLEWARE / QRIS-VERIFY.JS
   NyyyxyzModzOfc - QRIS Verification Middleware
   ============================================================ */

const crypto = require('crypto');
const qrisConfig = require('../../config/qris.config');

// ============================================================
//  CONFIG
// ============================================================
const QRIS_SECRET = process.env.QRIS_SECRET || 'nyyyxyz_qris_secret_2026';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'nyyyxyz_webhook_secret_2026';

// ============================================================
//  MIDDLEWARE: Verify QRIS Payment
// ============================================================
const verifyPayment = (req, res, next) => {
    const { transactionId, signature, timestamp } = req.body;

    if (!transactionId || !signature) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: transactionId, signature'
        });
    }

    // Generate signature untuk verifikasi
    const data = `${transactionId}|${timestamp || Date.now()}|${QRIS_SECRET}`;
    const expectedSignature = crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(403).json({
            success: false,
            message: 'Invalid signature'
        });
    }

    // Cek timestamp (max 5 menit)
    if (timestamp) {
        const now = Date.now();
        const diff = Math.abs(now - parseInt(timestamp));
        if (diff > 300000) { // 5 menit
            return res.status(400).json({
                success: false,
                message: 'Request expired. Timestamp too old.'
            });
        }
    }

    next();
};

// ============================================================
//  MIDDLEWARE: Verify Webhook
// ============================================================
const verifyWebhook = (req, res, next) => {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    if (!signature) {
        return res.status(401).json({
            success: false,
            message: 'Missing webhook signature'
        });
    }

    // Generate expected signature
    const payload = JSON.stringify(req.body);
    const data = `${payload}|${timestamp || Date.now()}|${WEBHOOK_SECRET}`;
    const expectedSignature = crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(403).json({
            success: false,
            message: 'Invalid webhook signature'
        });
    }

    next();
};

// ============================================================
//  MIDDLEWARE: Validate QRIS Data
// ============================================================
const validateQRISData = (req, res, next) => {
    const { nmd, qrisId, amount } = req.body;

    if (!nmd || !qrisId || !amount) {
        return res.status(400).json({
            success: false,
            message: 'Missing QRIS data: nmd, qrisId, amount required'
        });
    }

    // Validasi format NMD
    if (!/^ID\d+$/.test(nmd)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid NMD format. Should be ID[number]'
        });
    }

    // Validasi amount
    if (parseInt(amount) <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Amount must be greater than 0'
        });
    }

    // Cek apakah QRIS ID terdaftar
    if (qrisId !== qrisConfig.qrisId) {
        return res.status(400).json({
            success: false,
            message: 'QRIS ID not recognized'
        });
    }

    next();
};

// ============================================================
//  HELPER: Generate QRIS Signature
// ============================================================
const generateQRISSignature = (transactionId, timestamp = Date.now()) => {
    const data = `${transactionId}|${timestamp}|${QRIS_SECRET}`;
    return crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
};

// ============================================================
//  HELPER: Generate Webhook Signature
// ============================================================
const generateWebhookSignature = (payload, timestamp = Date.now()) => {
    const data = `${JSON.stringify(payload)}|${timestamp}|${WEBHOOK_SECRET}`;
    return crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
};

// ============================================================
//  EXPORT
// ============================================================
module.exports = {
    verifyPayment,
    verifyWebhook,
    validateQRISData,
    generateQRISSignature,
    generateWebhookSignature
};
