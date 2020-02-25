"use strict"

const express = require('express');
const router = express.Router();
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const dictionary_en_us = path.dirname(require.resolve('dictionary-en-us'));
const dictionary = fs.readFileSync(path.join(dictionary_en_us, 'index.dic'));
const affix = fs.readFileSync(path.join(dictionary_en_us, 'index.aff'));

const Nodehun = require('nodehun'),
      nodehun = new Nodehun(affix, dictionary);

const Filter = require('bad-words'),
      filter = new Filter();

const syllable = require('syllable');

/***
  * Extra
  * Check pronunciations:
    const CMUDict = require('cmudict').CMUDict,
    cmudict = new CMUDict();
    pronunciation = cmudict.get('example');
    @return {string} 'IH0 G Z AE1 M P AH0 L'
*/

router.get('/*', (req, res) => {
  const querying = Object.keys(req.query).length !== 0;

  if (querying) {
    if (req.params[0] == 'word') {
      const terms = req.query.terms.split('-');

      let obj = {};

      const results = terms.map(term => {
        let spelling = nodehun.spell(term),
            profane = filter.isProfane(term),
            syllables = syllable(term);

        return Promise.all([spelling, profane, syllables]);
      });

      Promise.all(results).then(results => {
        for (const key in results) {
          let word = results[key],
              wordid = results[key][0],
              foul = results[key][1],
              syllables = results[key][2];

          if (word) {
            if(!wordid) {
              const CMUDict = require('cmudict').CMUDict,
                    cmudict = new CMUDict();
                    pronunciation = cmudict.get(word);
              wordid = pronunciation.length > 0;
            }
            obj[terms[key]] = {
              'wordid': wordid,
              'foul': foul,
              'syllables': syllables 
            }
          } else {
            obj[terms[key]] = false;
          }
        }
        res.json(obj);
      });
    }
  } else {
    res.sendStatus(400);
  }
});

module.exports = router;