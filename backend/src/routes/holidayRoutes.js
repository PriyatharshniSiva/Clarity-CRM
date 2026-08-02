const express = require('express');
const router = express.Router();
const { getHolidays, addHoliday, deleteHoliday } = require('../controllers/holidayController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getHolidays);
router.post('/', authenticate, addHoliday);
router.delete('/:id', authenticate, deleteHoliday);

module.exports = router;
