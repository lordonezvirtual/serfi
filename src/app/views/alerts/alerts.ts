import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../services/mock-data.service';

export interface RichAlert {
  id: string;
  severity: 'red' | 'amber' | 'green';
  title: string;
  channel: 'Web' | 'Móvil' | 'WhatsApp' | 'PSE' | 'CenterCall' | 'Base de Datos' | 'Seguridad' | 'Catálogo';
  message: string;
  description: string;
  timeAgo: string;
  suggestedGroup: string;
  emails: string[];
  channels: string[]; // Slack / Teams channels
  status: 'active' | 'resolved';
  sentStatuses: { medium: 'email' | 'group'; timestamp: string; target: string }[];
}

export interface SentNotificationLog {
  id: string;
  alertTitle: string;
  channel: string;
  severity: 'red' | 'amber' | 'green';
  medium: 'Email' | 'Slack' | 'Teams' | 'WhatsApp';
  targetGroup: string;
  recipient: string;
  timestamp: string;
  operatorNotes: string;
  status: 'Enviado ✔' | 'Entregado ⚡' | 'Fallo ✕';
}

export interface ChannelStatus {
  name: string;
  icon: string;
  status: 'optimal' | 'warning' | 'critical';
  uptime: string;
  activeAlerts: number;
}

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alerts.html',
})
export class AlertsComponent implements OnInit {
  private readonly dataService = inject(MockDataService);

