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
      id: 'alberto',
      name: 'Alberto Junior Restrepo',
      age: 29,
      city: 'Soledad',
      segment: 'Digital Activo',
      seniority: '2 años',
      products: ['Cuenta Ahorros', 'Tarjeta Olímpica'],
      preferredChannel: 'WhatsApp',
      tag: 'Comprador de tecnología',
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
      title: '🛒 Vecino Olímpica (Hiper-Personalizado)',
      description: 'Cruza hábitos de consumo reales en Olímpica (medicamentos, víveres, hogar) para inyectar ofertas dinámicas no invasivas en chat.',
      targetSegment: 'Tarjetahabientes Olímpica',
      channel: 'WhatsApp, Telegram',
      metricLabel: 'Conversión de la oferta',
      metricValue: '+32%',
      isActive: true,
      priority: 2,
      triggerCondition: 'Interacción en chat y compras históricas',
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

  private async syncWithPostgREST() {
    try {
      // 1. Sync HITL Tasks
      const response = await fetch('http://localhost:3000/tareas_hitl?order=creado_at.desc');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const mappedTasks = data.map((t: any) => ({
            id: t.id,
            clientName: t.cliente_nombre,
            clientSegment: t.cliente_segmento,
            agentName: t.agente_nombre,
            taskType: t.tipo_tarea,
            description: t.descripcion,
            originalValue: t.valor_original,
            proposedValue: t.valor_propuesto,
            confidence: t.confianza,
            status: t.estado,
            timeAgo: t.hace_cuanto,
            operatorNotes: t.notas_operador || '',
            ragDocUsed: t.documento_rag || '',
            userSpeechAudio: !!t.audio_voz,
            transcriptDialog: t.transcripcion_dialogo || ''
          }));
          this.hitlTasks.set(mappedTasks);
        }
      }

      // 2. Sync KPIs
      const kpisResponse = await fetch('http://localhost:3000/dashboard_kpis?id=eq.1');
      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json();
        if (Array.isArray(kpisData) && kpisData.length > 0) {
          this.kpis.set({
            activeConversations: kpisData[0].active_conversations,
            firstContactResolution: kpisData[0].first_contact_resolution,
            avgResponseTime: kpisData[0].avg_response_time,
            humanEscalations: kpisData[0].human_escalations,
            csat: kpisData[0].csat
          });
        }
      }

      // 3. Sync Agents
      const agentsResponse = await fetch('http://localhost:3000/dashboard_agents');
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        if (Array.isArray(agentsData) && agentsData.length > 0) {
          this.internalAgents.set(agentsData.map((a: any) => ({
            name: a.name,
            domain: a.domain,
            queriesToday: a.queries_today,
            accuracy: a.accuracy,
            latency: a.latency,
            status: a.status
          })));
        }
      }

      // 4. Sync Integrations
      const intResponse = await fetch('http://localhost:3000/dashboard_integrations');
      if (intResponse.ok) {
        const intData = await intResponse.json();
        if (Array.isArray(intData) && intData.length > 0) {
          this.externalIntegrations.set(intData.map((i: any) => ({
            name: i.name,
            type: i.type,
            callsToday: i.calls_today,
            success: i.success,
            latency: i.latency,
            status: i.status
          })));
        }
      }

      // 5. Sync Alerts
      const alertsResponse = await fetch('http://localhost:3000/dashboard_alerts?order=created_at.desc');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        if (Array.isArray(alertsData) && alertsData.length > 0) {
          this.alerts.set(alertsData.map((a: any) => ({
            id: a.id,
            severity: a.severity,
            message: a.message,
            timeAgo: a.time_ago
          })));
        }
      }

      // 6. Sync Offers (Promotions)
      const offersResponse = await fetch('http://localhost:3000/ofertas?order=prioridad.asc,id.desc');
      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        if (Array.isArray(offersData) && offersData.length > 0) {
          this.offers.set(offersData.map((o: any) => ({
            id: o.id,
            title: o.titulo,
            description: o.descripcion,
            targetSegment: o.segmento_objetivo,
            channel: o.canal,
            metricLabel: o.metrica_etiqueta || 'Conversión',
            metricValue: o.metrica_valor || 'Alta',
            isActive: !!o.esta_activa,
            priority: o.prioridad,
            triggerCondition: o.condicion_disparo || 'General'
          })));
        }
      }
    } catch (e) {
      // Quietly fall back to mock data if PostgREST is not running
    }
  }

  private async updateTaskStatusOnPostgREST(id: string, status: 'approved' | 'rejected', notes?: string) {
    try {
      await fetch(`http://localhost:3000/tareas_hitl?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: status,
          notas_operador: notes || (status === 'approved' ? 'Aprobado por el operador' : 'Rechazado por el operador')
        })
      });
    } catch (e) {
      // Ignore network errors
    }
  }

  constructor() {
    // Initial sync with database
    this.syncWithPostgREST();

    // Periodically pull live tasks and offers from PostgREST if available
    setInterval(() => {
      this.syncWithPostgREST();
    }, 2000); // Poll more frequently for snappiness
  }

  public getClientProfiles(): ClientProfile[] {
    return this.profiles;
  }

  // Toggle state of an offer
  public async toggleOffer(id: number) {
    this.offers.update((items) =>
      items.map((offer) => (offer.id === id ? { ...offer, isActive: !offer.isActive } : offer))
    );
    try {
      const offer = this.offers().find(o => o.id === id);
      if (offer) {
        await fetch(`http://localhost:3000/ofertas?id=eq.${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            esta_activa: offer.isActive
          })
        });
      }
    } catch (e) {
      // ignore
    }
  }

  // Add a new offer
  public async addOffer(offer: Offer) {
    this.offers.update((items) => [offer, ...items]);
    try {
      await fetch('http://localhost:3000/ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: offer.title,
          descripcion: offer.description,
          segmento_objetivo: offer.targetSegment,
          canal: offer.channel,
          metrica_etiqueta: offer.metricLabel,
          metrica_valor: offer.metricValue,
          esta_activa: offer.isActive,
          prioridad: offer.priority,
          condicion_disparo: offer.triggerCondition
        })
      });
      this.syncWithPostgREST();
    } catch (e) {
      // ignore
    }
  }

  // Add a new HITL task manually (e.g. from local fallback biometrics)
  public addHITLTask(task: HITLTask) {
    this.hitlTasks.update((tasks) => [task, ...tasks]);
  }

  // Approve a Human-in-the-Loop task and execute simulated side effects
  public approveHITLTask(id: string, notes?: string) {
    // Sync status change to PostgREST
    this.updateTaskStatusOnPostgREST(id, 'approved', notes);

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
    } else if (task.taskType === 'Bloqueo Biométrico') {
      this.alerts.update((alerts) => [
        {
          id: String(Date.now()),
          severity: 'green',
          message: `HITL: Bloqueo Biométrico de ${task.clientName} LEVANTADO. Identidad verificada. Autenticación continua restaurada.`,
          timeAgo: 'Ahora mismo'
        },
        ...alerts
      ]);
    } else if (task.taskType === 'Ajuste de Cuota') {
      this.kpis.update((kpi) => ({
        ...kpi,
        csat: Math.min(5.0, kpi.csat + 0.3)
      }));
      this.alerts.update((alerts) => [
        {
          id: String(Date.now()),
          severity: 'green',
          message: `HITL: Ajuste de cuota aprobado para ${task.clientName}. Cuota de manejo reducida al 50% por fidelidad VIP.`,
          timeAgo: 'Ahora mismo'
        },
        ...alerts
      ]);
    }
  }

  // Reject a Human-in-the-Loop task
  public rejectHITLTask(id: string, notes?: string) {
    // Sync status change to PostgREST
    this.updateTaskStatusOnPostgREST(id, 'rejected', notes);

    this.hitlTasks.update((tasks) =>
      tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'rejected', operatorNotes: notes || 'Acción rechazada por políticas internas o verificación fallida.' }
          : t
      )
    );

    const task = this.hitlTasks().find((t) => t.id === id);
    if (!task) return;

    if (task.taskType === 'Bloqueo Biométrico') {
      this.alerts.update((alerts) => [
        {
          id: String(Date.now()),
          severity: 'red',
          message: `HITL: Intento de suplantación en cuenta de ${task.clientName} CONFIRMADO. Cuenta suspendida permanentemente preventivamente.`,
          timeAgo: 'Ahora mismo'
        },
        ...alerts
      ]);
    } else {
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
}
