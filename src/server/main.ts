import http from 'http';
import config from './config';
import { requestHandler } from './functions';

const server = http.createServer(requestHandler)
	.listen(config.serverPort, '0.0.0.0', () => {
		console.log('Auth server running on port ' + config.serverPort);
	});
