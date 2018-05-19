import { wrapHook } from 'nexusdk';
import ngrok from 'ngrok';
import HttpServer from './HttpServer';
import path from 'path';

const server = new HttpServer();

export default wrapHook(async (properties, messages) => {
  const { trigger } = messages;
  const { local_server_port, subdomain, token, ngrok_path, encoding } = properties;

  console.log('starting new http server', local_server_port)
  server.setProperties({ port: local_server_port, encoding }, trigger);
  server.start();
  console.log('starting', local_server_port, subdomain, token, ngrok_path)
  const url = await ngrok.connect({ addr: local_server_port, subdomain, authtoken: token, binPath: () => ngrok_path });
  // console.log('url', url)
  messages.config({ url });
});

