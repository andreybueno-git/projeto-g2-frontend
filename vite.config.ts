import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
	return {
	plugins: [
		{
			name: 'validar-url-api',
			buildStart() {
				if (command === 'build' && !loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL?.trim()) {
					throw new Error('Configure VITE_API_URL antes de gerar o build. Veja o README.');
				}
			}
		},
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// A hospedagem entrega este arquivo também ao abrir uma rota interna.
			// O roteador no navegador resolve a página e consulta a API configurada.
			adapter: adapter({ fallback: '200.html' })
		})
	]
	};
});
