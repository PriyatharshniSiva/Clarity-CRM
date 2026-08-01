const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  uploadDocument,
  deleteDocument
} = require('../controllers/projectController');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', getProjects);
router.post('/', requireRole(['ADMIN']), createProject);
router.get('/:id', getProjectById);
router.put('/:id', requireRole(['ADMIN', 'TEAM_LEADER']), updateProject);
router.delete('/:id', requireRole(['ADMIN']), deleteProject);

// Project Documents
router.post('/:id/documents', upload.single('file'), uploadDocument);
router.delete('/:id/documents/:docId', deleteDocument);

module.exports = router;
