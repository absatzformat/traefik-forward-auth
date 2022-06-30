type Config = {
	authFile: string;
	sendFile: string;
	serverPort: number;
	cookieName: string;
	cookieSecure: boolean;
};

type HostData = {
	ipwhitelist: ?string[];
	users: ?Record<string, string>;
};

type SecureData = HostData & {
	hosts: ?Record<string, HostData>;
};