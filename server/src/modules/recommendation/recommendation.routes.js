const express = require('express');
const router = express.Router();
const { getRecommendations } = require('./recommendation.controller');

// When the frontend makes a GET request to this route, trigger the controller
router.get('/', getRecommendations);

module.exports = router;