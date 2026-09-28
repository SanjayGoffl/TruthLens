const router = require('express').Router();
const sourceController = require('../controllers/sourceController');
const asyncHandler = require('../utils/asyncHandler');
router.get('/', asyncHandler(sourceController.listSources));
router.get('/:id/trend', asyncHandler(sourceController.getTrend));
router.get('/:id', asyncHandler(sourceController.getSource));
module.exports = router;
