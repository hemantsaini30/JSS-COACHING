const express = require('express');
const router = express.Router();
const { submitInquiry } = require('../controllers/publicController');

router.post('/inquiry', submitInquiry);

module.exports = router;