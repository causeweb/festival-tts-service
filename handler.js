/* * *
*  Music note symbols:
*   Flat - ♭ - &#9837
*   Natural - ♮ - &#9838
*   Sharp - # - %23
*  
*  Sample Request [GET]:
*   ?bpm=130&beats=1.0&notes=A4&utterance=test
*  Result:
*   ./utterances/130_1.0_A4_test.xml
*
*  Sample Request [POST]:
*   curl -X POST --data-binary @130_1.0_A4_test.xml http://localhost:3000/
*  Result:
*   ./synthesized/130_1.0_A4_test.wav
*/

"use strict"

const cors = require('cors');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = async (config) => {
  const routing = new Routing(config.app);
  routing.configure();
  routing.bind(routing.handle);
}

class Routing {
  constructor(app) {
    this.app = app;
  }

  configure() {
    const bodyParser = require('body-parser')
    this.app.use(cors())
    this.app.use(bodyParser.text({
      type: "*/*"
    }));
    this.app.disable('x-powered-by');
  }

  bind(route) {
    this.app.post('/*', route);
    this.app.get('/*', route);
    this.app.patch('/*', route);
    this.app.put('/*', route);
    this.app.delete('/*', route);
  }

  async handle(req, res) {
    if (req.method === 'GET' && Object.keys(req.query).length !== 0) {
      console.log(req.query);

      const bpm = req.query.bpm ? req.query.bpm : "130";
      const beats = req.query.beats ? req.query.beats : "1.0";
      const notes = req.query.notes ? req.query.notes : "A4";
      const utterance = req.query.utterance ? req.query.utterance : "None";

      const dir = './utterances/';

      const filename = [bpm, beats, notes, utterance].join("_") + '.xml';
      const output = path.join(dir, filename);

      let template = 
`<?xml version="1.0"?>
<!DOCTYPE SINGING PUBLIC "-//SINGING//DTD SINGING mark up//EN" "Singing.v0_1.dtd"[]>
<SINGING BPM="${ bpm }">
  <DURATION BEATS="${ beats }">
    <PITCH NOTE="${ notes }">${ utterance }</PITCH>
  </DURATION>
</SINGING>`;

      if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      } 

      try {
        fs.writeFileSync(output, template, { encoding:'utf8', flag:'w' });
      } catch (e) {
        console.error(e);
        res.sendStatus(500);
      }

      res.sendFile(path.resolve(output));
    } else if (req.method === 'POST' && req.body && typeof req.body === 'string') {
      const request = req.body;
      const dir = './synthesized/';

      fs.writeFileSync('./utterances/tmp.xml', request, { encoding:'utf8', flag:'w' });

      let result = cp.execSync('text2wave -mode singing ./utterances/tmp.xml -o ./synthesized/tmp.wav').toString();

      result = result.replace(/^,/g, '')
      result = result.replace(/\n,$/g, '')
      result = result.trim()

      res.send(result);
    } else {
      res.sendStatus(400)
    }
  }
}
