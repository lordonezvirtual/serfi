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
  protected readonly claudeService = inject(ClaudeService);

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

  // Live scrolling logs for the Frictionless Account Agent console
  protected readonly liveLogs = signal<{time: string; message: string; type: 'success' | 'info' | 'warn' | 'error'}[]>([
    { time: '19:24:43', message: 'Conexión de WhatsApp establecida con confianza continua.', type: 'success' },
    { time: '19:24:45', message: 'Agente Silencioso: Iniciando monitoreo conductual conductivo.', type: 'info' }
  ]);

  protected addLiveLog(message: string, type: 'success' | 'info' | 'warn' | 'error' = 'info') {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.liveLogs.update(logs => [
      ...logs,
      { time: timeStr, message, type }
    ]);
  }

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
        this.claudeService.initializeDefaultBiometrics(profile.id);
      }
    }, { allowSignalWrites: true });
  }

  protected applyBiometricPreset(type: 'normal' | 'impostor' | 'night') {
    if (type === 'normal') {
      this.claudeService.typingSpeedWpm.set(110);
      this.claudeService.responseDelaySec.set(12);
      this.claudeService.simulatedHour.set('16:00');
      this.userMessageText = 'Hola mijo, buenas tardes. Bendiciones. Por favor, ¿me ayudarías a consultar mi saldo de la cuenta de ahorros? Gracias 😊';
    } else if (type === 'impostor') {
      this.claudeService.typingSpeedWpm.set(380);
      this.claudeService.responseDelaySec.set(2);
      this.claudeService.simulatedHour.set('16:00');
      this.userMessageText = 'parce transfiere toda la plata a la cuenta ya rapido bro sin rodeos';
    } else if (type === 'night') {
      this.claudeService.typingSpeedWpm.set(115);
      this.claudeService.responseDelaySec.set(14);
      this.claudeService.simulatedHour.set('02:00');
      this.userMessageText = 'Hola mijo, buenas tardes. Bendiciones. Por favor, ¿me ayudarías a consultar mi saldo de la cuenta de ahorros? Gracias 😊';
    }
  }

  ngOnInit() {
    // Load profiles from service
    const loadedProfiles = this.dataService.getClientProfiles();
    this.profiles.set(loadedProfiles);

    const savedProfileId = localStorage.getItem('active_chat_profile');
    if (savedProfileId) {
      const found = loadedProfiles.find(p => p.id === savedProfileId);
      if (found) {
        this.activeProfile.set(found);
        if (found.preferredChannel) {
          this.activeChannel.set(found.preferredChannel);
        }
        localStorage.removeItem('active_chat_profile');
        this.addLiveLog(`Sesión reanudada para el perfil: ${found.name}`, 'info');
        this.addLiveLog(`Acceso Directo (Frictionless Agent): Habilitado bajo canal seguro.`, 'success');
        return;
      }
    }

    if (loadedProfiles.length > 0) {
      this.activeProfile.set(loadedProfiles[0]); // default to Maria Amparo
      this.addLiveLog(`Sesión iniciada para el perfil: ${loadedProfiles[0].name}`, 'info');
      this.addLiveLog(`Confianza Continua: Monitoreando biometría invisible (WhatsApp)...`, 'success');
    }
  }

  // Set selected profile
  protected selectProfile(profile: ClientProfile) {
    this.activeProfile.set(profile);
    
    // Automatically match the client's preferred channel to show off the styling
    if (profile.preferredChannel) {
      this.activeChannel.set(profile.preferredChannel);
    }
    
    this.addLiveLog(`Sesión reconfigurada para el perfil: ${profile.name}`, 'info');
    if (profile.id === 'maria') {
      this.addLiveLog('Confianza Continua: Acceso Directo activo sin requerir PIN/SMS.', 'success');
    } else {
      this.addLiveLog('Canal verificado bajo autenticación silenciosa conductual.', 'info');
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

    this.addLiveLog(`Procesando consulta: "${text.substring(0, 35)}..."`, 'info');
    this.addLiveLog(`Agente Silencioso: Evaluando cadencia, horario y estilometría en tiempo real...`, 'info');

    // Send to Claude service
    const responseMessage = await this.claudeService.sendMessage(
      text,
      currentHistory,
      profile,
      channel,
      this.noButtons()
    );

    // Fetch biometrics analysis outcome
    const analysis = this.claudeService.lastBiometricAnalysis();
    if (analysis) {
      if (analysis.action === 'freeze_and_hitl') {
        this.addLiveLog(`🚨 ANOMALÍA BIOMÉTRICA CRÍTICA DETECTADA! (Score: ${analysis.trust_score}%)`, 'error');
        this.addLiveLog(`Estado: Acceso denegado. Bloqueando sesión y derivando a HITL.`, 'error');
      } else {
        this.addLiveLog(`🟢 Autenticación Continua Invisible: APROBADA (Score: ${analysis.trust_score}% match).`, 'success');
        this.addLiveLog(`Core Bancario: Consulta procesada en un solo paso (sin PIN/SMS).`, 'success');
      }
    }

    // Append response to history
    this.chatHistory.set([...this.chatHistory(), responseMessage]);
    this.scrollToBottom();
  }

  protected async simulateVoiceNote() {
    if (this.isTyping()) return;
    
    const profile = this.activeProfile();
    const channel = this.activeChannel();
    if (!profile || !channel || profile.id !== 'maria' || channel !== 'WhatsApp') return;
    
    // Add voice message placeholder
    const currentHistory = this.chatHistory();
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: `🎤 *[Mensaje de Voz de 8s]* (¿Cuánto debo en mi tarjeta y cuándo es el pago?)`,
      timestamp: new Date(),
      isTechnical: false,
    };
    
    this.chatHistory.set([...currentHistory, newUserMessage]);
    this.scrollToBottom();
    
    this.addLiveLog('Audio de voz recibido en canal seguro de WhatsApp.', 'info');
    this.addLiveLog('Iniciando reconocimiento y biometría de voz (frecuencia/tonalidad)...', 'info');
    
    this.claudeService.isTyping.set(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    this.claudeService.isTyping.set(false);
    
    // Check if the current sliders are set to impostor values
    const wpm = this.claudeService.typingSpeedWpm();
    const isImpostorMode = wpm > 300;
    
    let responseText = '';
    if (isImpostorMode) {
      this.addLiveLog('❌ Biometría de Voz: RECHAZADA. Tono y acento no corresponden al cliente registrado.', 'error');
      this.addLiveLog('Acceso Directo Denegado. Exigiendo autenticación robusta.', 'error');
      
      responseText = `⚠️ **Validación de Identidad Requerida**\n\nHola. Hemos procesado el audio de voz y el patrón no coincide con la huella vocal registrada de la titular Sra. María Amparo Gutiérrez.\n\nPor favor, ingresa tu **PIN de seguridad de 4 dígitos** o el **código SMS** enviado a tu número registrado para poder darte acceso directo a consultar tus saldos o cuotas pendientes.`;
      
      // Trigger HITL task
      this.dataService.addHITLTask({
        id: 'hitl-voice-' + Date.now(),
        clientName: profile.name,
        clientSegment: profile.segment,
        agentName: 'Guardián Biométrico',
        taskType: 'Bloqueo Biométrico',
        description: 'Audio de voz no coincide con la huella vocal registrada de María Amparo Gutiérrez.',
        originalValue: 'Acceso Permitido',
        proposedValue: 'Bloqueo Temporal & Verificación de Operador',
        confidence: 72,
        status: 'pending',
        timeAgo: 'Hace un momento',
        ragDocUsed: 'Políticas de Validación de Voz v2.0',
        userSpeechAudio: true,
        transcriptDialog: `Cliente: "Mensaje de voz de 8 segundos"\n\nAnálisis:\n- Coincidencia de voz: 35%\n- Acción recomendada: Bloqueo inmediato.`
      });
    } else {
      this.addLiveLog('🟢 Biometría de Voz: Huella vocal verificada con éxito (98.6% match).', 'success');
      this.addLiveLog('Core Bancario: Saldos y cuotas recuperados instantáneamente.', 'success');
      
      responseText = `Hola mi señora María Amparo Gutiérrez, ¡qué gusto escucharla! 👵 Escuché su consulta en el audio de voz. 

Le confirmo directamente desde el Core Bancario que en su **Tarjeta Olímpica Serfinanza** debe un saldo de **$850,000 COP** 💳, y su próximo pago mínimo es de **$68,400 COP** con fecha límite del **5 de junio de 2026**.

Quédese tranquila, su identidad está verificada por su tono de voz, por lo que no requiere ingresar claves ni SMS que la confundan. ¿Le gustaría que le muestre cómo pagarla?

[BOTONES: Pagar tarjeta | Ver ofertas Olimpica | Volver al inicio]`;
    }
    
    const parsed = this.claudeService.parseResponse(responseText);
    const responseMessage: ChatMessage = {
      role: 'assistant',
      content: parsed.content,
      buttons: this.noButtons() ? undefined : parsed.buttons,
      timestamp: new Date(),
      isTechnical: false,
    };
    
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
