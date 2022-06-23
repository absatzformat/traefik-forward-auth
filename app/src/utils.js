import fs from 'fs';

/**
 * 
 * @param {string} cstring 
 * @return {Object}
 */
const getCookies = (cstring) => {

	const cookies = {};

	cstring.split(';').forEach((cookie) => {

		const parts = cookie.match(/(.*?)=(.*)$/);
		cookies[parts[1].trim()] = (parts[2] || '').trim();
	});

	return cookies;
};

/**
 * 
 * @param {string} name 
 * @param {string} cstring 
 * @return {string|null}
 */
const getCookieByName = (name, cstring) => {

	const match = `;${cstring}`.match(`;\\s*${name}=([^;]+)`);
	return match ? match[1] : null;
};

/**
 * 
 * @param {string} file 
 * @return {Object}
 */
const readJsonFile = (file) => {

	const json = fs.readFileSync(file, 'utf8');
	return JSON.parse(json);
};

/**
 * 
 * @param {string} ip 
 * @return {boolean}
 */
const isPrivateIp = (ip) => {
	const parts = ip.split('.');
	return parts[0] === '10' ||
		(parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) ||
		(parts[0] === '192' && parts[1] === '168');
}

export default { getCookies, getCookieByName, readJsonFile, isPrivateIp };