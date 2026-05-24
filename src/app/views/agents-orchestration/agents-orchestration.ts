import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  description: string;
  status: 'active' | 'inactive' | 'training' | 'error';
  model: string;
  temperature: number;
  systemPrompt: string;
  icon: string;
  color: string;
  tasksCompleted: number;
  successRate: number;
}

@Component({
  selector: 'app-agents-orchestration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agents-orchestration.html',
})
export class AgentsOrchestrationComponent {
  
  protected agents = signal<AgentConfig[]>([
    {
      id: 'agt-orch-01',
      name: 'Orquestador Empático',
      role: 'Enrutador Principal',
      description: 'Analiza el sentimiento e intención del cliente para derivar a especialistas. Especializado en tratar con adultos mayores (50+).',
      status: 'active',
      model: 'gpt-4o',
      temperature: 0.4,
      systemPrompt: 'Eres el Asistente Orquestador. Habla claro, sin jerga bancaria, y sé muy empático.',
      icon: '🧠',
      color: 'from-blue-500 to-indigo-600',
      tasksCompleted: 15420,
      successRate: 98.5
    },
    {
      id: 'agt-bank-02',
      name: 'Analista de Acceso Directo',
      role: 'Consultas Financieras',
      description: 'Accede a la base de datos de Serfinanza para reportar saldos y movimientos sin fricción.',
      status: 'active',
      model: 'gpt-4o-mini',
      temperature: 0.1,
      systemPrompt: 'Eres un analista financiero preciso. Entrega los saldos al instante.',
      icon: '💳',
      color: 'from-emerald-500 to-teal-600',
      tasksCompleted: 45210,
      successRate: 99.2
    },
    {
      id: 'agt-crm-03',
      name: 'Consejero del Bolsillo',
      role: 'Gestión de Cuotas y Flexibilidad',
      description: 'Ajusta cuotas de manejo y negocia beneficios para evitar abandono basado en lealtad.',
      status: 'active',
      model: 'gpt-4o',
      temperature: 0.5,
      systemPrompt: 'Evalúa la lealtad del cliente para ofrecer exenciones de cuota de manejo o ajustes.',
      icon: '🤝',
      color: 'from-amber-500 to-orange-600',
      tasksCompleted: 3412,
      successRate: 94.1
    },
    {
      id: 'agt-port-04',
      name: 'Consultor de Inversiones',
      role: 'Portafolios Autónomos',
      description: 'RAG integrado para educar sobre CDT y fondos de inversión. Explica términos complejos en lenguaje sencillo.',
      status: 'training',
      model: 'claude-3-5-sonnet',
      temperature: 0.3,
      systemPrompt: 'Explica los productos de inversión como si fueras un nieto enseñándole a su abuelo.',
      icon: '📈',
      color: 'from-purple-500 to-pink-600',
      tasksCompleted: 1205,
      successRate: 88.4
    },
    {
      id: 'agt-retail-05',
      name: 'Vecino Olímpica',
      role: 'Motor de Recomendación',
      description: 'Recomienda ofertas hiper-personalizadas cruzando datos transaccionales con el supermercado.',
      status: 'active',
      model: 'gpt-4o-mini',
      temperature: 0.6,
      systemPrompt: 'Identifica patrones de consumo y sugiere ofertas relevantes en Supertiendas Olímpica.',
      icon: '🛒',
      color: 'from-[#C00000] to-red-600',
      tasksCompleted: 8940,
      successRate: 91.8
    },
    {
      id: 'agt-sec-06',
      name: 'Guardián de Identidad',
      role: 'Biometría Comportamental',
      description: 'Analiza cadencia de tecleo, demoras de respuesta y genera un trust score. Si es anómalo, dispara HITL.',
      status: 'active',
      model: 'xgboost-ensemble',
      temperature: 0.0,
      systemPrompt: 'Monitorea señales invisibles. No confíes solo en el PIN.',
      icon: '🛡️',
      color: 'from-slate-700 to-slate-900',
      tasksCompleted: 102456,
      successRate: 99.9
    }
  ]);

  protected selectedAgent = signal<AgentConfig | null>(null);
  protected showConfigModal = signal<boolean>(false);

  // Form states (Config)
  protected editSystemPrompt = '';
  protected editTemperature = 0;
  protected editModel = '';

  // New Agent states
  protected showCreateAgentModal = signal<boolean>(false);
  protected isGeneratingAIAgent = signal<boolean>(false);
  protected actionAlert = signal<string | null>(null);

  protected newAgentName = '';
  protected newAgentRole = '';
  protected newAgentDesc = '';
  protected newAgentModel = 'gpt-4o';
  protected newAgentTemp = 0.5;
  protected newAgentPrompt = '';
  protected newAgentIcon = '🤖';

