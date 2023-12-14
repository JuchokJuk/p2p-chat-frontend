import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import { PUBLIC_ENVIRONMENT } from '$env/static/public';

function server(environment: string) {
	if (environment === 'DEV') {
		return {
			https: {
				key: fs.readFileSync(`${__dirname}/cert/key.pem`),
				cert: fs.readFileSync(`${__dirname}/cert/cert.pem`)
			},
			proxy: {}
		};
	}
}

export default defineConfig({
	plugins: [sveltekit()],
	server: server(PUBLIC_ENVIRONMENT)
});
