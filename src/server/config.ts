export type Config = {
	authFile: string;
	sendFile: string;
	serverPort: number;
	cookieName: string;
	cookieSecure: boolean;
};

export default <Config>{
	authFile: process.env.AUTH_FILE || __dirname + '/secure.json',
	sendFile: process.env.SEND_FILE || __dirname + '/login.html',
	serverPort: parseInt(process.env.SERVER_PORT || '8080', 10),
	cookieName: process.env.COOKIE_NAME || 'proxy-auth',
	cookieSecure: (process.env.COOKIE_SECURE && process.env.COOKIE_SECURE === 'true') || false
};