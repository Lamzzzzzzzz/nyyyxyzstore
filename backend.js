/* ============================================================
   BACKEND / MIDDLEWARE / AUTH.JS
   NyyyxyzModzOfc - Authentication Middleware
   ============================================================ */

const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'nyyyxyzmodzofc_secret_key_2026';

// ============================================================
//  MIDDLEWARE: Verify Token
// ============================================================
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Token tidak ditemukan. Silakan login terlebih dahulu.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Cek apakah user masih ada di database
        const user = User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User tidak ditemukan atau telah dihapus.'
            });
        }

        req.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token telah kadaluarsa. Silakan login ulang.'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token tidak valid.'
        });
    }
};

// ============================================================
//  MIDDLEWARE: Verify Admin
// ============================================================
const verifyAdmin = (req, res, next) => {
    // Pertama, verifikasi token
    verifyToken(req, res, (err) => {
        if (err) return;

        // Cek role
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak. Hanya admin yang memiliki akses.'
            });
        }

        next();
    });
};

// ============================================================
//  MIDDLEWARE: Optional Auth (boleh login boleh tidak)
// ============================================================
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = User.findById(decoded.id);
            if (user) {
                req.user = {
                    id: user.id,
                    username: user.username,
                    role: user.role
                };
            }
        } catch (err) {
            // Token invalid, tapi kita lanjutkan tanpa user
        }
    }

    next();
};

// ============================================================
//  MIDDLEWARE: Generate Token (helper)
// ============================================================
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// ============================================================
//  EXPORT
// ============================================================
module.exports = {
    verifyToken,
    verifyAdmin,
    optionalAuth,
    generateToken
};
