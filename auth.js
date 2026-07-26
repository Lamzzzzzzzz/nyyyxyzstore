/* ============================================================
   BACKEND / AUTH.JS
   NyyyxyzModzOfc - Authentication (Routes + Controller + Middleware)
   ============================================================ */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ============================================================
//  KONFIGURASI
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET || 'nyyyxyzmodzofc_secret_key_2026';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const USERS_PATH = path.join(__dirname, '../database/users.json');

// ============================================================
//  HELPER: Baca users
// ============================================================
function readUsers() {
    try {
        const data = fs.readFileSync(USERS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        const defaultUsers = [
            {
                id: 'admin-1',
                username: 'admin',
                password: bcrypt.hashSync('nyyyxyz123', 10),
                role: 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        writeUsers(defaultUsers);
        return defaultUsers;
    }
}

function writeUsers(data) {
    try {
        fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        return false;
    }
}

// ============================================================
//  MIDDLEWARE: Verify Token
// ============================================================
function verifyToken(req, res, next) {
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
        const users = readUsers();
        const user = users.find(u => u.id === decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User tidak ditemukan.'
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
}

// ============================================================
//  MIDDLEWARE: Verify Admin
// ============================================================
function verifyAdmin(req, res, next) {
    verifyToken(req, res, (err) => {
        if (err) return;
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak. Hanya admin.'
            });
        }
        next();
    });
}

// ============================================================
//  HELPER: Generate Token
// ============================================================
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
    );
}

// ============================================================
//  CONTROLLER: Login
// ============================================================
function login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username dan password wajib diisi'
        });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({
            success: false,
            message: 'Username atau password salah'
        });
    }

    const token = generateToken(user);
    res.status(200).json({
        success: true,
        message: 'Login berhasil',
        data: {
            token,
            user: { id: user.id, username: user.username, role: user.role },
            expiresIn: JWT_EXPIRE
        }
    });
}

// ============================================================
//  CONTROLLER: Verify
// ============================================================
function verify(req, res) {
    res.status(200).json({
        success: true,
        message: 'Token valid',
        data: { user: req.user }
    });
}

// ============================================================
//  CONTROLLER: Logout
// ============================================================
function logout(req, res) {
    res.status(200).json({
        success: true,
        message: 'Logout berhasil'
    });
}

// ============================================================
//  CONTROLLER: Change Password
// ============================================================
function changePassword(req, res) {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Password lama dan baru wajib diisi'
        });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password baru minimal 6 karakter'
        });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'User tidak ditemukan'
        });
    }

    const user = users[userIndex];
    if (!bcrypt.compareSync(oldPassword, user.password)) {
        return res.status(401).json({
            success: false,
            message: 'Password lama salah'
        });
    }

    users[userIndex].password = bcrypt.hashSync(newPassword, 10);
    users[userIndex].updatedAt = new Date().toISOString();
    writeUsers(users);

    res.status(200).json({
        success: true,
        message: 'Password berhasil diubah'
    });
}

// ============================================================
//  CONTROLLER: Get Profile
// ============================================================
function getProfile(req, res) {
    res.status(200).json({
        success: true,
        data: req.user
    });
}

// ============================================================
//  ROUTES
// ============================================================
router.post('/login', login);
router.get('/verify', verifyToken, verify);
router.post('/logout', verifyToken, logout);
router.put('/change-password', verifyToken, changePassword);
router.get('/profile', verifyToken, getProfile);

// ============================================================
//  EXPORT
// ============================================================
module.exports = {
    router,
    verifyToken,
    verifyAdmin,
    generateToken
};
