const express = require('express');
const router = express.Router();

const base = '/smiles';

router.use(base + '/api', require('./api'));

router.get(base + '/api', (req, res) => {
    res.send('Api route');
});

router.get('/test', (req, res) => {
    res.send('Test route');
});

module.exports = router;