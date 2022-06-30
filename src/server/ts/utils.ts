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

export default { getCookies, getCookieByName, isPrivateIp };