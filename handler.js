/* * *
*  Music note symbols:
*   Flat - ♭ - &#9837
*   Natural - ♮ - &#9838
*   Sharp - # - %23
*  
*  Sample Request [GET]:
*   /generate/wav?bpm=130&beats=1.0&notes=A4&utterance=test
*  Result:
*   ./utterances/130_1.0_A4_test.xml
*  Params:
*   (wav) | xml
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
const wordpos = require('wordpos');

module.exports = async (config) => {
  const routing = new Routing(config.app);
  routing.configure();
  routing.bind(routing.handler);
}

function generateXML(params) {
  const bpm = params.bpm ? params.bpm : "130";
  const beats = params.beats ? params.beats : "1.0";
  const notes = params.notes ? params.notes : "A4";
  const utterance = params.utterance ? params.utterance : "None";

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

  writeFile(dir, filename, template);

  return(path.resolve(output));
}

/* expects path to xml template file */
function generateWAV(template) {
  const dir = './synthesized/';

  let file = path.basename(template);

  if(file) {
    // We want the output file to have the same name but new extension
    let output = path.resolve(path.join(dir, path.parse(file).name + '.wav'));
    let command = 'text2wave -mode singing ' + template + ' -o ' + output;

    console.log(command);

    try {
      let result = cp.execSync(command).toString();
    } catch (e) {
      // 127 => command not found; text2wave not installed.
    }
  } else {
    res.sendStatus(400);
  }
}

function writeFile(directory, filename, content) {
  if(!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  } 

  try {
    fs.writeFileSync(filename, content, { encoding:'utf8', flag:'w' });
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
}

class Routing {
  constructor(app) {
    this.app = app;
  } 

  configure() {
    const bodyParser = require('body-parser');
    this.app.use(cors());
    this.app.use(bodyParser.text({
      type: "*/*"
    }));
    this.app.disable('x-powered-by');
  }

  bind(handler) {
    //this.app.post('/*', handle);
    this.app.get('/generate/*', handler);
    this.app.get('/lookup/*', handler);
  }

  async handler(req, res) {
    console.log(req.route.path);
    console.log(req.params);
    const querying = Object.keys(req.query).length !== 0;

    if (req.method === 'GET') {
      if(req.route.path == "/generate/*" && querying) {

        let template = generateXML(req.query);

        if(template.length > 0 && req.params[0] != 'xml'){
          let wav = generateWAV(template);
        }

        res.sendFile(template);
      } else if (req.route.path == "/lookup/*" && querying) {
        const wordnet = new wordpos();
        
        if(req.params[0] == 'word') {
          wordnet.lookup(req.query.terms, (result) => {
            res.json(result);
          });  
        }
       
      } else {
        res.sendStatus(400);
      }
    } else if (req.method === 'POST' && req.body && typeof req.body === 'string') {
      res.sendStatus(400);
    } else {
      res.sendStatus(400);
    }
  }
}
