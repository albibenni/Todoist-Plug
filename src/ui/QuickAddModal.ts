import { App, Modal, Notice, Setting } from 'obsidian';
import type { TodoistService } from '../services/TodoistService';

export class QuickAddModal extends Modal {
	private taskText = '';
	private service: TodoistService;

	constructor(app: App, service: TodoistService) {
		super(app);
		this.service = service;
	}

	onOpen() {
		const { contentEl } = this;
		
		contentEl.createEl('h2', { text: 'Quick Add to Todoist' });
		
		const desc = contentEl.createEl('p', { text: 'Type your task using Todoist natural language (e.g. "Buy milk #groceries @today")' });
		desc.style.fontSize = '0.9em';
		desc.style.color = 'var(--text-muted)';

		const inputSetting = new Setting(contentEl)
			.addText(text => {
				text.setPlaceholder('Enter task...')
					.onChange(value => {
						this.taskText = value;
					});
				
				// Focus the input automatically
				text.inputEl.focus();
				
				// Handle Enter key
				text.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						this.submitTask();
					}
				});
			});

		// Full width input
		inputSetting.controlEl.style.width = '100%';
		const inputEl = inputSetting.controlEl.querySelector('input');
		if (inputEl) {
			inputEl.style.width = '100%';
		}

		const btnContainer = contentEl.createDiv();
		btnContainer.style.display = 'flex';
		btnContainer.style.justifyContent = 'flex-end';
		btnContainer.style.marginTop = '15px';

		const submitBtn = btnContainer.createEl('button', { text: 'Add Task' });
		submitBtn.addClass('mod-cta');
		submitBtn.addEventListener('click', () => {
			this.submitTask();
		});
	}

	private async submitTask() {
		if (!this.taskText.trim()) {
			new Notice('Task text cannot be empty');
			return;
		}

		try {
			new Notice('Adding task...');
			await this.service.addQuickTask(this.taskText);
			new Notice(`Successfully added: "${this.taskText}"`);
			this.close();
		} catch (error) {
			new Notice('Failed to add task. Check your connection and token.');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