  // Core alerts list (RichAlert objects)
  protected readonly richAlerts = signal<RichAlert[]>([
    {
      id: 'AL-101',
      severity: 'red',
      title: 'Caída de Servicio - Página Web Corporativa',
      channel: 'Web',
      message: 'Web Serfinanza — Error 502 Bad Gateway en balanceador principal.',
      description: 'El portal transaccional web de Banco Serfinanza (https://www.serfinanza.com.co) no se encuentra accesible debido a un fallo en el pool de sockets upstream. El impacto estimado es del 100% en consultas y transferencias web corporativas.',
      timeAgo: 'Hace 3 min',
      suggestedGroup: 'DevOps & Infraestructura',
      emails: ['infra-soporte@serfinanza.com.co', 'devops-alerts@serfinanza.com.co'],
      channels: ['#ops-infra-alerts', '#mesa-ti-emergencias'],
      status: 'active',
      sentStatuses: []
    },
    {
      id: 'AL-102',
      severity: 'red',
      title: 'Caída de Servicio - Login en Aplicación Móvil',
      channel: 'Móvil',
      message: 'App Móvil — Microservicio LDAP no responde (Timeout 15000ms).',
      description: 'La aplicación móvil iOS y Android está fallando en el inicio de sesión para el 90% de los usuarios activos. El log del contenedor Docker en AWS ECS muestra fatiga de sockets en la base de datos de identidades LDAP.',
      timeAgo: 'Hace 8 min',
      suggestedGroup: 'Mesa de Control & DevOps',
      emails: ['soporte-app@serfinanza.com.co', 'ldap-team@serfinanza.com.co'],
      channels: ['#alertas-movil', '#soporte-ldap'],
      status: 'active',
      sentStatuses: []
    },
    {
      id: 'AL-103',
      severity: 'red',
      title: 'Interrupción en Pasarela - Pagos PSE',
      channel: 'PSE',
      message: 'PSE Gateway — Desconexión total del nodo de firmas con ACH Colombia.',
      description: 'Las transacciones de recaudo y pagos de tarjeta de crédito mediante PSE están siendo rechazadas con el error ACH_COMM_TIMEOUT. Se registran 142 transacciones en cola en las últimas 5 minutos.',
      timeAgo: 'Hace 15 min',
      suggestedGroup: 'DevOps & Pasarelas de Pago',
      emails: ['pasarelas-soporte@serfinanza.com.co', 'ach-enlace@serfinanza.com.co'],
      channels: ['#soporte-pse-grupo', '#transacciones-alerta'],
      status: 'active',
      sentStatuses: []
    },
    {
      id: 'AL-104',
      severity: 'amber',
      title: 'Degradación de Canal - WhatsApp Business API',
      channel: 'WhatsApp',
      message: 'WhatsApp Business API — Elevado índice de latencia 5.2s prom.',
      description: 'El bot omnicanal de WhatsApp está presentando latencias superiores a 5 segundos para procesar mensajes entrantes. Se registran 12 mensajes pendientes de entrega en la pasarela externa de Twilio.',
      timeAgo: 'Hace 22 min',
      suggestedGroup: 'Soporte Canales de Atención',
      emails: ['soporte-canales@serfinanza.com.co', 'integraciones-ia@serfinanza.com.co'],
      channels: ['#chatbots-soporte', '#twilio-whatsapp-status'],
      status: 'active',
      sentStatuses: []
    },
    {
      id: 'AL-105',
      severity: 'amber',
      title: 'Fallo de Componente - Reconocimiento Biométrico Móvil',
      channel: 'Seguridad',
      message: 'Seguridad Biométrica — Alta tasa de rechazo 58% en FaceID.',
      description: 'Incremento inusual de reintentos fallidos en el módulo FaceID de reconocimiento facial para clientes del segmento Adulto Mayor. La tasa de éxito disminuyó al 42% en la última media hora.',
      timeAgo: 'Hace 35 min',
      suggestedGroup: 'Ciberseguridad & UX',
      emails: ['seguridad-ti@serfinanza.com.co', 'ux-adultomayor@serfinanza.com.co'],
      channels: ['#seguridad-alertas', '#ux-mejoras'],
      status: 'active',
      sentStatuses: []
    },
    {
      id: 'AL-106',
      severity: 'red',
      title: 'Caída de Conectividad - CenterCall Copilot',
      channel: 'CenterCall',
      message: 'CenterCall Copilot — Desconexión SIP en central telefónica.',
      description: 'Los asesores en call center no pueden habilitar el sistema de copilotaje en tiempo real ni escuchar las grabaciones de voz de clientes. El puente de telefonía Asterisk reporta caídas de registros SIP.',
      timeAgo: 'Hace 45 min',
      suggestedGroup: 'Soporte Canales & Telecomunicaciones',
      emails: ['telecomunicaciones@serfinanza.com.co', 'mesa-servicio@serfinanza.com.co'],
      channels: ['#soporte-centercall', '#sip-trunk-status'],
      status: 'active',
      sentStatuses: []
    },
    {
      id: 'AL-107',
      severity: 'amber',
      title: 'Degradación de Backend - Pool de Base de Datos PDF',
      channel: 'Base de Datos',
      message: 'Serfinanza Extractos — Pool PostgreSQL de Extractos al 98%.',
      description: 'Los clientes experimentan lentitudes extremas al descargar extractos de cuentas de ahorro en PDF. Latencia promedio en 420ms por documento, rozando límites de timeout transaccionales.',
      timeAgo: 'Hace 50 min',
      suggestedGroup: 'Administradores DBAs',
      emails: ['dbas-soporte@serfinanza.com.co', 'infra-bd@serfinanza.com.co'],
      channels: ['#postgres-dbas-alerts', '#infra-db-performance'],
      status: 'active',
      sentStatuses: []
    },
    {
      id: 'AL-108',
      severity: 'amber',
      title: 'Incidente de Seguridad - Bloqueo WAF AWS',
      channel: 'Seguridad',
      message: 'Seguridad WAF — Bloqueo de 1,200 peticiones en /api/v1/auth.',
      description: 'Se detectó un patrón automatizado de intentos de inicio de sesión de fuerza bruta desde un bloque de IPs geolocalizadas fuera de Colombia. El firewall perimetral WAF de AWS mitigó los accesos.',
      timeAgo: 'Hace 1h',
      suggestedGroup: 'Ciberseguridad & SOC',
      emails: ['soc-ti@serfinanza.com.co', 'ciberseguridad-alerts@serfinanza.com.co'],
      channels: ['#incidentes-soc', '#ciberseguridad-emergencias'],
      status: 'active',
      sentStatuses: []
    },
    {
      id: 'AL-109',
      severity: 'green',
      title: 'Sincronización Exitosa - Catálogo Olímpica',
      channel: 'Catálogo',
      message: 'Catálogo Olímpica — Ofertas semanales cargadas y sincronizadas exitosamente.',
      description: 'El cronjob de integración actualizó los 45 registros de promociones de la base de datos de retail de forma correcta, sin errores de consistencia en el mapeo de SKUs.',
      timeAgo: 'Hace 2h',
      suggestedGroup: 'Comercial & Marketing',
      emails: ['marketing-ti@serfinanza.com.co', 'comercial-retail@serfinanza.com.co'],
      channels: ['#retail-ofertas', '#sincro-catalogos'],
      status: 'resolved',
      sentStatuses: []
    }
  ]);

