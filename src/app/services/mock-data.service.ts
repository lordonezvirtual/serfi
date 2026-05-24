import { Injectable, signal } from '@angular/core';

export interface ClientProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  segment: string;
  seniority: string;
  products: string[];
  preferredChannel: string;
  tag: string;
  isAdvisor?: boolean;
  role?: string;
  branch?: string;
}

export interface KPIMetrics {
  activeConversations: number;
  firstContactResolution: number;
  avgResponseTime: number;
  humanEscalations: number;
  csat: number;
}

export interface AgentMetric {
  name: string;
  domain: string;
  queriesToday: number;
  accuracy: number;
  latency: string;
  status: string;
}

export interface IntegrationMetric {
  name: string;
  type: string;
  callsToday: number;
  success: number;
  latency: string;
  status: string;
}

export interface Alert {
  id: string;
  severity: 'red' | 'amber' | 'green';
  message: string;
  timeAgo: string;
}

export interface Offer {
  id: number;
  title: string;
  description: string;
  targetSegment: string;
  channel: string;
  metricLabel: string;
  metricValue: string;
  isActive: boolean;
  priority: number;
  triggerCondition: string;
}

export interface RAGDocument {
  id: string;
  title: string;
  category: string;
  lastUpdated: string;
  chunks: number;
  confidence: number; // 0-100
}

