const express = require('express');
const dependencyController = require('../controllers/dependencyController');
const { protect } = require('../middlewares/authMiddleware');
const { requireTaskPermission } = require('../middlewares/roleMiddleware');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/', dependencyController.getDependencies);
router.post('/', requireTaskPermission('edit'), dependencyController.addDependency);
router.delete('/:depId', requireTaskPermission('edit'), dependencyController.removeDependency);

module.exports = router;