  // General Notification log
  protected readonly notificationLogs = signal<SentNotificationLog[]>([
    {
      id: 'NOT-1001',
      alertTitle: 'Sincronización Exitosa - Catálogo Olímpica',
      channel: 'Catálogo',
      severity: 'green',
      medium: 'Slack',
      targetGroup: 'Comercial & Marketing',
      recipient: '#retail-ofertas',
      timestamp: 'Hoy, 09:30 AM',
      operatorNotes: 'Reporte semanal automatizado de sincronización de catálogo.',
      status: 'Enviado ✔'
    },
    {
      id: 'NOT-1002',
      alertTitle: 'Degradación de Backend - Pool de Base de Datos PDF',
      channel: 'Base de Datos',
      severity: 'amber',
      medium: 'Email',
      targetGroup: 'Administradores DBAs',
      recipient: 'dbas-soporte@serfinanza.com.co',
      timestamp: 'Hoy, 10:15 AM',
      operatorNotes: 'Solicitud de revisión de balance de conexiones en pool primario de base de datos.',
      status: 'Entregado ⚡'
    }
  ]);

  // Filters state
  protected selectedFilterChannel = signal<string>('Todos');
  protected selectedFilterSeverity = signal<string>('Todos');

  // Interactive metrics
  protected getActiveAlertCount(severity?: 'red' | 'amber' | 'green'): number {
    const list = this.richAlerts();
    if (severity) {
      return list.filter(a => a.severity === severity && a.status === 'active').length;
    }
    return list.filter(a => a.status === 'active').length;
  }

  // Get active alerts grouped by channels
  protected getChannelStatus(): ChannelStatus[] {
    const list = this.richAlerts();
    const channelsData: { name: string; icon: string }[] = [
      { name: 'Web', icon: '🌐' },
      { name: 'Móvil', icon: '📱' },
      { name: 'WhatsApp', icon: '💬' },
      { name: 'PSE', icon: '⚡' },
      { name: 'CenterCall', icon: '📞' },
      { name: 'Base de Datos', icon: '📊' },
      { name: 'Seguridad', icon: '🔒' }
    ];

    return channelsData.map(ch => {
      const activeAlerts = list.filter(a => a.channel === ch.name && a.status === 'active');
      let status: 'optimal' | 'warning' | 'critical' = 'optimal';
      let uptime = '99.9%';

      if (activeAlerts.some(a => a.severity === 'red')) {
        status = 'critical';
        uptime = ch.name === 'Web' ? '92.4%' : ch.name === 'Móvil' ? '94.1%' : ch.name === 'CenterCall' ? '96.2%' : '95.0%';
      } else if (activeAlerts.some(a => a.severity === 'amber')) {
        status = 'warning';
        uptime = ch.name === 'WhatsApp' ? '98.5%' : ch.name === 'Seguridad' ? '98.9%' : '98.7%';
      } else {
        uptime = ch.name === 'CenterCall' ? '100%' : '99.9%';
      }

      return {
        name: ch.name,
        icon: ch.icon,
        status,
        uptime,
        activeAlerts: activeAlerts.length
      };
    });
  }

