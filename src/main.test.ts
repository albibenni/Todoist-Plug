import { describe, it, expect, vi, beforeEach } from 'vitest';
import TodoistPlugin from './main';



// Mock the Todoist SDK
vi.mock('@doist/todoist-sdk', () => {
	return {
		TodoistApi: class {
			getProjects = vi.fn();
		}
	};
});

describe('TodoistPlugin Token Logic', () => {
	let appMock: any;
	let plugin: TodoistPlugin;

	beforeEach(() => {
		appMock = {
			secretStorage: {
				getSecret: vi.fn(),
				setSecret: vi.fn()
			}
		};
		// Instantiate the plugin with our mocked app
		plugin = new TodoistPlugin(appMock, {} as any);
	});

	describe('getApiToken / setApiToken', () => {
		it('should securely retrieve the token from app.secretStorage', () => {
			appMock.secretStorage.getSecret.mockReturnValue('test-token');
			
			const token = plugin.getApiToken();
			
			expect(appMock.secretStorage.getSecret).toHaveBeenCalledWith('todoist-api-token');
			expect(token).toBe('test-token');
		});

		it('should securely save the token to app.secretStorage', () => {
			plugin.setApiToken('new-token-123');
			
			expect(appMock.secretStorage.setSecret).toHaveBeenCalledWith('todoist-api-token', 'new-token-123');
		});
	});

	describe('initTodoistClient', () => {
		it('should initialize clients if token exists', () => {
			appMock.secretStorage.getSecret.mockReturnValue('test-token');
			
			plugin.initTodoistClient();
			
			expect(plugin.api).not.toBeNull();
			expect(plugin.todoistService).not.toBeNull();
		});

		it('should set clients to null if no token exists', () => {
			appMock.secretStorage.getSecret.mockReturnValue(null);
			
			// Pre-fill with fake data to verify it gets wiped
			plugin.api = {} as any;
			plugin.todoistService = {} as any;
			
			plugin.initTodoistClient();
			
			expect(plugin.api).toBeNull();
			expect(plugin.todoistService).toBeNull();
		});
	});
});
