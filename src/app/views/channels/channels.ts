import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Channel {
  id: string;
  name: string;
  icon: string;
  status: 'live' | 'beta' | 'planned';
  metric: string;
  uptime?: string;
  sparklineData?: number[];
  isActive: boolean;
}

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channels.html',
})
export class ChannelsComponent {
  protected readonly Math = Math;

  // 12 channels list
  protected readonly channels = signal<Channel[]>([
    { id: 'wa', name: 'WhatsApp Business', icon: '💬', status: 'live', metric: '847 msg/h', uptime: '99.8%', sparklineData: [45, 52, 49, 62, 58, 65, 80, 85, 78, 88, 92, 84, 87, 81, 75, 86, 95, 102, 98, 105, 94, 88, 85, 87], isActive: true },
    { id: 'whatchimp', name: 'WhatChimp WhatsApp', icon: '🐒', status: 'live', metric: '625 msg/h', uptime: '99.9%', sparklineData: [50, 48, 55, 60, 58, 64, 70, 72, 68, 75, 80, 85, 88, 82, 79, 81, 86, 90, 88, 92, 85, 80, 76, 78], isActive: true },
    { id: 'twilio', name: 'Twilio WhatsApp', icon: '🔴', status: 'live', metric: '412 msg/h', uptime: '99.9%', sparklineData: [30, 32, 28, 40, 35, 45, 48, 50, 42, 38, 45, 52, 58, 60, 52, 48, 55, 62, 59, 63, 58, 50, 48, 49], isActive: true },
    { id: 'infobip', name: 'Infobip WhatsApp', icon: '⚡', status: 'live', metric: '184 msg/h', uptime: '99.7%', sparklineData: [12, 18, 15, 20, 22, 25, 28, 26, 32, 35, 30, 38, 40, 36, 34, 30, 35, 42, 39, 41, 38, 30, 28, 29], isActive: false },
    { id: 'tg', name: 'Telegram Bot', icon: '✈️', status: 'live', metric: '234 msg/h', uptime: '99.1%', sparklineData: [20, 25, 22, 28, 30, 26, 35, 42, 38, 45, 41, 48, 50, 47, 43, 39, 44, 48, 52, 49, 45, 38, 35, 36], isActive: true },
    { id: 'web', name: 'Web Chat', icon: '🌐', status: 'live', metric: '189 msg/h', uptime: '99.9%', sparklineData: [15, 18, 12, 22, 25, 29, 32, 30, 36, 40, 38, 44, 48, 42, 38, 35, 41, 46, 43, 39, 35, 28, 25, 26], isActive: true },
    { id: 'cc', name: 'CenterCall Copilot', icon: '📞', status: 'live', metric: '42 sec. activas', uptime: '100%', sparklineData: [5, 8, 12, 18, 22, 20, 25, 32, 28, 35, 30, 38, 40, 35, 32, 28, 34, 38, 42, 39, 35, 28, 20, 18], isActive: true },
    
    { id: 'ig', name: 'Instagram Messaging', icon: '📷', status: 'beta', metric: '51 msg/h', isActive: false },
    { id: 'email', name: 'Email AI', icon: '📧', status: 'beta', metric: 'Auto-respuesta activa', isActive: true },
    { id: 'sms', name: 'SMS / RCS', icon: '📱', status: 'beta', metric: 'Solo salida', isActive: true },
    
    { id: 'slack', name: 'Slack Interno', icon: '🤖', status: 'planned', metric: 'Próximamente', isActive: false },
    { id: 'ivr', name: 'IVR Voice AI', icon: '🎙️', status: 'planned', metric: 'Próximamente', isActive: false },
    { id: 'smarttv', name: 'Smart TV App', icon: '📺', status: 'planned', metric: 'Próximamente', isActive: false },
  ]);

  // Drawer / Side-over configuration state
  protected isDrawerOpen = signal<boolean>(false);
  protected selectedChannel = signal<Channel | null>(null);

  // Form states for configuration
  protected webhookUrl = '';
  protected apiToken = '';
  protected templateText = '';
  protected testPhoneNumber = '';
  protected testSuccessMessage = signal<string | null>(null);

  // WhatsApp Cloud API states
  protected cloudPhoneId = '';
  protected cloudAccountId = '';
  protected cloudAccessToken = '';

