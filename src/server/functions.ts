import crypto from 'crypto';
import fs from 'fs/promises';
import config from './config';
import { IncomingMessage, ServerResponse } from 'http';

type HostData = {
	ipwhitelist?: string[];
	users?: Record<string, string>;
};

type SecureData = HostData & {
	hosts?: Record<string, HostData>;
};

const getCookies = (cstring: string): Record<string, string> => {

	const cookies: Record<string, string> = {};

	cstring.split(';').forEach((cookie) => {

		const match = cookie.match(/(.*?)=(.*)$/);

		if (match) {

			const name = match[1].trim();
			const value = (match[2] || '').trim();
			cookies[name] = value;
		}
	});

	return cookies;
};

const getCookieByName = (name: string, cstring: string): string | null => {

	const match = `;${cstring}`.match(`;\\s*${name}=([^;]+)`);
	return match ? match[1] : null;
};

const isPrivateIp = (ip: string): boolean => {

	const parts = ip.split('.');

	return parts[0] === '10' ||
		(parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) ||
		(parts[0] === '192' && parts[1] === '168');
};

const isIpWhitelisted = (address: string, host: string, secureData: SecureData): boolean => {

	if (
		isPrivateIp(address) ||
		(secureData.ipwhitelist && secureData.ipwhitelist.indexOf(address) >= 0)
	) {
		return true
	}

	// host ip whitelist
	if (secureData.hosts && secureData.hosts[host]) {

		const hostData = secureData.hosts[host];

		if (hostData.ipwhitelist && hostData.ipwhitelist.indexOf(address) >= 0) {
			return true;
		}
	}

	return false;
};

const getAuthHash = (host: string, user: string, password: string): string => {

	const hmac = crypto.createHmac('sha256', password);
	const hash = hmac.update(user + '@' + host).digest('hex');

	return hash;
};

const isHashValid = (username: string, hash: string, host: string, secureData: SecureData): boolean => {

	// host users
	if (secureData.hosts && secureData.hosts[host]) {

		if (secureData.hosts[host].users) {

			const hostUsers = secureData.hosts[host].users;

			if (hostUsers && hostUsers[username]) {

				const hostUserHash = getAuthHash(host, username, hostUsers[username]);

				if (hostUserHash === hash) {
					return true;
				}
			}
		}
	}

	// global users
	if (secureData.users) {

		if (secureData.users[username]) {

			const globalUserHash = getAuthHash(host, username, secureData.users[username]);

			if (globalUserHash === hash) {
				return true;
			}
		}
	}

	return false;
};

const getRequestHeader = (headerName: string, request: IncomingMessage): string | null => {

	const header = request.headers[headerName];

	if (Array.isArray(header)) {
		return header[0] || null;
	}

	return header ?? null;
};

export const requestHandler = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {

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
