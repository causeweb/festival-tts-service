const express = require('express');
const router = express.Router();

router.use('/api', require('./api'));

router.get('/api', (req, res) => {
    res.send('Api route');
});

router.get('/test', (req, res) => {
    res.send('Test route');
});

module.exports = router;