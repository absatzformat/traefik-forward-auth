import crypto from 'crypto';
import { IncomingMessage } from 'http';

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
}

export { getCookieByName, getRequestHeader, isIpWhitelisted, isHashValid, getAuthHash };