import { Notice, Plugin, requestUrl } from 'obsidian';
import type { RequestUrlParam, RequestUrlResponse } from 'obsidian';
import { TodoistApi } from '@doist/todoist-sdk';
import {
	DEFAULT_SETTINGS,
	type TodoistPluginSettings,
	TodoistPluginSettingsSchema,
	TodoistSettingTab,
} from './settings';
import { TodoistService } from './services/TodoistService';
import { QuickAddModal } from './ui/QuickAddModal';
import { TaskRenderer } from './ui/TaskRenderer';

const TOKEN_KEY = 'todoist-api-token';

export default class TodoistPlugin extends Plugin {
	settings!: TodoistPluginSettings;
	api: TodoistApi | null = null;
	todoistService: TodoistService | null = null;

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new TodoistSettingTab(this.app, this));

		// Initialize Todoist client
		this.initTodoistClient();

		// Add a command to verify the connection
		this.addCommand({
			id: 'verify-todoist-connection',
			name: 'Verify Todoist connection',
			callback: async () => {
				if (!this.api) {
					new Notice('Todoist API token is not set. Please update your settings.');
					return;
				}
				
				try {
					new Notice('Fetching projects from Todoist...');
					const projects = await this.api.getProjects();
					new Notice(`Successfully connected!`);
				} catch (error) {
					console.error('Error connecting to Todoist:', error);
					new Notice('Failed to connect to Todoist. Check your API token.');
				}
			},
		});

		// Quick Add Task Command
		this.addCommand({
			id: 'add-quick-task',
			name: 'Add quick task',
			callback: () => {
				if (!this.todoistService) {
					new Notice('Todoist API token is not set. Please update settings.');
					return;
				}
				new QuickAddModal(this.app, this.todoistService).open();
			},
		});

		// Markdown Code Block Processor for Task Materialization
		this.registerMarkdownCodeBlockProcessor('todoist', async (source, el, ctx) => {
			if (!this.todoistService) {
				const p = document.createElement('p');
				p.textContent = 'Todoist API token is not set.';
				p.classList.add('todoist-error');
				el.appendChild(p);
				return;
			}
			
			const filterQuery = source.trim();
			
			// Show loading state
			const loadingEl = document.createElement('p');
			loadingEl.textContent = 'Loading tasks...';
			loadingEl.classList.add('todoist-loading');
			el.appendChild(loadingEl);
			
			try {
				const tasks = await this.todoistService.fetchTasks(filterQuery);
				// Remove loading element
				loadingEl.remove();
				// Render the HTML
				TaskRenderer.renderHTML(tasks, el);
			} catch (error) {
				loadingEl.remove();
				const p = document.createElement('p');
				p.textContent = 'Failed to load tasks.';
				p.classList.add('todoist-error');
				el.appendChild(p);
			}
		});
	}

	onunload() {
		console.log('Unloading Todoist Bridge plugin');
	}

	getApiToken(): string | null {
		return this.app.secretStorage.getSecret(TOKEN_KEY);
	}

	setApiToken(token: string) {
		this.app.secretStorage.setSecret(TOKEN_KEY, token);
	}

	initTodoistClient() {
		const token = this.getApiToken();
		if (token) {
			// Wrap Obsidian's requestUrl to perfectly match standard fetch API
			const customFetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
				const req: RequestUrlParam = {
					url: url.toString(),
					method: init?.method || 'GET',
					headers: (init?.headers as Record<string, string>) || {},
					body: init?.body as string | ArrayBuffer | undefined,
					throw: false,
				};
				const res: RequestUrlResponse = await requestUrl(req);
				
				return {
					ok: res.status >= 200 && res.status < 300,
					status: res.status,
					json: async () => res.json,
					text: async () => res.text,
					headers: new Headers(res.headers),
				} as unknown as Response;
			};

			this.api = new TodoistApi(token, { customFetch });
			this.todoistService = new TodoistService(this.api);
			console.log('Todoist client initialized with Obsidian requestUrl.');
		} else {
			this.api = null;
			this.todoistService = null;
			console.log('Todoist client not initialized: Missing API token.');
		}
	}

	async loadSettings() {
		const data = await this.loadData();
		try {
			this.settings = TodoistPluginSettingsSchema.parse(data || {});
		} catch (err) {
			console.error('Failed to parse settings, falling back to defaults:', err);
			this.settings = DEFAULT_SETTINGS;
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
