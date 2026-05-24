import { Injectable, signal } from '@angular/core';
import { ClientProfile } from './mock-data.service';

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
  // Signals for state
  public isTyping = signal<boolean>(false);
  public apiKey = signal<string>(localStorage.getItem('claude_api_key') || '');
  public forceFallback = signal<boolean>(false);

  constructor() {}

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

REGLAS CRÍTICAS DE NEGOCIO:
1. Para adultos mayores (50+): respuestas CORTAS, sin tecnicismos, máximo 3 pasos, emojis simples.
2. Para usuarios digitales: puedes dar más detalle y ofrecer productos adicionales.
3. Para asesor interno (Juliana Mora): usa terminología técnica bancaria, muestra datos de scoring y segmento, no saludes como a cliente.
4. SIEMPRE ofrece el beneficio de la Tarjeta Olimpica Serfinanza cuando sea relevante.
5. Si el cliente muestra frustración, ofrece conectar con un asesor humano.
6. Responde SOLO en español.
7. Máximo 150 palabras por respuesta en canal WhatsApp/Telegram.
${noButtons ? '8. Responde ÚNICAMENTE en lenguaje natural libre y conversacional. NO agregues bajo ninguna circunstancia botones ni formatos de botones como "[BOTONES: ...]". Tampoco ofrezcas opciones numeradas como si fuesen botones.' : '8. Al final de cada respuesta relevante, añade de 2 a 3 botones de acción sugeridos exactamente en este formato:\n   [BOTONES: opción1 | opción2 | opción3]'}
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

    // If key exists and we are not forcing fallback, try live Claude API
    if (key && !this.forceFallback()) {
      try {
        // Format history for Anthropic API
        const formattedMessages = history.map((msg) => ({
          role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: msg.content,
        }));

        // Append current message
        formattedMessages.push({
          role: 'user',
          content: userMessage,
        });

        // WARNING: Browser standard direct call to Anthropic API usually fails due to CORS unless a browser extension or a local proxy is active.
        // We configure headers as requested by the Claude direct call setup
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'dangerously-allow-browser': 'true', // included in headers just in case of client libraries, though standard HTTP requires proxy/CORS support
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022', // Standard Claude Sonnet model code
            max_tokens: 1000,
            system: systemPrompt,
            messages: formattedMessages,
          }),
        });

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.content[0].text;
        const parsed = this.parseResponse(responseText);

        this.isTyping.set(false);
        return {
          role: 'assistant',
          content: parsed.content,
          buttons: noButtons ? undefined : parsed.buttons,
          timestamp: new Date(),
          isTechnical: profile.isAdvisor,
        };
      } catch (err) {
        console.warn('API call failed or CORS restriction. Falling back to Local Brain.', err);
        // Silently continue to high-fidelity mock fallback to keep presentation running
      }
    }

    // High fidelity fallback response generator based on inputs
    const fallbackResponse = this.generateFallbackResponse(userMessage, profile, channel, noButtons);
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

  // Resilient Local NLP Brain with beautiful Colombian Spanish answers tailored to the hackathon presentation script
  private generateFallbackResponse(query: string, profile: ClientProfile, channel: string, noButtons: boolean = false): string {
    const q = query.toLowerCase();

    // 1. ADULTO MAYOR: María Amparo Gutiérrez (WhatsApp)
    if (profile.id === 'maria') {
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
