"use strict"

const express = require('express');
const router = express.Router();
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const wordpos = require('wordpos');
const Filter = require('bad-words'),
      filter = new Filter();

const dictionary_en_us = path.parse(require.resolve('dictionary-en-us'));
console.log(dictionary_en_us);

const Nodehun = require('nodehun');

router.get('/*', (req, res) => {
    const querying = Object.keys(req.query).length !== 0;

    const dictionary = fs.readFileSync(path.join(dictionary_en_us, 'index.dic'));
    const affix = fs.readFileSync(path.join(dictionary_en_us, 'index.aff'));
    const nodehun = new Nodehun(affix, dictionary);
    // const wordnet = new wordpos();

    if (querying) {

        if (req.params[0] == 'word') {
            const terms = req.query.terms.split('-');
            const results = terms.map(term => {
                //return wordnet.lookup(term);
                return nodehun.spell(term);
            });

            Promise.all(results).then(results => {
                results.map(result => {
                    console.log(result);

                })
                res.json(results);
            });
        }
    } else {
        res.sendStatus(400);
    }
});

module.exports = router;