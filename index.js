/* * *
 *  Music note symbols:
 *   Flat - ♭ - &#9837
 *   Natural - ♮ - &#9838
 *   Sharp - # - %23
 *
 *  Sample Request [GET]:
 *   /smiles/api/generate/wav?bpm=130&beats=1.0&notes=A4&utterance=test
 *  Result:
 *   ./synthesized/130_1.0_A4_test.wav
 *  Params:
 *   (wav) | xml
 *
 *  Sample Request [GET]:
 *   /smiles/api/lookup/word?terms=test
 *  Result:
 *   {"test":{"wordid":true,"foul":false,"syllables":1}}
 *  Params:
 *   (word)
 */

"use strict"

const express = require('express');
const app = express();
const handler = require('./handler');

async function init() {
  await handler({
    "app": app
  });

  const port = process.env.http_port || 3000;
  app.disable('x-powered-by');

  app.listen(port, () => {
    console.log(`node10-express-service, listening on port: ${port}`);
  });
}

init();