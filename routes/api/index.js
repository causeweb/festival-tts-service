const express = require('express');
const router = express.Router();

router.use('/generate', require('./generate.js'));
router.use('/lookup', require('./lookup.js'));

module.exports = router;