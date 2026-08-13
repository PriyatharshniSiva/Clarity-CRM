const express = require('express');
const router = express.Router();
const { login, getProfile, updateProfile, changePassword, resetPasswordRequest, deleteProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/login', login);
router.post('/forgot-password', resetPasswordRequest);

const profileUpload = upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, profileUpload, updateProfile);
router.delete('/profile', authenticate, deleteProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
