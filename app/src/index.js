import fs from 'fs';
import utils from './utils.js';
import config from './config.js';

// read secure file
const secureData = utils.readJsonFile('/app/secure.json');

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

// check user and password against secure data
const isLoginValid = (username, password, host) => {

	// global users
	if (secureData.users) {

		if (secureData.users[username] && secureData.users[username] === password) {
			return true;
		}
	}

	// host users
	if (secureData.hosts && secureData.hosts[host]) {

		if (secureData.hosts[host].users) {

			const hostUsers = secureData.hosts[host].users;

			if (hostUsers[username] && hostUsers[username] === password) {
				return true;
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
			const password = decoded[1];

			if (isLoginValid(username, password, host)) {
				return request.return(204);
			}
		}
	}

	// user auth
	const authUser = headers['X-Auth-User'] || null;
	const authPassword = headers['X-Auth-Password'] || null;

	if (isLoginValid(authUser, authPassword, host)) {

		const value = `${authUser}:${authPassword}`.toString('base64url');
		const cookie = `${config.cookieName}=${value}; Path=/; Secure; HttpOnly`;

		request.headersOut['Set-Cookie'] = cookie;
		return request.return(304); // need to use non 2xx status here, so that traefik returns cookie header
	}

	// show login
	fs.promises.readFile('/app/login.html').then((data) => {
		request.headersOut['Content-Type'] = 'text/html';
		request.return(403, data);
	});
};

export default { handle };