const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const USERS_PATH = path.join(__dirname, '../../database/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'nyyyxyzmodzofc_secret_key_2026';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// ============================================================
//  HELPERS
// ============================================================
function readUsers() {
    try {
        const data = fs.readFileSync(USERS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // Default admin jika file belum ada
        const defaultUsers = [
            {
                id: 'admin-1',
                username: 'admin',
                password: bcrypt.hashSync('nyyyxyz123', 10),
                role: 'admin',
                createdAt: new Date().toISOString()
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

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
    );
}

// ============================================================
//  CONTROLLERS
// ============================================================

// Login admin
exports.login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username dan password wajib diisi'
        });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Username atau password salah'
        });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
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
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            },
            expiresIn: JWT_EXPIRE
        }
    });
};

// Verify token
exports.verify = (req, res) => {
    const user = req.user;

    res.status(200).json({
        success: true,
        message: 'Token valid',
        data: {
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        }
    });
};

// Logout
exports.logout = (req, res) => {
    // JWT stateless, logout di client-side
    res.status(200).json({
        success: true,
        message: 'Logout berhasil'
    });
};

// Change password (admin only)
exports.changePassword = (req, res) => {
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
    const isMatch = bcrypt.compareSync(oldPassword, user.password);
    if (!isMatch) {
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
};

// Get admin profile
exports.getProfile = (req, res) => {
    const user = req.user;

    res.status(200).json({
        success: true,
        data: {
            id: user.id,
            username: user.username,
            role: user.role
        }
    });
};