export interface HITLTask {
  id: string;
  clientName: string;
  clientSegment: string;
  agentName: string;
  taskType: string;
  description: string;
  originalValue?: string;
  proposedValue: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  timeAgo: string;
  operatorNotes?: string;
  ragDocUsed?: string;
  userSpeechAudio?: boolean;
  transcriptDialog?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MockDataService {
  // Profiles
  private readonly profiles: ClientProfile[] = [
    {
      id: 'maria',
      name: 'María Amparo Gutiérrez',
      age: 62,
      city: 'Cali',
      segment: 'Adulto Mayor',
      seniority: '14 años',
      products: ['Cuenta Ahorros', 'Tarjeta Olimpica', 'SuperCDT'],
      preferredChannel: 'WhatsApp',
      tag: 'No usa app',
    },
    {
      id: 'carlos',
      name: 'Carlos Herrera Díaz',
      age: 38,
      city: 'Barranquilla',
      segment: 'Digital Activo',
      seniority: '6 años',
      products: ['Cuenta Ahorros', 'Tarjeta Crédito', 'CDT $8M'],
      preferredChannel: 'Telegram',
      tag: 'Cliente frecuente Olimpica',
    },
    {
      id: 'juliana',
      name: 'Asesor: Juliana Mora',
      age: 28,
      city: 'Bogotá',
      segment: 'Asesor Interno',
      seniority: '3 meses',
      products: ['Consola CRM', 'Copiloto de Servicio', 'scoring comercial'],
      preferredChannel: 'CenterCall',
      tag: 'Modo copiloto asesor',
      isAdvisor: true,
      role: 'Asesora Junior',
      branch: 'Bogotá Chapinero',
    },
  ];

  // Human-in-the-Loop Tasks for Autonomous Agent Processes
  public hitlTasks = signal<HITLTask[]>([
    {
      id: 'hitl-1',
      clientName: 'María Amparo Gutiérrez',
      clientSegment: 'Adulto Mayor',
      agentName: 'Agente UX 50+',
      taskType: 'Actualización de Dirección',
      description: 'Cambio de domicilio solicitado vía audio de voz en WhatsApp. Requiere autorización regulada de firma digital por operador.',
      originalValue: 'Calle 5 # 34-12, Cali',
      proposedValue: 'Avenida 3 Norte # 23-45, Apto 402, Cali',
      confidence: 94,
      status: 'pending',
      timeAgo: 'Hace 3 min',
      ragDocUsed: 'Actualización de datos paso a paso',
      userSpeechAudio: true,
      transcriptDialog: 'María Amparo: "...sí mijo, por favor cámbiame la dirección de correspondencia a la Avenida 3 Norte número 23 guion 45, apartamento 402 en la ciudad de Cali, que me mudé con mi hija el mes pasado..."'
    },
    {
      id: 'hitl-2',
      clientName: 'Carlos Herrera Díaz',
      clientSegment: 'Digital Activo',
      agentName: 'Agente Perfil 360',
      taskType: 'Aumento de Cupo',
      description: 'Pre-aprobación y liberación de cupo en Tarjeta Olímpica Serfinanza basado en scoring crediticio y 65% de utilización recurrente.',
      originalValue: '$5,000,000 COP',
      proposedValue: '$6,500,000 COP',
      confidence: 98,
      status: 'pending',
      timeAgo: 'Hace 12 min',
      ragDocUsed: 'Tarifario Tarjeta Olimpica 2026',
      transcriptDialog: 'Agente 360: "Detectando uso recurrente en Olímpica y comportamiento AAA de pago. Sugiriendo aumento de cupo inmediato al 30% adicional para asegurar compras en el Sábado Madrugón."'
    },
    {
      id: 'hitl-3',
      clientName: 'Roberto Gómez Oñate',
      clientSegment: 'Cliente Preferencial',
      agentName: 'Agente Banca',
      taskType: 'Exención de Tasa',
      description: 'Excepción de tasa preferencial de SuperCDT al 13.0% E.A. (el límite estándar autorizado es 12.5% E.A.) para retención de fondos de $15M.',
      originalValue: '12.5% E.A.',
      proposedValue: '13.0% E.A. (Monto $15,000,000)',
      confidence: 91,
      status: 'pending',
      timeAgo: 'Hace 25 min',
      ragDocUsed: 'Reglamento SuperCDT v3.2',
      transcriptDialog: 'Roberto Gómez: "Si no me mejoran la tasa del CDT al 13%, tendré que retirar los 15 millones de pesos y llevarlos a otro banco que me ofrece mejor rentabilidad."'
    },
    {
      id: 'hitl-4',
      clientName: 'Campañas Automáticas',
      clientSegment: 'Segmento Adulto Mayor (420 cls)',
      agentName: 'Agente Retail Olimpica',
      taskType: 'Difusión de Campaña',
      description: 'Envío proactivo masivo de SMS y alertas personalizadas para la promoción del Sábado Madrugón de electrodomésticos.',
      originalValue: 'Ninguno',
      proposedValue: 'Difusión SMS a 420 contactos segmentados',
      confidence: 96,
      timeAgo: 'Hace 45 min',
      status: 'pending',
      ragDocUsed: 'Calendario de eventos especiales',
      transcriptDialog: 'Agente Retail: "Planificando envío de SMS personalizado para adultos mayores en Cali sin App activa en los últimos 30 días, informando sobre descuento exclusivo del 30% en electrodomésticos Olímpica."'
    }
  ]);

  // Dynamic KPI Metrics using signals
  public kpis = signal<KPIMetrics>({
    activeConversations: 1284,
    firstContactResolution: 87,
    avgResponseTime: 1.3,
    humanEscalations: 13,
    csat: 4.6,
  });

  // Agent metrics
  public internalAgents = signal<AgentMetric[]>([
    { name: 'Orquestador Central', domain: 'Enrutamiento y contexto', queriesToday: 12847, accuracy: 99, latency: '0.3s', status: 'OK' },
    { name: 'Agente Perfil 360', domain: 'CRM y segmentación', queriesToday: 8210, accuracy: 97, latency: '0.6s', status: 'OK' },
    { name: 'Agente Banca', domain: 'Saldos, extractos y movimientos', queriesToday: 6934, accuracy: 95, latency: '0.9s', status: 'OK' },
    { name: 'Agente Portafolio', domain: 'CDT y tarjeta de crédito', queriesToday: 3102, accuracy: 88, latency: '1.1s', status: 'Review' },
    { name: 'Agente Retail Olimpica', domain: 'Ofertas y catálogo comercial', queriesToday: 2841, accuracy: 96, latency: '0.7s', status: 'OK' },
    { name: 'Agente UX 50+', domain: 'Accesibilidad adulto mayor', queriesToday: 1203, accuracy: 94, latency: '0.8s', status: 'OK' },
  ]);

  public externalIntegrations = signal<IntegrationMetric[]>([
    { name: 'Serfinanza Core API', type: 'Servicios Bancarios', callsToday: 9102, success: 98, latency: '320ms', status: 'OK' },
    { name: 'CRM Salesforce', type: 'Perfil de Cliente', callsToday: 6210, success: 99, latency: '180ms', status: 'OK' },
    { name: 'Catálogo Olimpica', type: 'Retail y Descuentos', callsToday: 2841, success: 97, latency: '210ms', status: 'OK' },
    { name: 'Azure OpenAI GPT-4o', type: 'Modelo LLM', callsToday: 12847, success: 99, latency: '890ms', status: 'OK' },
    { name: 'WhatsApp Business API', type: 'Mensajería', callsToday: 8134, success: 99, latency: '95ms', status: 'OK' },
    { name: 'Serfinanza Extractos', type: 'Documentos PDF', callsToday: 3450, success: 91, latency: '420ms', status: 'High Latency' },
  ]);

  // Alerts
  public alerts = signal<Alert[]>([
    { id: '1', severity: 'red', message: 'Serfinanza Extractos — Alta latencia 420ms prom. en generación de PDFs.', timeAgo: 'Hace 5 min' },
    { id: '2', severity: 'amber', message: 'Agente Portafolio — 3 consultas de SuperCDT sin responder. Revisar base RAG.', timeAgo: 'Hace 22 min' },
    { id: '3', severity: 'green', message: 'Catálogo Olimpica — Ofertas semanales cargadas y sincronizadas exitosamente.', timeAgo: 'Hace 1h' },
    { id: '4', severity: 'green', message: 'WhatsApp Business API — 0 errores en las últimas 2 horas. Uptime de 99.8%.', timeAgo: 'Hace 2h' },
  ]);

  // Offers
  public offers = signal<Offer[]>([
    {
      id: 1,
      title: '🏦 SuperCDT personalizado',
      description: 'Rentabilidad exclusiva del 12.5% E.A. para clientes con saldo > $2M sin CDT activo.',
      targetSegment: 'Ahorradores sin CDT',
      channel: 'WhatsApp',
      metricLabel: 'Conversión estimada',
      metricValue: '+18%',
      isActive: true,
      priority: 1,
      triggerCondition: 'Saldo > $2M y sin CDT activo',
    },
    {
      id: 2,
      title: '🛒 Miércoles de Plaza',
      description: 'Descuentos de hasta 30% en frutas y verduras de Supertiendas Olímpica pagando con Tarjeta Olímpica.',
      targetSegment: 'Tarjetahabientes Olímpica',
      channel: 'WhatsApp, Telegram',
      metricLabel: 'Enviados hoy',
      metricValue: '2.041 hoy',
      isActive: true,
      priority: 2,
      triggerCondition: 'Día actual es Miércoles',
    },
    {
      id: 3,
      title: '💳 Aumento de cupo TC',
      description: 'Aumento de cupo pre-aprobado para clientes con buen comportamiento de pago y uso > 60%.',
      targetSegment: 'Clientes con buen historial',
      channel: 'Web',
      metricLabel: 'Conversión promedio',
      metricValue: '+22%',
      isActive: true,
      priority: 3,
      triggerCondition: 'Uso TC > 60% por 3 meses',
    },
    {
      id: 4,
      title: '👴 Paquete 50+ sin app',
      description: 'Atención prioritaria y exoneración de cuota de manejo para clientes senior sin uso de app móvil.',
      targetSegment: 'Adulto Mayor (Sin App 30d)',
      channel: 'WhatsApp auto',
      metricLabel: 'Retención lograda',
      metricValue: '+15%',
      isActive: true,
      priority: 1,
      triggerCondition: 'Edad > 55 y sin login en App',
    },
    {
      id: 5,
      title: '🥩 Viernes de Carnes',
      description: '25% de descuento en carnes seleccionadas en Olímpica para clientes con compras recurrentes de víveres.',
      targetSegment: 'Compradores de carnes',
      channel: 'WhatsApp, SMS',
      metricLabel: 'Frecuencia de compra',
      metricValue: '+8%',
      isActive: true,
      priority: 4,
      triggerCondition: 'Compra en Olímpica el último mes',
    },
    {
      id: 6,
      title: '💅 Dermocosméticos sáb',
      description: 'Oferta 2x1 en cremas Pond\'s y Nivea pagando con Tarjeta Olímpica este viernes y sábado.',
      targetSegment: 'Mujeres 25-55 años',
      channel: 'Instagram',
      metricLabel: 'Clics (CTR)',
      metricValue: '+25%',
      isActive: true,
      priority: 5,
      triggerCondition: 'Visita sección belleza en Olímpica',
    },
    {
      id: 7,
      title: '🔔 Alerta pago proactiva',
      description: 'Recordatorio proactivo con botón de pago rápido PSE antes de la fecha de corte.',
      targetSegment: 'Deudores recurrentes',
      channel: 'WhatsApp, SMS',
      metricLabel: 'Mora reducida',
      metricValue: '-12%',
      isActive: true,
      priority: 2,
      triggerCondition: 'Historial de pago tardío',
    },
    {
      id: 8,
      title: '📊 Onboarding asesor',
      description: 'Guías de servicio interactivas y sugerencias automáticas de RAG en consola para asesores nuevos.',
      targetSegment: 'Asesores nuevos < 90 días',
      channel: 'Internal copilot',
      metricLabel: 'Tiempo de rampa',
      metricValue: '-40%',
      isActive: true,
      priority: 3,
      triggerCondition: 'Rol Asesor e ingreso < 90 días',
    },
  ]);

  // Knowledge Documents
  public documents = signal<RAGDocument[]>([
    // Productos bancarios
    { id: 'doc-1', title: 'Reglamento SuperCDT v3.2', category: 'Productos bancarios', lastUpdated: '12 May 2026', chunks: 24, confidence: 95 },
    { id: 'doc-2', title: 'Tarifario Tarjeta Olimpica 2026', category: 'Productos bancarios', lastUpdated: '18 May 2026', chunks: 12, confidence: 97 },
    { id: 'doc-3', title: 'Guía cuenta de ahorros', category: 'Productos bancarios', lastUpdated: '05 Ene 2026', chunks: 8, confidence: 99 },
    { id: 'doc-4', title: 'Condiciones crédito de consumo', category: 'Productos bancarios', lastUpdated: '10 Feb 2026', chunks: 32, confidence: 86 },
    // Procesos operativos
    { id: 'doc-5', title: 'Actualización de datos paso a paso', category: 'Procesos operativos', lastUpdated: '22 Mar 2026', chunks: 6, confidence: 94 },
    { id: 'doc-6', title: 'Radicación plan de ahorro débito automático', category: 'Procesos operativos', lastUpdated: '01 Abr 2026', chunks: 15, confidence: 89 },
    { id: 'doc-7', title: 'Procedimiento extracto digital', category: 'Procesos operativos', lastUpdated: '14 May 2026', chunks: 10, confidence: 92 },
    // Catálogo Olimpica
    { id: 'doc-8', title: 'Ofertas semanales (auto-sync lunes)', category: 'Catálogo Olimpica', lastUpdated: 'Hoy 04:00', chunks: 45, confidence: 98 },
    { id: 'doc-9', title: 'Beneficios Tarjeta Olimpica', category: 'Catálogo Olimpica', lastUpdated: '15 May 2026', chunks: 18, confidence: 96 },
    { id: 'doc-10', title: 'Calendario de eventos especiales', category: 'Catálogo Olimpica', lastUpdated: '20 May 2026', chunks: 8, confidence: 90 },
    // Regulatorio
    { id: 'doc-11', title: 'Política Habeas Data', category: 'Regulatorio', lastUpdated: '01 Ene 2026', chunks: 50, confidence: 100 },
    { id: 'doc-12', title: 'Tarifas Superfinanciera 2026', category: 'Regulatorio', lastUpdated: '15 Ene 2026', chunks: 60, confidence: 88 },
  ]);

  constructor() {
    // Start interval to auto-update metrics every 8 seconds
    setInterval(() => {
      this.updateKPIMetrics();
    }, 8000);
  }

  public getClientProfiles(): ClientProfile[] {
    return this.profiles;
  }

  private updateKPIMetrics() {
    this.kpis.update((kpi) => {
      // Add ±random variation of max 5%
      const variation = () => (Math.random() - 0.5) * 0.05;
      
      const activeConversations = Math.max(1000, Math.round(kpi.activeConversations * (1 + variation() * 0.5)));
      const firstContactResolution = Math.min(100, Math.max(70, Math.round(kpi.firstContactResolution * (1 + variation() * 0.2))));
      const avgResponseTime = Math.max(0.5, Math.round((kpi.avgResponseTime * (1 + variation())) * 10) / 10);
      const humanEscalations = Math.min(50, Math.max(5, Math.round(kpi.humanEscalations * (1 + variation() * 0.3))));
      const csat = Math.min(5.0, Math.max(3.5, Math.round((kpi.csat * (1 + variation() * 0.1)) * 10) / 10));

      return {
        activeConversations,
        firstContactResolution,
        avgResponseTime,
        humanEscalations,
        csat,
      };
    });

    // Also slightly randomize queries and latency of agents for rich live feeling
    this.internalAgents.update((agents) => {
      return agents.map((agent) => {
        const queryDiff = Math.floor(Math.random() * 5) + 1;
        const newAccuracy = Math.min(100, Math.max(80, agent.accuracy + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)));
        return {
          ...agent,
          queriesToday: agent.queriesToday + queryDiff,
          accuracy: newAccuracy
        };
      });
    });

    this.externalIntegrations.update((integrations) => {
      return integrations.map((int) => {
        const callsDiff = Math.floor(Math.random() * 4) + 1;
        const successRate = Math.min(100, Math.max(90, int.success + (Math.random() > 0.95 ? (Math.random() > 0.5 ? 1 : -1) : 0)));
        return {
          ...int,
          callsToday: int.callsToday + callsDiff,
          success: successRate
        };
      });
    });
  }

