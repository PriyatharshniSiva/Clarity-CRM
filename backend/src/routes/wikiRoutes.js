const express = require('express');
const router = express.Router();
const wikiController = require('../controllers/wikiController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', wikiController.createWikiPage);
router.get('/', wikiController.getWikiPages);
router.get('/:id', wikiController.getWikiPageById);
router.put('/:id', wikiController.updateWikiPage);
router.delete('/:id', wikiController.deleteWikiPage);

module.exports = router;
