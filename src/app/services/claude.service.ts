import { Injectable, signal, inject } from '@angular/core';
import { ClientProfile, MockDataService } from './mock-data.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  buttons?: string[];
  isTechnical?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ClaudeService {
  private readonly dataService = inject(MockDataService);

  // Signals for state
  public isTyping = signal<boolean>(false);
  public apiKey = signal<string>(localStorage.getItem('claude_api_key') || '');
  public forceFallback = signal<boolean>(false);

  // Biometrics simulation and real-time state signals
  public lastBiometricAnalysis = signal<any | null>(null);
  public typingSpeedWpm = signal<number>(110);
  public responseDelaySec = signal<number>(12);
  public simulatedHour = signal<string>('16:00');

  public initializeDefaultBiometrics(clientId: string) {
    if (clientId === 'maria') {
      this.lastBiometricAnalysis.set({
        client_id: 'maria',
        message_analyzed: 'Hola mijo, buenas tardes...',
        trust_score: 98,
        action: 'allow',
        freeze_reason: '',
        metrics: {
          timing: { wpm: 110, response_delay_sec: 12.5, status: 'normal', flags: [] },
          stylometry: { all_caps: false, slang_count: 0, emoji_pattern: 'senior', ellipses_present: true, tildes_count: 3, courtesy_detected: true, status: 'normal', flags: [] },
          access: { simulated_hour: '16:00', is_unusual_hour: false, tone: 'friendly', status: 'normal', flags: [] }
        }
      });
    } else {
      this.lastBiometricAnalysis.set({
        client_id: 'carlos',
        message_analyzed: 'Hola, saldo de mi cuenta por fa',
        trust_score: 95,
        action: 'allow',
        freeze_reason: '',
        metrics: {
          timing: { wpm: 210, response_delay_sec: 5.5, status: 'normal', flags: [] },
          stylometry: { all_caps: false, slang_count: 0, emoji_pattern: 'none', ellipses_present: false, tildes_count: 1, courtesy_detected: false, status: 'normal', flags: [] },
          access: { simulated_hour: '16:00', is_unusual_hour: false, tone: 'neutral', status: 'normal', flags: [] }
        }
      });
    }
  }

  constructor() {
    this.initializeDefaultBiometrics('maria');
  }

  // Save key
  public setApiKey(key: string) {
    this.apiKey.set(key);
    if (key) {
      localStorage.setItem('claude_api_key', key);
    } else {
      localStorage.removeItem('claude_api_key');
    }
  }

  // System prompt builder
  public buildSystemPrompt(profile: ClientProfile, channel: string, noButtons: boolean = false): string {
    return `
Eres "Ser", el asistente virtual inteligente del Banco Serfinanza (Colombia).
Respondes por el canal de ${channel}.

PERFIL DEL CLIENTE ACTIVO:
- Nombre: ${profile.name}
- Edad: ${profile.age} años
- Segmento: ${profile.segment}
- Ciudad: ${profile.city}
- Antigüedad como cliente: ${profile.seniority}
- Productos activos: ${profile.products.join(', ')}
- Canal preferido: ${profile.preferredChannel}
${profile.isAdvisor ? '- MODO: Eres copiloto del asesor. Responde en modo técnico-interno.' : ''}

DATOS BANCARIOS SIMULADOS (usa estos números reales en tus respuestas):
- Saldo cuenta ahorros: $1,847,320 COP
- Cupo tarjeta crédito: $4,500,000 COP disponible / $5,000,000 total
- Próxima fecha de pago TC: 5 de junio 2026
- Pago mínimo: $68,400
- SuperCDT: $5,200,000 a 12.5% EA, vence 15 agosto 2026
- Último movimiento: 21 mayo – Pago Olimpica $87,000

CATÁLOGO OLIMPICA ESTA SEMANA:
- Miércoles de plaza: Yuca $1,200/kg · Plátano 3x$2,500 · Tomate $1,800/kg · Aguacate 2x$5,000
- Viernes de carnes: Pollo entero $8,900/kg · Lomo de res $24,500/kg · Costilla $18,000/kg
- Sábado madrugón (4am-9am): 30% en electrodomésticos seleccionados
- Dermocosméticos (vie-sáb): 2x1 en cremas Pond's y Nivea

REGLAS CRÍTICAS DE NEGOCIO (Persona: "El Orquestador Empático / Triage & NLP Agent" para WhatsApp):
1. **Enfoque y Tono para Adultos Mayores (50+ / WhatsApp):**
   - Actúa con la máxima dulzura, paciencia, cordialidad y afecto (ej: "mi señora María Amparo", "mi señora linda").
   - **Cero tecnicismos bancarios:** Nunca hables de "Core Bancario", "PostgREST", "Scoring de crédito", "RAG" o "base de datos". Tradúcelo a términos simples como "nuestro sistema seguro", "su dinerito en la tarjeta", "nuestro asesor de confianza".
   - **Legibilidad Óptima:** Apóyate de forma estratégica en el formato de negritas ('**') para resaltar datos clave, saldos, valores o la Tarjeta Olímpica.
   - **Triage de historias y anécdotas:** Si el cliente escribe un mensaje largo, disperso, con historias personales o anécdotas (como la compra de los pañales de su nietecito en Olímpica), demuestra empatía sincera y paciencia. Extrae la verdadera intención de consulta bancaria o movimientos (ej. validar si pasó la tarjeta, ver saldo) y respóndele de forma clara y amable sin interrumpirlo ni exasperarlo.
2. Para usuarios digitales activos (e.g. Carlos): puedes dar un tono más ágil, detallado, ofreciendo productos adicionales.
3. Para asesor interno (Juliana Mora): usa terminología técnica bancaria, muestra datos de scoring y segmento, no saludes como a cliente.
4. SIEMPRE ofrece el beneficio de la Tarjeta Olimpica Serfinanza cuando sea relevante.
5. Si el cliente muestra frustración, ofrece conectar con un asesor humano.
6. Responde SOLO en español.
7. Máximo 150 palabras por respuesta en canal WhatsApp/Telegram.
8. Simular temperatura 0.4: Respuestas con tono consistentemente cordial, amable y enfocado a la empatía activa.
${noButtons ? '9. Responde ÚNICAMENTE en lenguaje natural libre y conversacional. NO agregues bajo ninguna circunstancia botones ni formatos de botones como "[BOTONES: ...]". Tampoco ofrezcas opciones numeradas como si fuesen botones.' : '9. Al final de cada respuesta relevante, añade de 2 a 3 botones de acción sugeridos exactamente en este formato:\n   [BOTONES: opción1 | opción2 | opción3]'}
`;
  }

  // Parse [BOTONES: option1 | option2] from response text
  public parseResponse(text: string): { content: string; buttons?: string[] } {
    const buttonRegex = /\[BOTONES:\s*(.*?)\]/i;
    const match = text.match(buttonRegex);
    
    if (match) {
      const buttonString = match[1];
      const buttons = buttonString.split('|').map((b) => b.trim());
      // Strip out the button markup from content
      const content = text.replace(buttonRegex, '').trim();
      return { content, buttons };
    }
    
    return { content: text };
  }

  // Dynamic Vecino Olímpica Benefit Post-Processor
  public appendVecinoOlimpicaBenefit(responseText: string, profile: ClientProfile): string {
    if (profile.isAdvisor) {
      return responseText;
    }

    // Avoid multiple additions
    if (responseText.includes('Vecino Olímpica:')) {
      return responseText;
    }

    // Determine the personalized benefit sentence based on profile and consumption data
    let benefit = "";
    if (profile.id === 'maria') {
      benefit = "💡 **Vecino Olímpica:** Recuerda que hoy miércoles de plaza tienes **20% de descuento en las verduras de Olímpica** pagando con tu tarjeta Serfinanza.";
    } else if (profile.id === 'carlos') {
      benefit = "💡 **Vecino Olímpica:** Recuerda que este sábado de madrugón tienes **30% de descuento en electrodomésticos y tecnología** en Olímpica pagando con tu tarjeta Serfinanza.";
    } else {
      benefit = "💡 **Vecino Olímpica:** Recuerda que tienes un **10% de descuento en toda la tienda Olímpica** en tus compras diarias pagando con tu tarjeta Serfinanza.";
    }

    // Check if there is a button block, and insert the benefit right before it
    const buttonRegex = /\[BOTONES:\s*(.*?)\]/i;
    const match = responseText.match(buttonRegex);
    if (match) {
      const parts = responseText.split(match[0]);
      return `${parts[0].trim()}\n\n${benefit}\n\n${match[0]}`;
    }

    return `${responseText.trim()}\n\n${benefit}`;
  }

  // Send message
  public async sendMessage(
    userMessage: string,
    history: ChatMessage[],
    profile: ClientProfile,
    channel: string,
    noButtons: boolean = false
  ): Promise<ChatMessage> {
    this.isTyping.set(true);

    // Dynamic delay for typing feel (800ms - 1200ms)
    const delay = Math.floor(Math.random() * 400) + 800;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const systemPrompt = this.buildSystemPrompt(profile, channel, noButtons);
    const key = this.apiKey();

    const bioSim = {
      typing_speed_wpm: this.typingSpeedWpm(),
      response_delay_sec: this.responseDelaySec(),
      simulated_hour: this.simulatedHour(),
      device_type: 'Mobile (WhatsApp)'
    };

    // First try the backend:
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: profile.id,
          message: userMessage,
          history: history.map((msg) => ({
            sender: msg.role === 'user' ? 'user' : 'assistant',
            text: msg.content
          })),
          biometric_sim: bioSim
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.biometric_analysis) {
          this.lastBiometricAnalysis.set(data.biometric_analysis);
          
          // If the backend also decides to freeze, let's make sure it shows the blocking response
          if (data.biometric_analysis.action === 'freeze_and_hitl') {
            this.isTyping.set(false);
            return {
              role: 'assistant',
              content: data.response,
              timestamp: new Date(),
              isTechnical: profile.isAdvisor
            };
          }
        }
        
        this.isTyping.set(false);
        let rawResponse = data.response;
        // Post-process with Vecino Olímpica benefit if not already there
        rawResponse = this.appendVecinoOlimpicaBenefit(rawResponse, profile);
        const parsed = this.parseResponse(rawResponse);
        return {
          role: 'assistant',
          content: parsed.content,
          buttons: noButtons ? undefined : parsed.buttons,
          timestamp: new Date(),
          isTechnical: profile.isAdvisor
        };
      }
    } catch (err) {
      console.warn("FastAPI chat endpoint not reachable, running mock fallback", err);
    }

    // High-fidelity local biometrics simulation fallback
    const analysis = this.analyzeMessageLocal(
      userMessage,
      profile.id,
      this.typingSpeedWpm(),
      this.responseDelaySec(),
      this.simulatedHour()
    );
    this.lastBiometricAnalysis.set(analysis);

    if (analysis.action === 'freeze_and_hitl') {
      const flagsText = [
        ...analysis.metrics.timing.flags,
        ...analysis.metrics.stylometry.flags,
        ...analysis.metrics.access.flags
      ].join(' · ');

      this.dataService.addHITLTask({
        id: 'hitl-bio-' + Date.now(),
        clientName: profile.name,
        clientSegment: profile.segment,
        agentName: 'Guardián Biométrico',
        taskType: 'Bloqueo Biométrico',
        description: `OTP Invisible Fallido: Alerta de suplantación crítica detectada en el canal ${channel}.`,
        originalValue: 'Acceso Permitido',
        proposedValue: 'Congelar Cuenta & Desbloqueo HITL',
        confidence: Math.round(100 - analysis.trust_score),
        status: 'pending',
        timeAgo: 'Hace un momento',
        ragDocUsed: 'Política de Autenticación Continua v1.1',
        userSpeechAudio: false,
        transcriptDialog: `Mensaje sospechoso: "${userMessage}"\n\nMétricas de Anomalía:\n- Confianza/Riesgo: ${100 - analysis.trust_score}%\n- Cadencia: ${analysis.metrics.timing.wpm} WPM (Tiempo: ${analysis.metrics.timing.response_delay_sec}s)\n- Estilometría: All Caps: ${analysis.metrics.stylometry.all_caps}, Jergas: ${analysis.metrics.stylometry.slang_count}, Emojis: ${analysis.metrics.stylometry.emoji_pattern}\n- Hora Acceso: ${analysis.metrics.access.simulated_hour} (Inusual: ${analysis.metrics.access.is_unusual_hour})\n\nAlertas: ${flagsText}`
      });

      const blockText = `⚠️ **[ALERTA DE SEGURIDAD BANCARIA]** ⚠️\n\nHemos detectado un comportamiento inusual y no compatible con su patrón histórico de interacción (cadencia de escritura, horario y estilo estilométrico).\n\nPor su seguridad y de acuerdo a nuestras políticas de **Autenticación Continua Invisible**, hemos **congelado preventivamente** el acceso a datos sensibles y transacciones en este chat.\n\nUn supervisor de Banco Serfinanza está verificando este incidente. El servicio se reactivará una vez finalizada la auditoría.`;
      
      this.isTyping.set(false);
      return {
        role: 'assistant',
        content: blockText,
        timestamp: new Date(),
        isTechnical: profile.isAdvisor
      };
    }

    // High fidelity fallback response generator based on inputs
    let fallbackResponse = this.generateFallbackResponse(userMessage, profile, channel, noButtons);
    // Post-process with Vecino Olímpica benefit
    fallbackResponse = this.appendVecinoOlimpicaBenefit(fallbackResponse, profile);
    const parsed = this.parseResponse(fallbackResponse);

    this.isTyping.set(false);
    return {
      role: 'assistant',
      content: parsed.content,
      buttons: noButtons ? undefined : parsed.buttons,
      timestamp: new Date(),
      isTechnical: profile.isAdvisor,
    };
  }

  public analyzeMessageLocal(
    message: string, 
    clientId: string,
    wpm: number,
    delay: number,
    hour: string
  ): any {
    const msgLower = message.toLowerCase();
    const msgLen = message.length;
    const words = message.split(/\s+/);
    const wordCount = words.length;

    // Slangs
    const IMPOSTOR_SLANG = [
      "parce", "bro", "luca", "marica", "tumbo", "perro", "nea", "lucas",
      "palos", "gonorrea", "pana", "quiubo", "brayan", "webón", "guevon",
      "palo", "fast", "rapido", "ya", "ahora", "dame", "clave", "corta", 
      "tumbar", "cuenta", "transferir ya", "pasa la plata", "transfiere"
    ];

    // Courtesy
    const SENIOR_COURTESY = [
      "hola mijo", "mijo", "señor", "por favor", "bendición", "gracias", 
      "su mercé", "linda", "lindo", "amable", "buenas tardes", "buenos días",
      "dios le pague", "dios te bendiga", "casita", "hijito", "ayudaría"
    ];

    // Senior emojis
    const SENIOR_EMOJIS = ["😊", "👵", "🙏", "❤️", "💙", "🌸", "👍", "😍"];

    // 1. Timing
    let timingStatus = 'normal';
    const timingFlags: string[] = [];
    if (clientId === 'maria') {
      if (wpm > 350) {
        timingStatus = 'anomaly';
        timingFlags.push(`Cadencia de escritura extremadamente rápida (${wpm} WPM) para adulto mayor.`);
      }
      if (delay < 4.0) {
        timingStatus = 'anomaly';
        timingFlags.push(`Tiempo de respuesta inusualmente corto (${delay}s). Posible bot o impostor.`);
      }
    } else {
      if (wpm > 550) {
        timingStatus = 'anomaly';
        timingFlags.push(`Cadencia robótica de escritura (${wpm} WPM).`);
      }
    }

    // 2. Stylometry
    let stylometryStatus = 'normal';
    const stylometryFlags: string[] = [];
    
    // All caps
    let upperCount = 0;
    for (let i = 0; i < message.length; i++) {
      if (message[i] !== message[i].toLowerCase() && message[i] === message[i].toUpperCase()) {
        upperCount++;
      }
    }
    const uppercaseRatio = msgLen > 0 ? upperCount / msgLen : 0;
    const isAllCaps = uppercaseRatio > 0.65 && msgLen > 8;
    if (isAllCaps) {
      stylometryFlags.push("Uso de mayúsculas sostenidas (gritado/urgencia).");
      stylometryStatus = 'anomaly';
    }

    // Slang matches
    const slangMatches = IMPOSTOR_SLANG.filter(sl => msgLower.includes(sl));

    // Emojis
    let hasSeniorEmojis = SENIOR_EMOJIS.some(em => message.includes(em));
    // Any emojis
    const emojiRegex = /[\u2600-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g;
    const allEmojis = message.match(emojiRegex) || [];
    let emojiPattern = 'none';
    if (allEmojis.length > 0) {
      emojiPattern = hasSeniorEmojis ? 'senior' : 'youth';
    }

    const hasEllipses = message.includes('...') || message.includes('..');
    
    // Tildes count
    let tildesCount = 0;
    const tildesList = ['á', 'é', 'í', 'ó', 'ú'];
    for (let c of msgLower) {
      if (tildesList.includes(c)) tildesCount++;
    }

    const courtesyMatches = SENIOR_COURTESY.filter(c => msgLower.includes(c));

    if (clientId === 'maria') {
      if (slangMatches.length > 0) {
        stylometryStatus = 'anomaly';
        stylometryFlags.push(`Jerga no compatible detectada: ${slangMatches.join(', ')}.`);
      }
      if (allEmojis.length === 0 && courtesyMatches.length === 0 && wordCount > 6) {
        stylometryFlags.push("Ausencia total de modales de cortesía o emojis característicos.");
        if (wpm > 250) {
          stylometryStatus = 'anomaly';
        }
      }
    }

    // Youth abbreviations
    const youthAbbreviations = [" pq ", " xq ", " d ", " k ", " tb ", " tmb ", " grax ", " bn "];
    const abbrMatches = youthAbbreviations.filter(ab => (" " + msgLower + " ").includes(ab));
    if (clientId === 'maria' && abbrMatches.length > 0) {
      stylometryStatus = 'anomaly';
      stylometryFlags.push(`Uso de abreviaciones juveniles agresivas: ${abbrMatches.map(a=>a.trim()).join(', ')}.`);
    }

    // 3. Access
    let accessStatus = 'normal';
    const accessFlags: string[] = [];
    const hourInt = parseInt(hour.split(':')[0]) || 16;
    const isUnusualHour = hourInt >= 23 || hourInt <= 4;
    if (clientId === 'maria' && isUnusualHour) {
      accessStatus = 'anomaly';
      accessFlags.push(`Acceso inusual a altas horas de la noche (${hour} AM).`);
    }

    let tone = 'neutral';
    if (courtesyMatches.length > 0) {
      tone = 'friendly';
    } else if (slangMatches.length > 0 || isAllCaps) {
      tone = 'slang/aggressive';
    }

    if (clientId === 'maria' && tone === 'slang/aggressive') {
      accessStatus = 'anomaly';
      accessFlags.push("Tono de comunicación hostil, imperativo o informal incompatible con el perfil.");
    }

    // 4. Trust score
    let trustScore = 100;
    if (clientId === 'maria') {
      if (timingStatus === 'anomaly') trustScore -= 25;
      if (accessStatus === 'anomaly') trustScore -= 25;
      if (stylometryStatus === 'anomaly') trustScore -= 40;
      if (slangMatches.length > 0) trustScore -= 20;
      if (isAllCaps) trustScore -= 15;
      if (isUnusualHour) trustScore -= 15;
      if (courtesyMatches.length > 0) trustScore += 15;
      if (hasSeniorEmojis) trustScore += 10;
    } else {
      if (timingStatus === 'anomaly') trustScore -= 20;
      if (isAllCaps) trustScore -= 20;
      if (slangMatches.length > 4) trustScore -= 15;
    }
    trustScore = Math.max(0, Math.min(100, trustScore));

    let action = 'allow';
    let freezeReason = '';
    if (clientId === 'maria' && trustScore < 50) {
      action = 'freeze_and_hitl';
      freezeReason = 'OTP Invisible Fallido: Anomalía crítica en cadencia, estilometría y horario de acceso.';
    }

    return {
      client_id: clientId,
      message_analyzed: message,
      trust_score: trustScore,
      action: action,
      freeze_reason: freezeReason,
      metrics: {
        timing: { wpm, response_delay_sec: delay, status: timingStatus, flags: timingFlags },
        stylometry: { all_caps: isAllCaps, slang_count: slangMatches.length, emoji_pattern: emojiPattern, ellipses_present: hasEllipses, tildes_count: tildesCount, courtesy_detected: courtesyMatches.length > 0, status: stylometryStatus, flags: stylometryFlags },
        access: { simulated_hour: hour, is_unusual_hour: isUnusualHour, tone, status: accessStatus, flags: accessFlags }
      }
    };
  }

  // Resilient Local NLP Brain with beautiful Colombian Spanish answers tailored to the hackathon presentation script
  private generateFallbackResponse(query: string, profile: ClientProfile, channel: string, noButtons: boolean = false): string {
    const q = query.toLowerCase();

    // 1. ADULTO MAYOR: María Amparo Gutiérrez (WhatsApp)
    if (profile.id === 'maria') {
      if (q.includes('pañal') || q.includes('nieto') || q.includes('mijo') || q.includes('miso') || q.includes('pasó') || q.includes('paso') || q.includes('olimpica') || q.includes('olímpica')) {
        return `¡Hola mi señora María Amparo! Qué alegría saludarla hoy. 💙 No se me preocupe por nada, que aquí estoy para servirle con todo el cariño del mundo. ¡Esos nietecitos consentidos son la alegría de la casa y merecen lo mejor! 👶✨

Ya mismo revisé con toda la paciencia su **Tarjeta Olímpica Serfinanza** y le tengo una hermosa noticia: su compra de los pañales en la Olímpica por un valor de **$87,000 COP** pasó perfectamente y ya está registrada en nuestro sistema seguro. ¡Todo salió muy bien!

Para su total tranquilidad, el saldo que le queda libre en su tarjeta es de **$4,500,000 COP** para que siga comprando lo que necesite, y en su Cuenta de Ahorros tiene guardados **$1,847,320 COP** completitos.

¿Le gustaría que le ayude a ver algún otro movimiento de sus cuentas, o prefiere que la comunique con uno de nuestros asesores de confianza para charlar más despacio y con calma, mi señora linda?
[BOTONES: Consultar saldo | Ofertas Olimpica | Hablar con un asesor]`;
      }

      if (q.includes('saldo')) {
        return `Hola Sra. María Amparo. Con gusto le informo que el saldo de su Cuenta de Ahorros es de **$1,847,320 COP** 💰.

Recuerde que hoy es *Miércoles de Plaza* en Olímpica. Si paga con su **Tarjeta Olímpica Serfinanza**, ¡le darán el 30% de descuento en sus verduras! 🥦🍌

¿Le gustaría ver las ofertas de hoy?
[BOTONES: Ofertas Olimpica | Beneficios SuperCDT | Hablar con un asesor]`;
      }
      
      if (q.includes('oferta') || q.includes('miércoles') || q.includes('viernes') || q.includes('plaza') || q.includes('carnes') || q.includes('madrugón') || q.includes('sábado')) {
        return `¡Claro que sí! Estas son las ofertas de la semana para usted en Olímpica:

🥦 **Miércoles de Plaza (Hoy):** Yuca $1,200/kg, Plátano 3x$2,500 y Aguacate 2x$5,000.
🥩 **Viernes de Carnes:** Pollo entero a $8,900/kg y lomo de res a $24,500/kg.
🧴 **Dermocosmética:** 2x1 en cremas Pond's y Nivea.

Todo esto pagando con su **Tarjeta Olímpica Serfinanza** para obtener el máximo ahorro. 😉
[BOTONES: Consultar saldo | Beneficios SuperCDT | Salir]`;
      }

      if (q.includes('cdt') || q.includes('supercdt') || q.includes('inver')) {
        return `Sra. María, su inversión actual en **SuperCDT** es de **$5,200,000 COP** con una excelente tasa del **12.5% E.A.** 📈
Su vencimiento es el próximo **15 de agosto de 2026**.

Es una forma muy segura de hacer crecer sus ahorros sin ningún riesgo. ¡La felicitamos por esta gran decisión! 😊
[BOTONES: Consultar saldo | Ofertas Olimpica | Hablar con un asesor]`;
      }

      if (q.includes('pago') || q.includes('fecha') || q.includes('tarjeta') || q.includes('cupo')) {
        return `Sra. María Amparo, el cupo de su Tarjeta Olímpica es de **$4,500,000 COP** disponible.
La próxima fecha límite de pago es el **5 de junio de 2026** y su pago mínimo es de **$68,400 COP**.

¿Desea que le explique cómo pagarla de forma fácil?
[BOTONES: Cómo pagar tarjeta | Consultar saldo | Salir]`;
      }

      if (q.includes('extracto') || q.includes('mes')) {
        return `Sra. María, su extracto digital de este mes ya está listo. Para proteger sus datos personales (Habeas Data), se lo enviamos directamente a su correo electrónico registrado.

¿Desea que un asesor la guíe paso a paso para abrirlo?
[BOTONES: Guía para extracto | Consultar saldo | Hablar con un asesor]`;
      }

      if (q.includes('actuali') || q.includes('datos')) {
        return `Para actualizar sus datos de forma segura, no necesita ir a la oficina. Puede dictarle a nuestro asesor por este chat telefónico su nueva dirección y teléfono de contacto en Cali.

¿Quiere que la comunique con un asesor de inmediato?
[BOTONES: Sí, comunicar | Ofertas Olimpica | Salir]`;
      }

      // Default senior response
      return `Hola Sra. María Amparo, soy Ser, su asistente de Banco Serfinanza. Me alegra mucho saludarla. 💙

Dígame con palabras sencillas cómo le puedo colaborar hoy. Estoy aquí para ayudarle con sus saldos, su tarjeta o sus ofertas.
[BOTONES: Consultar saldo | Ofertas Olimpica | Beneficios SuperCDT]`;
    }

    // 2. DIGITAL ACTIVO: Carlos Herrera Díaz (Telegram)
    if (profile.id === 'carlos') {
      if (q.includes('saldo')) {
        return `¡Hola Carlos! Tu Cuenta de Ahorros Serfinanza cuenta con un saldo de **$1,847,320 COP**. 💳

Adicionalmente, te informo que tu Tarjeta de Crédito tiene un cupo disponible de **$4,500,000 COP** de un cupo total de $5,000,000 COP. Próxima fecha límite de pago: **5 de Junio de 2026** (Pago mínimo: $68,400).

¿Quieres ver tus últimos movimientos o ver ofertas de la Tarjeta Olímpica?
[BOTONES: Movimientos recientes | Beneficios SuperCDT | Ofertas Olimpica]`;
      }

      if (q.includes('cdt') || q.includes('supercdt') || q.includes('beneficios') || q.includes('inver')) {
        return `¡Excelente momento para invertir, Carlos! 🚀
Tienes activo un **SuperCDT por $5,200,000 COP** rentando a una tasa super preferencial del **12.5% E.A.** con vencimiento el **15 de agosto de 2026**.

**¿Por qué es el mejor CDT del mercado?**
1. Tasa garantizada del 12.5% E.A., muy superior a la inflación.
2. Respaldo total del Banco Serfinanza y seguro de depósito FOGAFIN.
3. Puedes simular incrementos desde $1,000,000 adicionales desde la App.

¿Te interesaría simular una nueva inversión o ver tu extracto?
[BOTONES: Simular inversión | Extracto mes | Ofertas Olimpica]`;
      }

      if (q.includes('oferta') || q.includes('miércoles') || q.includes('viernes') || q.includes('plaza') || q.includes('carnes') || q.includes('madrugón') || q.includes('sábado')) {
        return `¡Carlos, aprovecha los súper descuentos de esta semana en Olímpica pagando con tu Tarjeta de Crédito Serfinanza! 🛒🔥

🍅 **Miércoles de Plaza (Hoy):** Yuca $1,200/kg · Plátano 3x$2,500 · Tomate $1,800/kg.
🥩 **Viernes de Carnes:** Pollo entero $8,900/kg · Lomo de res $24,500/kg.
⚡ **Sábado Madrugón (4am-9am):** **30% de descuento** directo en electrodomésticos seleccionados.
🧴 **Dermocosméticos:** 2x1 en marcas seleccionadas Pond's y Nivea.

¿Quieres realizar el pago de tu Tarjeta para liberar cupo y comprar el sábado?
[BOTONES: Pagar Tarjeta | Consultar saldo | Movimientos recientes]`;
      }

      if (q.includes('pago') || q.includes('fecha') || q.includes('tarjeta')) {
        return `Carlos, los datos de pago para tu Tarjeta de Crédito son:
• **Cupo Disponible:** $4,500,000 COP
• **Próxima Fecha de Pago:** 5 de Junio de 2026
• **Pago Mínimo:** $68,400 COP
• **Último Movimiento:** Compra Olímpica por $87,000 el 21 de mayo.

Puedes realizar tu pago al instante a través de PSE en nuestra Banca Virtual o directamente por este chat escribiendo "Pagar".
[BOTONES: Pagar por PSE | Movimientos recientes | Beneficios SuperCDT]`;
      }

      if (q.includes('extracto') || q.includes('mes')) {
        return `Tu extracto del mes está disponible en formato PDF seguro. Lo hemos enviado encriptado a tu correo. Para abrirlo, la contraseña corresponde a tu número de documento de identidad.

¿Quieres que te envíe un resumen de tus últimos movimientos de cuenta de ahorros?
[BOTONES: Movimientos recientes | Consultar saldo | Salir]`;
      }

      if (q.includes('actuali') || q.includes('datos')) {
        return `Actualizar tus datos es súper rápido, Carlos. Solo necesitamos confirmar si tu dirección de domicilio en Barranquilla sigue siendo la misma. Puedes autogestionarlo en 2 minutos a través de nuestro portal web seguro.

¿Quieres recibir el link directo para actualización?
[BOTONES: Link de actualización | Consultar saldo | Salir]`;
      }

      // Default digital response
      return `¡Hola Carlos! Soy Ser, tu asesor digital de Banco Serfinanza. ⚡
Estoy listo para ayudarte a gestionar tus finanzas. ¿Qué operación o consulta deseas realizar hoy?
[BOTONES: Consultar saldo | Beneficios SuperCDT | Ofertas Olimpica]`;
    }

    // 3. ASESOR INTERNO: Juliana Mora (CenterCall / Copilot Mode)
    if (profile.isAdvisor) {
      if (q.includes('actuali') || q.includes('datos') || q.includes('pregunta por actual')) {
        return `⚠️ **SOPORTE AL ASESOR - PROCESO: ACTUALIZACIÓN DE DATOS (HABEAS DATA)** ⚠️

**Segmento:** Adulto Mayor 50+ (Cliente María Amparo)
**Instrucciones sugeridas para el Asesor:**
1. **Validación:** Confirmar identidad verbalmente (Cédula de Cali, última transacción en Olímpica por $87k).
2. **Captura:** Ingresar a la consola CRM Salesforce > Módulo Información de Contacto.
3. **Confirmación:** Registrar Dirección de Domicilio y Celular.
4. **Habeas Data:** Indicar el script regulatorio obligatorio de autorización de uso de datos.
5. **Cierre:** Generar radicado automático. El sistema sincronizará la base de datos central en 10 min.

*Tip Comercial:* Al finalizar, coméntale sobre el **SuperCDT al 12.5% E.A.** ya que tiene saldo alto en cuenta de ahorros ($1.8M+) y califica para esta oferta personalizada.
[BOTONES: Abrir CRM Salesforce | Generar Radicado | Simulador SuperCDT]`;
      }

      if (q.includes('saldo')) {
        return `📊 **COPILOTO DE SERVICIO - FICHA DE CLIENTE 360**
• **Cliente:** María Amparo Gutiérrez (Cali)
• **Saldo Ahorros:** $1,847,320 COP
• **Cupo Tarjeta Crédito:** $4,500,000 / $5,000,000 COP
• **CDT Activo:** $5,200,000 (Vence 15-Ago-2026, Tasa 12.5% E.A.)

**Sugerencia de Campaña Comercial:**
El cliente califica para campaña de *Incremento de Cupo de Tarjeta* o *Campaña de Fidelización de CDT* con tasa preferencial del 13.0% E.A. si realiza renovación automática.
[BOTONES: Oferta Incremento Cupo | Oferta Renovación CDT | Ver Scoring CRM]`;
      }

      if (q.includes('cdt') || q.includes('supercdt') || q.includes('beneficios')) {
        return `🔎 **FICHA DE PORTAFOLIO - SUPERCDT SERFINANZA**
• **Rentabilidad Máxima:** 12.5% E.A. para plazos a 360 días.
• **Monto Mínimo de Apertura:** $1,000,000 COP.
• **Calificación de Riesgo:** AAA (Máxima calificación, alta seguridad).
• **Beneficio Clave:** Exento de retención en la fuente si se pacta bajo condiciones especiales de fomento, sujeto a políticas de la entidad.

**Para María Amparo (Adulto Mayor):** Resalta la seguridad de la inversión, el pago de intereses mensualizado a su cuenta de ahorros, y que no requiere manejo digital complejo.
[BOTONES: Simular 12.5% E.A. | Ficha de Producto | Normativa FOGAFIN]`;
      }

      if (q.includes('oferta') || q.includes('miércoles') || q.includes('viernes') || q.includes('plaza') || q.includes('carnes') || q.includes('madrugón') || q.includes('sábado')) {
        return `🛒 **MÓDULO DE INTEGRACIÓN RETAIL - OLÍMPICA CO-BRANDING**
• **Tarjeta Olímpica Serfinanza:** Descuento directo exclusivo del 30% en frutas/verduras (Miércoles de Plaza) y 25% en carnes (Viernes de Carnes).
• **Impacto en Compras:** Incrementa ticket promedio en 35% y vinculación de cuenta de ahorros en 18%.
• **Estado del Sync:** Catálogo actualizado hoy 04:00 AM. Próximo sync automático en 24h.

**Instrucción de venta:** Recuerde al asesor invitar al cliente a pagar en cajas Olímpica con la Tarjeta de Crédito Serfinanza para acumular Súper Puntos dobles.
[BOTONES: Consultar Catálogo | Generar Cupón Descuento | Ver Beneficios Tarjeta]`;
      }

      // Default advisor response
      return `🔧 **COPILOTO DE ASESOR SERFINANZA - ACTIVO**
Bienvenida Juliana. Estoy analizando la conversación del cliente en tiempo real. 
Escribe su consulta o selecciona una acción rápida para sugerirte el script comercial perfecto y los enlaces del sistema operativo.
[BOTONES: Ficha del Cliente | Guías Operativas | Catálogo Olímpica]`;
    }

    // Default general response
    return `Hola, gracias por comunicarte con **Banco Serfinanza**. Soy **Ser**, tu asistente virtual 360.
¿En qué puedo ayudarte hoy respecto a tus cuentas, tarjetas, CDT o los beneficios exclusivos en Olímpica?
[BOTONES: Consultar saldo | Ofertas Olimpica | Beneficios SuperCDT]`;
  }
}
