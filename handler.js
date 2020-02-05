"use strict"
const cors = require('cors')
const cp = require('child_process')
const fs = require('fs')

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
    if (req.body && typeof req.body === 'string') {
      let request = req.body; // Ingnore for now.

      fs.writeFileSync('./utterances/tmp.xml', req.body, 'utf8');

      let result = cp.execSync('text2wave -mode singing ./utterances/tmp.xml -o ./synthesized/tmp.wav').toString();

      result = result.replace(/^,/g, '')
      result = result.replace(/\n,$/g, '')
      result = result.trim()

      res.send(result);
    } else {
      res.send(`No code found.`)
    }
  }
}