  openConfig(agent: AgentConfig) {
    this.selectedAgent.set(agent);
    this.editSystemPrompt = agent.systemPrompt;
    this.editTemperature = agent.temperature;
    this.editModel = agent.model;
    this.showConfigModal.set(true);
  }

  closeConfig() {
    this.showConfigModal.set(false);
    setTimeout(() => this.selectedAgent.set(null), 300);
  }

  saveConfig() {
    const current = this.selectedAgent();
    if (current) {
      this.agents.update(list => list.map(a => {
        if (a.id === current.id) {
          return {
            ...a,
            systemPrompt: this.editSystemPrompt,
            temperature: this.editTemperature,
            model: this.editModel
          };
        }
        return a;
      }));
    }
    this.closeConfig();
  }

  openCreateAgent() {
    this.newAgentName = '';
    this.newAgentRole = '';
    this.newAgentDesc = '';
    this.newAgentModel = 'gpt-4o';
    this.newAgentTemp = 0.5;
    this.newAgentPrompt = '';
    this.newAgentIcon = '🤖';
    this.showCreateAgentModal.set(true);
  }

  closeCreateAgent() {
    this.showCreateAgentModal.set(false);
  }

  saveNewAgent() {
    if (!this.newAgentName || !this.newAgentRole) return;
    
    const newAgent: AgentConfig = {
      id: `agt-new-${Math.floor(Math.random() * 1000)}`,
      name: this.newAgentName,
      role: this.newAgentRole,
      description: this.newAgentDesc,
      status: 'training',
      model: this.newAgentModel,
      temperature: this.newAgentTemp,
      systemPrompt: this.newAgentPrompt,
      icon: this.newAgentIcon,
      color: 'from-cyan-500 to-blue-600', // Default gradient for new ones
      tasksCompleted: 0,
      successRate: 0
    };

    this.agents.update(list => [...list, newAgent]);
    this.closeCreateAgent();
    
    this.actionAlert.set(`🚀 Nuevo agente "${newAgent.name}" desplegado exitosamente y en fase de entrenamiento.`);
    setTimeout(() => this.actionAlert.set(null), 4000);
  }

  generateAIAgentSuggestion() {
    if (this.isGeneratingAIAgent()) return;
    this.isGeneratingAIAgent.set(true);

    setTimeout(() => {
      const suggestions = [
        {
          name: 'Cobrador Compasivo',
          role: 'Gestor de Cartera Suave',
          desc: 'Agente especializado en negociar pagos atrasados usando psicología positiva. Entiende situaciones difíciles y propone planes de pago sin generar estrés o rechazo en el cliente.',
          prompt: 'Eres un especialista en cobros empático. Tu objetivo es recuperar cartera pero manteniendo la relación con el cliente a largo plazo. Ofrece refinanciaciones si notas ansiedad. Nunca uses un tono acusatorio.',
          icon: '🫂'
        },
        {
          name: 'Asesor Hipotecario',
          role: 'Especialista en Vivienda',
          desc: 'Guía a los clientes durante el complejo proceso de solicitar un crédito de vivienda. Explica tasas de interés, plazos y requerimientos legales con claridad absoluta.',
          prompt: 'Eres un experto hipotecario. Explica términos complejos como "Tasa Efectiva Anual" o "Amortización" de forma sencilla. Pide datos clave (ingresos, cuota inicial) progresivamente.',
          icon: '🏠'
        },
        {
          name: 'Analista Anti-Fraude',
          role: 'Auditor Transaccional en Tiempo Real',
          desc: 'Agente invisible que monitorea transacciones grandes o atípicas, interrogando gentilmente al usuario por WhatsApp antes de aprobar transferencias sospechosas.',
          prompt: 'Eres un analista de seguridad. Si notas un movimiento atípico, pregunta de forma amigable: "Hola, notamos un movimiento inusual. Para tu seguridad, ¿nos confirmas si fuiste tú?".',
          icon: '🕵️'
        }
      ];

      const randomSugg = suggestions[Math.floor(Math.random() * suggestions.length)];
      
      this.newAgentName = randomSugg.name;
      this.newAgentRole = randomSugg.role;
      this.newAgentDesc = randomSugg.desc;
      this.newAgentPrompt = randomSugg.prompt;
      this.newAgentIcon = randomSugg.icon;
      this.newAgentModel = 'gpt-4o';
      this.newAgentTemp = 0.7; // Creatividad extra para IA nueva

      this.isGeneratingAIAgent.set(false);
    }, 1800);
  }
}
