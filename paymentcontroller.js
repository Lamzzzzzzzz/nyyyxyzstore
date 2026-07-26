const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const qrisConfig = require('../../config/qris.config');

const DB_PATH = path.join(__dirname, '../../database/data.json');
const LOG_PATH = path.join(__dirname, '../../logs/transactions.log');

// ============================================================
//  HELPERS
// ============================================================
function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { products: [], buyers: [], transactions: [] };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        return false;
    }
}

function logTransaction(entry) {
    try {
        const log = `[${new Date().toISOString()}] ${JSON.stringify(entry)}\n`;
        fs.appendFileSync(LOG_PATH, log, 'utf8');
    } catch (err) {}
}

// ============================================================
//  CONTROLLERS
// ============================================================

// Generate QRIS payment
exports.generateQRIS = (req, res) => {
    const {
        productId,
        productName,
        amount,
        buyerName,
        buyerEmail = null
    } = req.body;

    if (!productId || !productName || !amount || !buyerName) {
        return res.status(400).json({
            success: false,
            message: 'Field wajib: productId, productName, amount, buyerName'
        });
    }

    const db = readDB();
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const transaction = {
        id: transactionId,
        productId,
        productName,
        amount: parseInt(amount),
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail || `${buyerName.toLowerCase().replace(/\s/g, '')}@gmail.com`,
        status: 'pending',
        qrisData: {
            nmd: qrisConfig.nmd,
            qrisId: qrisConfig.qrisId,
            merchant: qrisConfig.merchant,
            version: qrisConfig.version,
            provider: qrisConfig.provider
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paidAt: null,
        paymentMethod: 'QRIS'
    };

    db.transactions = db.transactions || [];
    db.transactions.push(transaction);
    writeDB(db);

    // Log transaksi
    logTransaction({
        type: 'QRIS_GENERATED',
        transactionId,
        productName,
        amount,
        buyerName,
        status: 'pending'
    });

    res.status(201).json({
        success: true,
        message: 'QRIS payment generated',
        data: {
            transactionId,
            qrisData: {
                image: qrisConfig.imagePath,
                nmd: qrisConfig.nmd,
                merchant: qrisConfig.merchant,
                provider: qrisConfig.provider,
                providerUrl: qrisConfig.providerUrl
            },
            amount: transaction.amount,
            productName,
            buyerName,
            status: 'pending',
            waSupport: qrisConfig.waSupport
        }
    });
};

// Verify payment
exports.verifyPayment = (req, res) => {
    const { transactionId, buyerName } = req.body;

    if (!transactionId) {
        return res.status(400).json({
            success: false,
            message: 'Transaction ID required'
        });
    }

    const db = readDB();
    const transaction = db.transactions.find(t => t.id === transactionId);

    if (!transaction) {
        return res.status(404).json({
            success: false,
            message: 'Transaction not found'
        });
    }

    // Cek apakah buyer name cocok (opsional)
    if (buyerName && transaction.buyerName.toLowerCase() !== buyerName.toLowerCase()) {
        return res.status(403).json({
            success: false,
            message: 'Buyer name does not match'
        });
    }

    // Simulasi verifikasi (di real world, ini akan cek ke payment gateway)
    // Untuk demo, kita langsung mark sebagai paid
    transaction.status = 'paid';
    transaction.paidAt = new Date().toISOString();
    transaction.updatedAt = new Date().toISOString();

    // Tambahkan ke buyer leaderboard
    let buyer = db.buyers.find(b => b.name.toLowerCase() === transaction.buyerName.toLowerCase());
    if (buyer) {
        buyer.total += transaction.amount;
        buyer.count += 1;
    } else {
        db.buyers.push({
            id: `B-${Date.now()}`,
            name: transaction.buyerName,
            email: transaction.buyerEmail,
            total: transaction.amount,
            count: 1
        });
    }

    // Update sold count produk
    const product = db.products.find(p => p.id === transaction.productId);
    if (product) {
        product.sold = (product.sold || 0) + 1;
    }

    writeDB(db);

    logTransaction({
        type: 'PAYMENT_VERIFIED',
        transactionId,
        buyerName: transaction.buyerName,
        amount: transaction.amount,
        status: 'paid'
    });

    res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
            transactionId: transaction.id,
            status: transaction.status,
            paidAt: transaction.paidAt,
            buyerName: transaction.buyerName,
            amount: transaction.amount,
            productName: transaction.productName
        }
    });
};

// Get payment status
exports.getPaymentStatus = (req, res) => {
    const { id } = req.params;

    const db = readDB();
    const transaction = db.transactions.find(t => t.id === id);

    if (!transaction) {
        return res.status(404).json({
            success: false,
            message: 'Transaction not found'
        });
    }

    res.status(200).json({
        success: true,
        data: {
            transactionId: transaction.id,
            status: transaction.status,
            amount: transaction.amount,
            productName: transaction.productName,
            buyerName: transaction.buyerName,
            createdAt: transaction.createdAt,
            paidAt: transaction.paidAt
        }
    });
};

// Get all transactions (admin only)
exports.getAllTransactions = (req, res) => {
    const db = readDB();
    const transactions = db.transactions || [];

    // Sort by newest first
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions
    });
};

// Get transaction by ID
exports.getTransactionById = (req, res) => {
    const { id } = req.params;

    const db = readDB();
    const transaction = db.transactions.find(t => t.id === id);

    if (!transaction) {
        return res.status(404).json({
            success: false,
            message: 'Transaction not found'
        });
    }

    res.status(200).json({
        success: true,
        data: transaction
    });
};

// Handle webhook from payment gateway
exports.handleWebhook = (req, res) => {
    const { transactionId, status, signature } = req.body;

    // Verify signature (dalam implementasi nyata)
    // Untuk demo, kita terima semua

    if (!transactionId || !status) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    const db = readDB();
    const transaction = db.transactions.find(t => t.id === transactionId);

    if (!transaction) {
        return res.status(404).json({
            success: false,
            message: 'Transaction not found'
        });
    }

    transaction.status = status;
    transaction.updatedAt = new Date().toISOString();
    if (status === 'paid') {
        transaction.paidAt = new Date().toISOString();
    }

    writeDB(db);

    logTransaction({
        type: 'WEBHOOK_RECEIVED',
        transactionId,
        status,
        timestamp: new Date().toISOString()
    });

    res.status(200).json({
        success: true,
        message: 'Webhook processed'
    });
};
