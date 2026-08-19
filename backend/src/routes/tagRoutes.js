const express = require('express');
const searchController = require('../controllers/searchController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/suggest', searchController.suggestTags);

module.exports = router;
