const express = require('express');
const router = express.Router();
const {
  getSalaryStructure,
  getAllSalaryStructures,
  saveSalaryStructure,
  getSalaryRevisions,
  bulkAssignSalaryStructures
} = require('../controllers/salaryStructureController');
const { authenticate } = require('../middleware/auth');

router.get('/all', authenticate, getAllSalaryStructures);
router.get('/user/:userId', authenticate, getSalaryStructure);
router.get('/my', authenticate, (req, res, next) => {
  req.params.userId = req.user.id;
  return getSalaryStructure(req, res, next);
});
router.get('/revisions/:userId', authenticate, getSalaryRevisions);
router.post('/save', authenticate, saveSalaryStructure);
router.post('/bulk-save', authenticate, bulkAssignSalaryStructures);

module.exports = router;
