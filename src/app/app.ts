import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClaudeService } from './services/claude.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly claudeService = inject(ClaudeService);

  // Modal display signal
  protected showSettingsModal = signal<boolean>(false);
  
  // Model for the input field in settings
  protected apiKeyInput = '';

  // Expose signals to the template
  protected readonly apiKey = this.claudeService.apiKey;
  protected readonly forceFallback = this.claudeService.forceFallback;

  ngOnInit() {
    this.apiKeyInput = this.apiKey();
  }

  // Open the settings modal
  protected openSettings() {
    this.apiKeyInput = this.apiKey();
    this.showSettingsModal.set(true);
  }

  // Close the settings modal
  protected closeSettings() {
    this.showSettingsModal.set(false);
  }

  // Save the API key
  protected saveSettings() {
    this.claudeService.setApiKey(this.apiKeyInput);
    this.closeSettings();
    
    // Simulate refreshing page welcome messages silently
    const status = this.apiKeyInput ? 'Conectado a Claude 3.5 Sonnet' : 'Usando cerebro simulado local';
    alert(`Ajustes guardados: ${status}`);
  }

  // Clear the API Key
  protected clearApiKey() {
    this.apiKeyInput = '';
    this.claudeService.setApiKey('');
    this.closeSettings();
    alert('API Key de Claude eliminada. Modo simulación activado.');
  }

  // Toggle force simulation fallback for demo testing
  protected toggleForceFallback() {
    this.claudeService.forceFallback.update(val => !val);
  }
}