  // Toggle state of an offer
  public toggleOffer(id: number) {
    this.offers.update((items) =>
      items.map((offer) => (offer.id === id ? { ...offer, isActive: !offer.isActive } : offer))
    );
  }

  // Add a new offer
  public addOffer(newOffer: Offer) {
    this.offers.update((items) => [...items, newOffer]);
  }

  // Approve a Human-in-the-Loop task and execute simulated side effects
  public approveHITLTask(id: string, notes?: string) {
    this.hitlTasks.update((tasks) =>
      tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'approved', operatorNotes: notes || 'Aprobado sin observaciones adicionales por el operador.' }
          : t
      )
    );

    // Apply fun interactive side-effects to KPIs and Alerts based on what got approved!
    const task = this.hitlTasks().find((t) => t.id === id);
    if (!task) return;

    if (task.taskType === 'Aumento de Cupo') {
      // Increase Active Conversations & CSAT slightly since the client is happy
      this.kpis.update((kpi) => ({
        ...kpi,
        csat: Math.min(5.0, kpi.csat + 0.1),
        activeConversations: kpi.activeConversations + 1
      }));
      // Add a green alert
      this.alerts.update((alerts) => [
        {
          id: String(Date.now()),
          severity: 'green',
          message: `HITL: Aumento de cupo de TC a $6.5M aprobado para ${task.clientName}. Core de Serfinanza actualizado.`,
          timeAgo: 'Ahora mismo'
        },
        ...alerts
      ]);
    } else if (task.taskType === 'Actualización de Dirección') {
      this.kpis.update((kpi) => ({
        ...kpi,
        firstContactResolution: Math.min(100, kpi.firstContactResolution + 1)
      }));
      this.alerts.update((alerts) => [
        {
          id: String(Date.now()),
          severity: 'green',
          message: `HITL: Cambio de dirección de ${task.clientName} aprobado. Base de datos CRM actualizada.`,
          timeAgo: 'Ahora mismo'
        },
        ...alerts
      ]);
    } else if (task.taskType === 'Exención de Tasa') {
      this.kpis.update((kpi) => ({
        ...kpi,
        csat: Math.min(5.0, kpi.csat + 0.2)
      }));
      this.alerts.update((alerts) => [
        {
          id: String(Date.now()),
          severity: 'green',
          message: `HITL: Exención de tasa SuperCDT al 13.0% E.A. aprobada para ${task.clientName}. Inversión conservada.`,
          timeAgo: 'Ahora mismo'
        },
        ...alerts
      ]);
    } else if (task.taskType === 'Difusión de Campaña') {
      // Significantly increase active conversations and trigger high calls to Core API
      this.kpis.update((kpi) => ({
        ...kpi,
        activeConversations: kpi.activeConversations + 420
      }));
      this.externalIntegrations.update((integrations) =>
        integrations.map((int) =>
          int.name === 'WhatsApp Business API'
            ? { ...int, callsToday: int.callsToday + 420 }
            : int
        )
      );
      this.alerts.update((alerts) => [
        {
          id: String(Date.now()),
          severity: 'green',
          message: `HITL: Campaña Sábado Madrugón aprobada. 420 SMS enviados a la cola de salida.`,
          timeAgo: 'Ahora mismo'
        },
        ...alerts
      ]);
    }
  }

  // Reject a Human-in-the-Loop task
  public rejectHITLTask(id: string, notes?: string) {
    this.hitlTasks.update((tasks) =>
      tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'rejected', operatorNotes: notes || 'Acción rechazada por políticas internas o verificación fallida.' }
          : t
      )
    );

    const task = this.hitlTasks().find((t) => t.id === id);
    if (!task) return;

    // Trigger an alert indicating rejection
    this.alerts.update((alerts) => [
      {
        id: String(Date.now()),
        severity: 'amber',
        message: `HITL: Proceso "${task.taskType}" para ${task.clientName} RECHAZADO por el operador.`,
        timeAgo: 'Ahora mismo'
      },
      ...alerts
    ]);
  }
}
