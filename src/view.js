const fs = require('fs');

// mustache view vars
module.exports = {
	document_style: fs.readFileSync('./build/style.css', 'utf-8'),
	document_script: fs.readFileSync('./build/client.js', 'utf-8'),
	document_lang: 'de',
	document_title: 'Absatzprojekt - Anmeldung',
	realm_message: 'benötigt eine Authentifizierung.',
	user_label: 'Benutzer',
	password_label: 'Passwort',
	login_text: 'Anmelden',
	login_footer: `&copy; <script>document.write((new Date()).getFullYear())</script> <a href="https://absatzformat.de"
		target="_blank">Absatzformat GmbH</a> - <a href="https://absatzformat.de/datenschutz"
		target="_blank">Datenschutz</a>`
};