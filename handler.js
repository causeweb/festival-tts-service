"use strict"

const cors = require('cors');

module.exports = async (config) => {
  const routing = new Routing(config.app);
  routing.configure();
  routing.bind(routing.handler);
}

class Routing {
  constructor(app) {
    this.app = app;
  }

  configure() {
    const bodyParser = require('body-parser');

    this.app.use(
      cors(),
      bodyParser.text({
        type: "*/*"
      })
    );

    this.app.disable('x-powered-by');
  }

  bind(handler) {
    //this.app.post('/*', handle);
    //this.app.get('/generate/*', handler);
    //this.app.get('/lookup/*', handler);
    this.app.use(require('./routes'));
  }

  async handler(req, res) {
    /*console.log(req.route.path);
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
    }*/
  }
}
