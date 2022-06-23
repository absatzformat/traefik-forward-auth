import fs from 'fs';
import crypto from 'crypto';
import utils from './utils.js';
import config from './config.js';

// read secure file
const secureData = utils.readJsonFile(config.authFile);

// check if an ip is whitelisted
const isIpWhitelisted = (address, host) => {

	// TODO: ip range validation

	if (
		utils.isPrivateIp(address) ||
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

const getAuthHash = (host, user, password) => {

	const sha1 = crypto.createHmac('sha1', password);
	const hash = sha1.update(user + '@' + host).digest('hex');

	return hash;
};

// check auth hash against secure data
const isHashValid = (username, hash, host) => {

	// global users
	if (secureData.users) {

		if (secureData.users[username]) {

			const authHash = getAuthHash(host, username, secureData.users[username]);

			if (authHash === hash) {
				return true;
			}
		}
	}

	// host users
	if (secureData.hosts && secureData.hosts[host]) {

		if (secureData.hosts[host].users) {

			const hostUsers = secureData.hosts[host].users;

			if (hostUsers[username]) {

				const authHash = getAuthHash(host, username, hostUsers[username]);

				if (authHash === hash) {
					return true;
				}
			}
		}
	}

	return false;
};

/**
 * @param {NginxHTTPRequest} request 
 */
const handle = (request) => {

	const headers = request.headersIn;

	const remoteAddress = headers['X-Forwarded-For'] || request.remoteAddress;
	const host = headers['X-Forwarded-Host'] || headers['Host'] || null;

	// ip whitelist
	if (isIpWhitelisted(remoteAddress, host)) {
		return request.return(204);
	}

	// check auth cookie
	if (headers['Cookie']) {

		const token = utils.getCookieByName(config.cookieName, headers['Cookie']);

		if (token) {

			const decoded = Buffer.from(token, 'base64url').toString().split(':');
			const username = decoded[0];
			const hash = decoded[1];

			if (isHashValid(username, hash, host)) {
				return request.return(204);
			}
		}
	}

	// user auth
	const authUser = headers['X-Auth-User'] || null;
	const authPassword = headers['X-Auth-Password'] || null;

	if (authUser && authPassword) {

		const authHash = getAuthHash(host, authUser, authPassword);

		if (isHashValid(authUser, authHash, host)) {

			const cookieValue = `${authUser}:${authHash}`.toString('base64url');

			const cookieData = [
				config.cookieName + '=' + cookieValue,
				'Path=/',
				'HttpOnly',
				'SameSite=Strict'
			];

			if (config.cookieSecure) {
				cookieData.push('Secure');
			}

			request.headersOut['Set-Cookie'] = cookieData.join(';');
			return request.return(304); // need to use non 2xx status here, so that traefik returns cookie header
		}
	}

	// show login
	fs.promises.readFile('/app/login.html').then((data) => {
		request.headersOut['Content-Type'] = 'text/html';
		request.return(403, data);
	});
};

export default { handle };