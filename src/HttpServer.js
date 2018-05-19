import express from 'express';
import bodyParser from 'body-parser';

const DEFAULT_PORT = 9836;

const encodingFunctions = {
  json: JSON.parse,
};

function getPlainError(err) {
  if (!err) return err;
  let result = {};
  const keys = Object.getOwnPropertyNames(err);
  for (let keydex = 0; keydex < keys.length; keydex += 1) {
    const key = keys[keydex];
    result[key] = err[key];
  }
  return result;
}

export default class HttpHook {
  constructor() {
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.setProperties = this.setProperties.bind(this);
    this.receivedHttp = this.receivedHttp.bind(this);
    this.rawParser = this.rawParser.bind(this);
  }

  setProperties({ port, encoding }, callback) {
    this.port = port;
    this.callback = callback;
    this.encoding = encoding;
  }

  rawParser(encoding) {
    const encodingFunction = encodingFunctions[encoding];
    // console.log('creating raw parser', encoding, !!encodingFunction)

    return (req, res, next) => {
      var chunks = [];
      req.on('data', function(chunk) {
        chunks.push(chunk);
      });
      req.on('end', function() {
        const rawbody = Buffer.concat(chunks).toString();
        try {
          req.body = encodingFunction ? encodingFunction(rawbody) : rawbody;
        } catch (err) {
          req.error = getPlainError(err);
          req.body = rawbody;
        }
        next();
      });
    }
  }

  start() {
   if (this.serverStarted) return false;
    this.server = express();
    this.server.use(this.rawParser(this.encoding));
    // this.server.use(bodyParser.text({type: '*/*'}));
    // this.server.use(bodyParser.json());
    // this.server.use(bodyParser.urlencoded({ extended: true }));
    // this.server.use((error, req, res, next) => {
    //   if (error instanceof SyntaxError) {
    //     console.log('Got an error in the http hook', error, JSON.stringify(error.body));
    //   } else {
    //     next();
    //   }
    // });
    this.server.options("*", function(req, res, next){
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
      res.send(200);
    });
    this.server.all('*', this.receivedHttp);
    this.listener = this.server.listen(this.port || DEFAULT_PORT);
    console.log('attempted to start server with', this.port);
    console.log('local express server started on port', this.listener.address().port);
    this.serverStarted = true;
    return true;
  }

  receivedHttp(request, response) {
    console.log('got http', request.body);
    this.callback({
      path: request.path,
      ip: request.ip,
      method: request.method,
      params: request.params,
      body: request.body,
      headers: request.headers,
      query: request.query,
      error: request.error,
    });

    response.status(200).json({
      message: 'received',
    });
  }

  stop() {
   if (this.serverStarted) {
      this.listener.close();
      this.serverStarted = false;
      return true;
    }
    return false;
  }
}