  // Filtered rich alerts list
  protected getFilteredAlerts(): RichAlert[] {
    let list = this.richAlerts();
    const chan = this.selectedFilterChannel();
    const sev = this.selectedFilterSeverity();

    if (chan !== 'Todos') {
      list = list.filter(a => a.channel === chan);
    }
    if (sev !== 'Todos') {
      list = list.filter(a => a.severity === sev);
    }
    // Order: active first, then red first, then amber, then green
    return [...list].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      const score = { red: 3, amber: 2, green: 1 };
      return score[b.severity] - score[a.severity];
    });
  }

  // Active Alert selection for sending notification drawer
  protected selectedAlert = signal<RichAlert | null>(null);
  protected notificationMedium = signal<'email' | 'group'>('email');
  protected isNotificationDrawerOpen = signal<boolean>(false);

  // Form fields inside notification drawer
  protected selectedRecipientGroup = '';
  protected selectedContactEmail = '';
  protected selectedContactChannel = '';
  protected customOperatorNotes = '';
  protected emailSubject = '';
  protected emailBody = '';
  protected groupBody = '';

  // Sending progress bar state
  protected isSendingNotification = signal<boolean>(false);
  protected sendProgress = signal<number>(0);
  protected showSendSuccessToast = signal<boolean>(false);
  protected successToastMessage = '';

  // Open notification drawer
  protected openNotificationDrawer(alert: RichAlert, medium: 'email' | 'group') {
    this.selectedAlert.set(alert);
    this.notificationMedium.set(medium);
    this.customOperatorNotes = '';
    this.selectedRecipientGroup = alert.suggestedGroup;
    this.selectedContactEmail = alert.emails[0] || '';
    this.selectedContactChannel = alert.channels[0] || '';
    
    // Set up template bodies
    if (medium === 'email') {
      this.emailSubject = `[URGENTE] ALERTA DE SERVICIO ${alert.severity === 'red' ? 'CRÍTICA' : 'PREVENTIVA'} - ${alert.title.toUpperCase()}`;
      this.emailBody = `Estimado equipo de ${alert.suggestedGroup},\n\n` +
        `Se ha reportado un incidente de nivel ${alert.severity === 'red' ? 'CRÍTICO (🔴)' : 'ADVERTENCIA (🟡)'} en el canal ${alert.channel}.\n\n` +
        `Detalle del Incidente:\n` +
        `• Código de Alerta: ${alert.id}\n` +
        `• Servicio/Componente: ${alert.title}\n` +
        `• Diagnóstico: ${alert.message}\n` +
        `• Descripción Técnica: ${alert.description}\n` +
        `• Reportado hace: ${alert.timeAgo}\n\n` +
        `Por favor, procedan con la revisión de logs de servidores y el reinicio de servicios según la guía RAG de contingencia.\n\n` +
        `Atentamente,\n` +
        `Mesa de Operaciones Omnicanal Agente 360`;
    } else {
      this.groupBody = `🚨 *ALERTA OPERATIVA - BANCO SERFINANZA* 🚨\n\n` +
        `• *ID:* \`${alert.id}\`\n` +
        `• *Gravedad:* ${alert.severity === 'red' ? '🔥 CRÍTICA' : '⚠️ ADVERTENCIA'}\n` +
        `• *Servicio:* *${alert.title}*\n` +
        `• *Canal Afectado:* ${alert.channel}\n` +
        `• *Resumen:* _${alert.message}_\n` +
        `• *Tiempo:* ${alert.timeAgo}\n\n` +
        `👉 *Acción sugerida:* Revisar microservicio y reportar estado en este canal de soporte.`;
    }
    
    this.isNotificationDrawerOpen.set(true);
  }

  // Close notification drawer
  protected closeNotificationDrawer() {
    this.isNotificationDrawerOpen.set(false);
  }

  // Handle send submission with simulated progress
  protected submitNotification() {
    const alert = this.selectedAlert();
    if (!alert) return;

    this.isSendingNotification.set(true);
    this.sendProgress.set(0);

    const interval = setInterval(() => {
      if (this.sendProgress() >= 100) {
        clearInterval(interval);
        this.isSendingNotification.set(false);
        this.isNotificationDrawerOpen.set(false);
        
        // Mark alert card with sent status
        const medium = this.notificationMedium();
        const target = medium === 'email' ? this.selectedContactEmail : this.selectedContactChannel;
        
        // Add to alert sent list
        this.richAlerts.update(alerts => 
          alerts.map(a => {
            if (a.id === alert.id) {
              return {
                ...a,
                sentStatuses: [...a.sentStatuses, {
                  medium,
                  timestamp: 'Hace un momento',
                  target
                }]
              };
            }
            return a;
          })
        );

        // Add to general notification log
        const timeNow = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const mediumName = medium === 'email' ? 'Email' : (target.startsWith('#') ? 'Slack' : 'WhatsApp');
        
        this.notificationLogs.update(logs => [
          {
            id: 'NOT-' + Math.floor(Math.random() * 9000 + 1000),
            alertTitle: alert.title,
            channel: alert.channel,
            severity: alert.severity,
            medium: mediumName as any,
            targetGroup: this.selectedRecipientGroup,
            recipient: target,
            timestamp: `Hoy, ${timeNow}`,
            operatorNotes: this.customOperatorNotes || 'Notificación despachada por el operador.',
            status: 'Enviado ✔'
          },
          ...logs
        ]);

        // Trigger visual toast
        this.successToastMessage = `Notificación enviada con éxito a ${this.selectedRecipientGroup} a través de ${mediumName}!`;
        this.showSendSuccessToast.set(true);
        setTimeout(() => {
          this.showSendSuccessToast.set(false);
        }, 3500);

      } else {
        this.sendProgress.update(v => v + 20);
      }
    }, 250);
  }

  // Resolve Alert state locally
  protected resolveAlert(alert: RichAlert) {
    this.richAlerts.update(alerts => 
      alerts.map(a => (a.id === alert.id ? { ...a, status: 'resolved' as const } : a))
    );

    // Sync back to MockDataService alerts list by replacing/removing
    this.syncAlertsToMockService();

    // Show success toast
    this.successToastMessage = `Alerta "${alert.title}" marcada como RESUELTA con éxito.`;
    this.showSendSuccessToast.set(true);
    setTimeout(() => {
      this.showSendSuccessToast.set(false);
    }, 3000);
  }

  // ==========================================
  // INCIDENT SIMULATOR STATE & ACTION
  // ==========================================
  protected simChannel = 'Web';
  protected simSeverity = 'red';
  protected simTitle = '';
  protected simMessage = '';
  protected simDescription = '';
  protected simGroup = 'DevOps & Infraestructura';

  // Autocomplete templates based on channel in simulator
  protected onSimChannelChange() {
    const ch = this.simChannel;
    if (ch === 'Web') {
      this.simSeverity = 'red';
      this.simTitle = 'Fallo de Carga - Portal Serfinanza Web';
      this.simMessage = 'Servidor Nginx — Latencia de carga superior a 15 segundos en Landing Page.';
      this.simDescription = 'El balanceador de carga Cloudflare reporta caídas en la respuesta del backend web. Se observa alta saturación en puertos HTTPS. Afectando a clientes que intentan ingresar desde computadores.';
      this.simGroup = 'DevOps & Infraestructura';
    } else if (ch === 'Móvil') {
      this.simSeverity = 'red';
      this.simTitle = 'Bloqueo General - Transacciones en App Móvil';
      this.simMessage = 'App Móvil — Error 503 en módulo de Transferencias Interbancarias.';
      this.simDescription = 'El microservicio transaccional en Spring Boot reporta fallos en el handshake SSL con la red interbancaria Transfiya. Los usuarios reciben un mensaje de error y la aplicación se congela.';
      this.simGroup = 'Mesa de Control & DevOps';
    } else if (ch === 'WhatsApp') {
      this.simSeverity = 'amber';
      this.simTitle = 'Fallo de Webhook - WhatChimp WhatsApp';
      this.simMessage = 'WhatChimp API — Webhook de mensajería responde con error 500.';
      this.simDescription = 'El endpoint receptor de eventos de WhatChimp está rechazando los callbacks de Meta. El canal de comunicación de WhatsApp se encuentra parcialmente desconectado para envíos masivos.';
      this.simGroup = 'Soporte Canales de Atención';
    } else if (ch === 'PSE') {
      this.simSeverity = 'red';
      this.simTitle = 'Fallo Crítico - Pasarela PSE Caída';
      this.simMessage = 'PSE — Error 504 Gateway Timeout en conexión con botón PSE.';
      this.simDescription = 'El botón de pago rápido PSE no permite redireccionar a los clientes al portal bancario de Serfinanza. La integración externa con ACH Colombia está caída en el módulo transaccional.';
      this.simGroup = 'DevOps & Pasarelas de Pago';
    } else if (ch === 'CenterCall') {
      this.simSeverity = 'amber';
      this.simTitle = 'Baja Calidad - Grabación CenterCall Copilot';
      this.simMessage = 'CenterCall — Elevada tasa de pérdida de paquetes RTP en llamadas.';
      this.simDescription = 'La centralita SIP experimenta degradación en la calidad del audio de voz de los asesores. La IA tiene dificultades para transcribir y generar resúmenes automáticos del copilot.';
      this.simGroup = 'Soporte Canales & Telecomunicaciones';
    } else if (ch === 'Base de Datos') {
      this.simSeverity = 'amber';
      this.simTitle = 'Alerta de CPU - Servidor PostgreSQL Primario';
      this.simMessage = 'Base de Datos — Consumo de CPU superior al 92% en nodo master.';
      this.simDescription = 'Consultas pesadas de reporting comercial sin indexar están saturando la CPU de la base de datos de producción. Riesgo de bloqueo en tablas de cuentas de ahorros.';
      this.simGroup = 'Administradores DBAs';
    } else if (ch === 'Seguridad') {
      this.simSeverity = 'red';
      this.simTitle = 'Alerta SOC - Intento de DDoS en API Pública';
      this.simMessage = 'Seguridad WAF — 15,000 peticiones concurrentes desde IPs anónimas.';
      this.simDescription = 'Se detectó una ráfaga inusual de peticiones GET en la API pública de cotizaciones de CDT. El WAF de Amazon Web Services aplicó reglas de Rate Limiting para mitigar la sobrecarga.';
      this.simGroup = 'Ciberseguridad & SOC';
    }
  }

  // Trigger simulated incident
  protected triggerSimulatedAlert() {
    if (!this.simTitle || !this.simMessage) {
      alert('Por favor completa el título y mensaje de la alerta simulada.');
      return;
    }

    const newId = 'AL-' + Math.floor(Math.random() * 900 + 200);
    const newAlert: RichAlert = {
      id: newId,
      severity: this.simSeverity as 'red' | 'amber' | 'green',
      title: this.simTitle,
      channel: this.simChannel as any,
      message: this.simMessage,
      description: this.simDescription || 'Alerta inyectada a través del simulador de incidentes de Banco Serfinanza.',
      timeAgo: 'Ahora mismo',
      suggestedGroup: this.simGroup,
      emails: this.simChannel === 'Web' || this.simChannel === 'PSE' ? ['infra-soporte@serfinanza.com.co'] : ['soporte-general@serfinanza.com.co'],
      channels: this.simChannel === 'Web' || this.simChannel === 'PSE' ? ['#ops-infra-alerts'] : ['#soporte-canales'],
      status: 'active',
      sentStatuses: []
    };

    // Prepend to richAlerts
    this.richAlerts.update(alerts => [newAlert, ...alerts]);

    // Push back to MockDataService alerts signal as a regular compatible alert!
    this.syncAlertsToMockService();

    // Trigger visual toast
    this.successToastMessage = `🔥 NUEVA ALERTA SIMULADA INYECTADA: "${newAlert.title}" en canal ${newAlert.channel}`;
    this.showSendSuccessToast.set(true);
    setTimeout(() => {
      this.showSendSuccessToast.set(false);
    }, 4500);

    // Reset simulator title/msg
    this.simTitle = '';
    this.simMessage = '';
    this.simDescription = '';
  }

  // Sync our local rich alerts back to MockDataService so they are visible on dashboard home!
  private syncAlertsToMockService() {
    const list = this.richAlerts();
    const serviceCompatibleAlerts = list.map(a => ({
      id: a.id,
      severity: a.severity,
      message: a.message,
      timeAgo: a.timeAgo
    }));
    this.dataService.alerts.set(serviceCompatibleAlerts);
  }

  ngOnInit() {
    // Sync initially with service alerts (if there are any loaded that we don't have yet)
    // For this mock demo, we pre-populated richAlerts with beautiful robust data.
    // Let's populate service with our premium rich alerts from the start!
    this.syncAlertsToMockService();
    this.onSimChannelChange(); // Load initial simulator defaults
  }
}