  // Twilio states
  protected twilioAccountSid = '';
  protected twilioAuthToken = '';
  protected twilioSender = 'whatsapp:+14155238886';
  protected twilioContentSid = '';
  protected twilioContentVariables = '{"1":"12/1","2":"3pm"}';

  // Infobip states
  protected infobipApiKey = '';
  protected infobipBaseUrl = '';
  protected infobipSender = '';

  // WhatChimp states
  protected whatchimpApiKey = '';
  protected whatchimpPhoneId = '';
  protected whatchimpSenderNumber = '+57 304 334 4722';
  protected whatchimpTemplateNamespace = 'whatchimp_auto_marketing_2026';
  protected whatchimpSyncMeta = true;
  protected whatchimpMarkupFee = '0% (Directo a Meta)';

  // ElevenLabs states
  protected elevenlabsApiKey = 'el_sk_08fa1947bde78cd90217a94ef...';
  protected elevenlabsVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel / Asesor Serfinanza
  protected elevenlabsModelId = 'eleven_multilingual_v2';
  protected elevenlabsStability = 0.75;
  protected elevenlabsSimilarity = 0.85;
  protected elevenlabsLatency = 0;

  // Sparkline builder helper
  protected getSparklinePath(data?: number[]): string {
    if (!data || data.length === 0) return '';
    const width = 120;
    const height = 30;
    const padding = 2;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((val, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((val - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }

  // Open config drawer
  protected openConfig(channel: Channel) {
    this.selectedChannel.set(channel);
    this.webhookUrl = `https://api.serfinanza.co/v1/webhooks/agente360/${channel.id}`;
    
    if (channel.id === 'wa') {
      this.apiToken = '';
      this.testPhoneNumber = '+57 300 123 4567';
    } else if (channel.id === 'twilio') {
      this.apiToken = this.twilioAccountSid;
      this.testPhoneNumber = '+57 301 754 1994';
    } else if (channel.id === 'infobip') {
      this.apiToken = this.infobipApiKey;
      this.testPhoneNumber = '+57 322 456 7890';
    } else if (channel.id === 'whatchimp') {
      this.apiToken = this.whatchimpApiKey;
      this.testPhoneNumber = '573043344722';
    } else if (channel.id === 'cc') {
      this.apiToken = this.elevenlabsApiKey;
      this.testPhoneNumber = 'Asesor Interno';
    } else {
      this.apiToken = '';
      this.testPhoneNumber = '';
    }

    this.templateText = `Hola {{nombre}}, bienvenido a Banco Serfinanza. Te confirmamos que tu saldo actual en cuenta de ahorros es {{saldo}} COP. ¿Deseas realizar alguna otra consulta?`;
    this.testSuccessMessage.set(null);
    this.isDrawerOpen.set(true);
  }

  // Close config drawer
  protected closeDrawer() {
    this.isDrawerOpen.set(false);
  }

  // Toggle active/pause channel status
  protected toggleChannel(channel: Channel) {
    this.channels.update((items) =>
      items.map((item) => (item.id === channel.id ? { ...item, isActive: !item.isActive } : item))
    );
  }

  // Activate beta channel
  protected activateBeta(channel: Channel) {
    this.channels.update((items) =>
      items.map((item) => (item.id === channel.id ? { ...item, status: 'live', isActive: true, uptime: '99.9%', sparklineData: [5, 10, 15, 20, 25, 30, 25, 20, 25, 30, 35, 40, 45, 50, 45, 40, 35, 40, 45, 50, 45, 40, 35, 38] } : item))
    );
  }

  // Test message send simulation
  protected sendTestMessage() {
    if (!this.testPhoneNumber) return;
    
    const channelId = this.selectedChannel()?.id;
    if (channelId === 'twilio') {
      this.testSuccessMessage.set('⏳ Procesando solicitud con Twilio API Gateway...');
    } else if (channelId === 'whatchimp') {
      this.testSuccessMessage.set('⏳ Desencadenando plantilla WhatChimp a través de Meta WhatsApp Cloud API (0% markup)...');
    } else if (channelId === 'cc') {
      this.testSuccessMessage.set('⏳ Conectando con ElevenLabs WebSocket y sintetizando audio de prueba para CenterCall Copilot...');
    } else {
      this.testSuccessMessage.set(`⏳ Enviando mensaje de prueba a través de ${this.selectedChannel()?.name}...`);
    }
    
    setTimeout(() => {
      if (channelId === 'twilio') {
        const fakeMessageSid = 'SM' + Math.random().toString(36).substring(2, 17).toUpperCase() + Math.random().toString(36).substring(2, 17).toUpperCase();
        this.testSuccessMessage.set(
          `✅ [Twilio API] Petición procesada exitosamente (HTTP 201 Created)\n\n` +
          `• Message SID: ${fakeMessageSid}\n` +
          `• Status: Queued (Encolado)\n` +
          `• Account SID: ${this.twilioAccountSid}\n` +
          `• Remitente (From): ${this.twilioSender}\n` +
          `• Destinatario (To): whatsapp:${this.testPhoneNumber.replace(/\s+/g, '')}\n` +
          `• Content SID: ${this.twilioContentSid}\n` +
          `• Content Variables: ${this.twilioContentVariables}\n\n` +
          `El mensaje ha sido programado para entrega a través del sandbox de WhatsApp.`
        );
      } else if (channelId === 'whatchimp') {
        const url = 'https://app.whatchimp.com/api/v1/whatsapp/send';
        const formData = new URLSearchParams();
        formData.append('apiToken', this.whatchimpApiKey);
        formData.append('phone_number_id', this.whatchimpPhoneId);
        
        const cleanPhone = this.testPhoneNumber.replace(/\s+/g, '').replace('+', '');
        formData.append('phone_number', cleanPhone);
        
        const finalMessage = this.templateText
          .replace('{{nombre}}', 'William Fernando')
          .replace('{{saldo}}', '$1.250.000');
        formData.append('message', finalMessage);

        fetch(url, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        .then(response => response.json())
        .then(data => {
          console.log("Respuesta real de WhatChimp:", data);
          if (data.status === 'success' || data.success || (data.message && data.message.toLowerCase().includes('success')) || !data.error) {
            this.testSuccessMessage.set(
              `✅ [WhatChimp API Real] ¡Mensaje enviado exitosamente a tu celular!\n\n` +
              `• ID de Mensaje WhatChimp: ${data.message_id || 'wc_msg_' + Math.random().toString(36).substring(2, 10)}\n` +
              `• Remitente (Phone ID): ${this.whatchimpPhoneId}\n` +
              `• Destinatario: whatsapp:${cleanPhone}\n` +
              `• Costo: 0% Markup (Tarifa oficial de Meta)\n` +
              `• Mensaje enviado: "${finalMessage}"\n\n` +
              `¡Verifica tu WhatsApp! El mensaje ya ha sido despachado por WhatChimp.`
            );
          } else {
            this.testSuccessMessage.set(
              `⚠️ [WhatChimp API] El servidor respondió con un error:\n\n` +
              `• Código/Error: ${data.error || 'Desconocido'}\n` +
              `• Mensaje: ${data.message || JSON.stringify(data)}`
            );
          }
        })
        .catch(err => {
          console.error("Error al conectar con la API de WhatChimp:", err);
          this.testSuccessMessage.set(
            `❌ [WhatChimp Error] No se pudo establecer conexión con el endpoint:\n\n` +
            `${err.message || err}`
          );
        });
      } else if (channelId === 'cc') {
        this.testSuccessMessage.set(
          `✅ [ElevenLabs Voice API] ¡Audio de voz sintetizado con éxito!\n\n` +
          `• Voice ID: ${this.elevenlabsVoiceId}\n` +
          `• Model: ${this.elevenlabsModelId}\n` +
          `• Estabilidad (Stability): ${Math.round(this.elevenlabsStability * 100)}%\n` +
          `• Claridad (Similarity Boost): ${Math.round(this.elevenlabsSimilarity * 100)}%\n` +
          `• Latencia de Stream: ~180ms (Optimizada)\n` +
          `• Formato de Salida: Audio Stream (MP3 44.1kHz, 128kbps, Mono)\n\n` +
          `El flujo de síntesis de voz se encuentra plenamente sincronizado con CenterCall Copilot. Los scripts de respuesta del asesor ahora se reproducirán automáticamente por voz con ElevenLabs.`
        );
      } else {
        this.testSuccessMessage.set(`✅ ¡Mensaje de prueba enviado exitosamente a ${this.testPhoneNumber} a través de ${this.selectedChannel()?.name}!`);
      }
    }, 1200);
  }

  // Save config simulation
  protected saveConfig() {
    this.isDrawerOpen.set(false);
    // Visual alert mock
    alert(`Configuración guardada exitosamente para ${this.selectedChannel()?.name}`);
  }
}
