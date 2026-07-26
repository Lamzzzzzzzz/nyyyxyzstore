const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const auth = require('../middleware/auth');

// ============================================================
//  ROUTES
// ============================================================

// GET all leaderboard
router.get('/', leaderboardController.getLeaderboard);

// GET top 10
router.get('/top', leaderboardController.getTopBuyers);

// GET buyer by name
router.get('/buyer/:name', leaderboardController.getBuyerByName);

// POST add buyer (auto from payment)
router.post('/add', leaderboardController.addBuyer);

// DELETE reset leaderboard (admin only)
router.delete('/reset', auth.verifyAdmin, leaderboardController.resetLeaderboard);

// DELETE remove buyer (admin only)
router.delete('/buyer/:id', auth.verifyAdmin, leaderboardController.removeBuyer);

module.exports = router;
