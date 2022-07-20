(function () {

	const message = document.getElementById('login-message')!;
	const form = document.getElementById('login-form')!;
	const username = document.getElementById('login-username') as HTMLInputElement;
	const password = document.getElementById('login-password') as HTMLInputElement;

	const logo = document.getElementById('login-logo')!;
	const loader = document.getElementById('login-loader')!;
	const info = document.getElementById('login-info')!;

	const infoMeta = document.querySelector('meta[name="x-info-message"]') as HTMLMetaElement;
	const failedMeta = document.querySelector('meta[name="x-failed-message"]') as HTMLMetaElement

	info.addEventListener('click', e => {

		e.preventDefault();

		message.innerHTML = infoMeta.content;
		message.style.display = 'block';
	});

	form.addEventListener('submit', e => {

		e.preventDefault();

		const user = username.value;
		const pass = password.value;

		password.value = '';

		message.style.display = 'none';
		message.innerHTML = '';

		logo.style.display = 'none';
		loader.style.display = 'block';

		const xhr = new XMLHttpRequest();

		xhr.addEventListener('readystatechange', r => {

			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status <= 304) {
					window.location.reload();
				}
				else {
					message.style.display = 'block';
					message.innerHTML = failedMeta.content;

					loader.style.display = 'none';
					logo.style.display = 'block';
				}
			}
		});

		xhr.open('GET', '');
		xhr.setRequestHeader('X-Auth-User', user);
		xhr.setRequestHeader('X-Auth-Password', pass);
		xhr.send();
	});

})();