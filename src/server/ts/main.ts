import http, { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs/promises';
import { getAuthHash, getCookieByName, getRequestHeader, isHashValid, isIpWhitelisted } from './functions';
import config from './config';

const requestHandler = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {

	const headers = request.headers;

	const remoteAddress = getRequestHeader('x-forwarded-for', request) || request.socket.remoteAddress || '';
	const host = getRequestHeader('x-forwarded-host', request) || headers.host || '';

	console.log((new Date()).toUTCString(), remoteAddress, '=>', host, request.url);

	// read secure file
	try {
		const authData = await fs.readFile(config.authFile, 'utf-8');
		var secureData: SecureData = JSON.parse(authData);
	} catch (error) {
		response.writeHead(500, {
			'Content-Type': 'text/plain'
		}).end('Unable to load auth data');
		return;
	}

	// ip whitelist
	if (isIpWhitelisted(remoteAddress, host, secureData)) {
		response.writeHead(204).end();
		return;
	}

	// check auth cookie
	if (headers['cookie']) {

		const token = getCookieByName(config.cookieName, headers['cookie']);

		if (token) {

			const decoded = Buffer.from(token, 'base64url').toString().split(':');
			const username = decoded[0];
			const hash = decoded[1];

			if (isHashValid(username, hash, host, secureData)) {
				response.writeHead(204).end();
				return;
			}
		}
	}

	// user auth
	const authUser = getRequestHeader('x-auth-user', request);
	const authPassword = getRequestHeader('x-auth-password', request);

	if (authUser && authPassword) {

		const authHash = getAuthHash(host, authUser, authPassword);

		if (isHashValid(authUser, authHash, host, secureData)) {

			const cookieValue = Buffer.from(`${authUser}:${authHash}`).toString('base64url');

			const cookieData = [
				config.cookieName + '=' + cookieValue,
				'Path=/',
				'HttpOnly',
				'SameSite=Strict'
			];

			if (config.cookieSecure) {
				cookieData.push('Secure');
			}

			// need to use non 2xx status here, so that traefik returns cookie header
			response.writeHead(304, {
				'Set-Cookie': cookieData.join(';')
			}).end();
			return;
		}
	}

	// show login
	try {
		const loginPage = await fs.readFile(config.sendFile);

		response.writeHead(403, {
			'Content-Type': 'text/html'
		}).end(loginPage);
	}
	catch (error) {
		response.writeHead(500, {
			'Content-Type': 'text/plain'
		}).end('Unable to load login file');
	}

};

const server = http.createServer(requestHandler)
	.listen(config.serverPort, '0.0.0.0', () => {
		console.log('Auth server running on port ' + config.serverPort);
	});
