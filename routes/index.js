const express = require('express');
const router = express.Router();

const base = '/';

router.use('/generate', require('./generate.js'));
router.use('/lookup', require('./lookup.js'));

router.get('/test', (req, res) => {
    res.send('Test route');
});

module.exports = router;