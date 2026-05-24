import { Component, OnInit, ElementRef, ViewChild, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, ClientProfile } from '../../services/mock-data.service';
import { ClaudeService, ChatMessage } from '../../services/claude.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
})
export class ChatComponent implements OnInit {
  private readonly dataService = inject(MockDataService);
  private readonly claudeService = inject(ClaudeService);

  // Core signals
  protected readonly profiles = signal<ClientProfile[]>([]);
  protected readonly activeProfile = signal<ClientProfile | null>(null);
  protected readonly activeChannel = signal<string>('WhatsApp');
  protected readonly chatHistory = signal<ChatMessage[]>([]);
  protected readonly noButtons = signal<boolean>(true);

  // Exposed signals from ClaudeService
  protected readonly isTyping = this.claudeService.isTyping;
  protected readonly apiKey = this.claudeService.apiKey;

  // Form input
  protected userMessageText = '';

  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef<HTMLDivElement>;

  // Scenario presets
  protected readonly scenarios = [
    { label: 'Consultar saldo', text: 'Consultar saldo' },
    { label: 'Fecha de pago TC', text: '¿Cuál es mi fecha de pago de la tarjeta de crédito?' },
    { label: 'Extracto mes', text: 'Quiero ver mi extracto de este mes' },
    { label: 'Ofertas Olimpica', text: '¿Cuáles son las ofertas de Olimpica de esta semana?' },
    { label: 'Beneficios SuperCDT', text: '¿Qué beneficios tiene el SuperCDT?' },
    { label: 'Actualizar datos', text: 'Necesito actualizar mis datos de contacto' },
    { label: 'Viernes de carnes', text: '¿De qué se trata el viernes de carnes de Olímpica?' },
    { label: 'Sábado madrugón', text: '¿Qué ofertas hay para el sábado madrugón?' },
  ];

  constructor() {
    // React to profile or channel changes to re-initialize chat
    effect(() => {
      const profile = this.activeProfile();
      const channel = this.activeChannel();
      if (profile && channel) {
        this.initializeWelcomeMessage(profile, channel);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    // Load profiles from service
    const loadedProfiles = this.dataService.getClientProfiles();
    this.profiles.set(loadedProfiles);
    if (loadedProfiles.length > 0) {
      this.activeProfile.set(loadedProfiles[0]); // default to Maria Amparo
    }
  }

  // Set selected profile
  protected selectProfile(profile: ClientProfile) {
    this.activeProfile.set(profile);
    
    // Automatically match the client's preferred channel to show off the styling
    if (profile.preferredChannel) {
      this.activeChannel.set(profile.preferredChannel);
    }
  }

  // Set selected channel
  protected selectChannel(channel: string) {
    this.activeChannel.set(channel);
  }

  // Toggle buttons mode
  protected toggleNoButtons() {
    const val = !this.noButtons();
    this.noButtons.set(val);
    localStorage.setItem('chat_no_buttons', String(val));
    
    // Re-initialize welcome message with updated format
    const profile = this.activeProfile();
    const channel = this.activeChannel();
    if (profile && channel) {
      this.initializeWelcomeMessage(profile, channel);
    }
  }

  // Welcome message based on profile and channel
  private initializeWelcomeMessage(profile: ClientProfile, channel: string) {
    let welcomeText = '';
    let initialButtons: string[] = [];

    if (profile.isAdvisor) {
      welcomeText = `🔧 **COPILOTO COGNITIVO BANCO SERFINANZA**
Hola Juliana. Estoy monitoreando activamente la sesión en la sucursal de Bogotá Chapinero. 
Si el cliente realiza alguna consulta operativa o de portafolio, ingresa la consulta aquí para asistirte con el script oficial, los datos del scoring comercial del cliente y los pasos regulados.`;
      if (!this.noButtons()) {
        welcomeText += `\n\n**Acciones sugeridas de inicio:**\n[BOTONES: Ficha del Cliente | Guías Operativas | Catálogo Olímpica]`;
      }
    } else if (profile.id === 'maria') {
      if (this.noButtons()) {
        welcomeText = `Hola Sra. María Amparo, bienvenida a su canal de atención de **Banco Serfinanza**. 😊 Escríbame su consulta y con gusto le colaboro en lenguaje natural. ¡Es un placer saludarla hoy!`;
      } else {
        welcomeText = `Hola Sra. María Amparo, bienvenida a su canal de atención de **Banco Serfinanza**. 😊 Escribe o selecciona una opción rápida y con gusto le colaboro. ¡Es un placer saludarla hoy!`;
        initialButtons = ['Consultar saldo', 'Ofertas Olimpica', 'Beneficios SuperCDT'];
      }
    } else {
      if (this.noButtons()) {
        welcomeText = `¡Hola Carlos! Bienvenido al asistente virtual 360 de **Banco Serfinanza** en Telegram. ⚡ Escríbeme tu consulta directamente y con gusto te ayudaré hoy.`;
      } else {
        welcomeText = `¡Hola Carlos! Bienvenido al asistente virtual 360 de **Banco Serfinanza** en Telegram. ⚡ ¿En qué te puedo ayudar hoy? Selecciona una de las opciones rápidas o ingresa tu duda.`;
        initialButtons = ['Consultar saldo', 'Beneficios SuperCDT', 'Actualizar datos'];
      }
    }

    const parsed = this.claudeService.parseResponse(welcomeText);

    this.chatHistory.set([
      {
        role: 'assistant',
        content: parsed.content,
        buttons: this.noButtons() ? undefined : (parsed.buttons || initialButtons),
        timestamp: new Date(),
        isTechnical: profile.isAdvisor,
      },
    ]);

    this.scrollToBottom();
  }

  // Click scenario buttons or quick replies
  protected async triggerScenario(text: string) {
    if (this.isTyping() || this.noButtons()) return;
    this.userMessageText = '';
    await this.sendMessage(text);
  }

  // Send message
  protected async sendUserMessage() {
    if (!this.userMessageText.trim() || this.isTyping()) return;
    const msg = this.userMessageText;
    this.userMessageText = '';
    await this.sendMessage(msg);
  }

  private async sendMessage(text: string) {
    const profile = this.activeProfile();
    const channel = this.activeChannel();
    if (!profile || !channel) return;

    // Add user message to history
    const currentHistory = this.chatHistory();
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
      isTechnical: profile.isAdvisor,
    };

    this.chatHistory.set([...currentHistory, newUserMessage]);
    this.scrollToBottom();

    // Send to Claude service
    const responseMessage = await this.claudeService.sendMessage(
      text,
      currentHistory,
      profile,
      channel,
      this.noButtons()
    );

    // Append response to history
    this.chatHistory.set([...this.chatHistory(), responseMessage]);
    this.scrollToBottom();
  }

  // Helper to scroll
  private scrollToBottom() {
    setTimeout(() => {
      if (this.chatScrollContainer) {
        const container = this.chatScrollContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }
}
