import fs from 'fs';

const getCookies = (cstring) => {

	const cookies = {};

	cstring.split(';').forEach((cookie) => {

		const parts = cookie.match(/(.*?)=(.*)$/);
		cookies[parts[1].trim()] = (parts[2] || '').trim();
	});

	return cookies;
};

const getCookieByName = (name, cstring) => {

	const match = `;${cstring}`.match(`;\\s*${name}=([^;]+)`);
	return match ? match[1] : null;
};

const readJsonFile = (file) => {

	const json = fs.readFileSync(file, 'utf8');
	return JSON.parse(json);
};

const isPrivateIp = (ip) => {
	const parts = ip.split('.');
	return parts[0] === '10' || 
	   (parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) || 
	   (parts[0] === '192' && parts[1] === '168');
}

export default { getCookies, getCookieByName, readJsonFile, isPrivateIp };