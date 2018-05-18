import express from 'express';
import bodyParser from 'body-parser';

const DEFAULT_PORT = 9836;

export default class HttpHook {
  constructor() {
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.setProperties = this.setProperties.bind(this);
    this.receivedHttp = this.receivedHttp.bind(this);
  }

  setProperties({ port }, callback) {
    this.port = port;
    this.callback = callback;
  }

  start() {
   if (this.serverStarted) return false;
    this.server = express();
    this.server.use(bodyParser.json());
    this.server.use(bodyParser.urlencoded({ extended: true }));
    this.server.use((error, req, res, next) => {
      if (error instanceof SyntaxError) {
        console.log('Got an error in the http hook', error, JSON.stringify(error.body));
      } else {
        next();
      }
    });
    this.server.all('*', this.receivedHttp);
    this.listener = this.server.listen(this.port || DEFAULT_PORT);
    console.log('attempted to start server with', this.port);
    console.log('local express server started on port', this.listener.address().port);
    this.serverStarted = true;
    return true;
  }

  receivedHttp(request, response) {
    this.callback({
      path: request.path,
      ip: request.ip,
      method: request.method,
      params: request.params,
      body: request.body,
      headers: request.headers,
      query: request.query,
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
