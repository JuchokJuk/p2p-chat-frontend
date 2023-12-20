<script lang="ts">
	import type { Connection } from './Connection';

	export let connections: Connection[];
	export let logs: { text: string; data: any }[];

	let fullscreen = false;

	function syntaxHighlight(json: string) {
		json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return json.replace(
			/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
			function (match) {
				var cls = 'number';
				if (/^"/.test(match)) {
					if (/:$/.test(match)) {
						cls = 'key';
					} else {
						cls = 'string';
					}
				} else if (/true|false/.test(match)) {
					cls = 'boolean';
				} else if (/null/.test(match)) {
					cls = 'null';
				}
				return '<span class="' + cls + '">' + match + '</span>';
			}
		);
	}

	function replacer(key: string, value: any) {
		return key === 'peer' ? 'peer' : value;
	}
</script>

<div
	class="container"
	on:click={() => {
		fullscreen = !fullscreen;
	}}
>
	<div class="debug">
		{@html syntaxHighlight(JSON.stringify({ logs, connections }, replacer, 4))}
	</div>
</div>

<style lang="scss">
	.container {
		overflow: auto;
		padding: 16px;
		width: 100%;
		height: 100%;
		background: rgb(236, 236, 236);
		border-radius: 8px;
		font-family: monospace;

		.debug {
			display: inline-block;
			white-space: pre;

			:global(.string) {
				color: green;
			}
			:global(.number) {
				color: darkorange;
			}
			:global(.boolean) {
				color: blue;
			}
			:global(.null) {
				color: magenta;
			}
			:global(.key) {
				color: red;
			}
		}
	}
</style>
