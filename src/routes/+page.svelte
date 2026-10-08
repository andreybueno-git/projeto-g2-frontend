<script lang="ts">
	import type { Prioridade, Status } from '../tipos';

	const equipe = 'Mentalista?';

	const integrantes = [
		'Andrey Bueno Isoton',
		'Gabriel Silva de Miranda',
		'Rayane Araujo Teles',
		'Pedro Herique Araujo'
	];

	// Valores do contrato (src/tipos.ts). Um valor fora do contrato aqui faz o `npm run check` falhar.
	const status: Status[] = ['a-fazer', 'em-andamento', 'em-revisao', 'concluida'];
	const prioridades: Prioridade[] = ['baixa', 'media', 'alta'];

	const api = 'http://localhost:3000';
</script>

<svelte:head>
	<title>{equipe} · Gerenciador de tarefas</title>
	<meta
		name="description"
		content="Projeto da G2 de Desenvolvimento Frontend 2026.2: gerenciador de tarefas em Svelte com TypeScript."
	/>
</svelte:head>

<header>
	<p class="disciplina">Desenvolvimento Frontend · 2026.2 · Projeto da G2</p>
	<h1>{equipe}</h1>
	<p>Gerenciador de tarefas em Svelte com TypeScript.</p>
</header>

<main>
	<section aria-labelledby="titulo-equipe">
		<h2 id="titulo-equipe">Equipe</h2>
		<ul>
			{#each integrantes as nome (nome)}
				<li>{nome}</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="titulo-marco">
		<h2 id="titulo-marco">O que já está pronto no Marco 1</h2>
		<ul>
			<li>Projeto criado com <code>npx sv create</code>, em Svelte com TypeScript.</li>
			<li>
				Contrato de dados em <code>src/tipos.ts</code>: <code>Projeto</code>, <code>Tarefa</code>,
				<code>Status</code> e <code>Prioridade</code>.
			</li>
			<li><code>db.json</code> com as coleções <code>projetos</code> e <code>tarefas</code>.</li>
			<li>API local com o json-server 1.x.</li>
		</ul>

		<dl>
			<dt>Status aceitos</dt>
			<dd>
				{#each status as valor (valor)}
					<code>{valor}</code>
				{/each}
			</dd>
			<dt>Prioridades aceitas</dt>
			<dd>
				{#each prioridades as valor (valor)}
					<code>{valor}</code>
				{/each}
			</dd>
		</dl>
	</section>

	<section aria-labelledby="titulo-api">
		<h2 id="titulo-api">Como rodar a API</h2>
		<p>Em outro terminal, na pasta do projeto:</p>
		<pre><code>npx json-server db.json</code></pre>
		<p>Com a API ligada, os dados ficam em:</p>
		<ul>
			<li><a href="{api}/projetos">{api}/projetos</a></li>
			<li><a href="{api}/tarefas">{api}/tarefas</a></li>
		</ul>
		<p class="aviso">
			Esta página ainda não busca os dados da API. A listagem de tarefas é o Marco 2.
		</p>
	</section>
</main>

<footer>
	<p>Profª Marianne Lacerda Dutra Theodoro</p>
</footer>

<style>
	header,
	main,
	footer {
		max-width: 42rem;
		margin: 0 auto;
		padding: 0 1.25rem;
	}

	header {
		padding-top: 3rem;
	}

	.disciplina {
		margin: 0;
		font-size: 0.875rem;
		opacity: 0.75;
	}

	h1 {
		margin: 0.25rem 0;
		font-size: 2.5rem;
		line-height: 1.1;
	}

	h2 {
		margin: 2.5rem 0 0.5rem;
		font-size: 1.25rem;
	}

	ul {
		padding-left: 1.25rem;
	}

	li {
		margin: 0.25rem 0;
	}

	dl {
		margin: 1rem 0 0;
	}

	dt {
		font-weight: 600;
	}

	dd {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0.25rem 0 0.75rem;
	}

	code {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.9em;
		padding: 0.1em 0.35em;
		border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
		border-radius: 0.25rem;
	}

	pre {
		margin: 0.5rem 0;
		padding: 0.75rem 1rem;
		overflow-x: auto;
		border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
		border-radius: 0.375rem;
	}

	pre code {
		padding: 0;
		border: 0;
	}

	.aviso {
		padding-left: 0.75rem;
		border-left: 3px solid currentColor;
	}

	footer {
		margin-top: 3rem;
		padding-bottom: 3rem;
		font-size: 0.875rem;
		opacity: 0.75;
	}
</style>
