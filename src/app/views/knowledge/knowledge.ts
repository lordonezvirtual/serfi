import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, RAGDocument } from '../../services/mock-data.service';

export interface RetrievedChunk {
  title: string;
  category: string;
  relevance: number;
  text: string;
}

@Component({
  selector: 'app-knowledge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knowledge.html',
})
export class KnowledgeComponent {
  private readonly dataService = inject(MockDataService);

  // Exposed list of documents
  protected readonly documents = this.dataService.documents;

  // Search and Category filters
  protected searchKeyword = signal<string>('');
  protected activeCategory = signal<string>('Todos');

  // Filtered documents list using computed signals
  protected filteredDocuments = computed(() => {
    const search = this.searchKeyword().toLowerCase().trim();
    const category = this.activeCategory();
    const list = this.documents();

    return list.filter((doc) => {
      const matchesSearch = doc.title.toLowerCase().includes(search) || 
                            doc.category.toLowerCase().includes(search);
      const matchesCategory = category === 'Todos' || doc.category === category;
      return matchesSearch && matchesCategory;
    });
  });

  // Action status simulation signals
  protected actionProgress = signal<string | null>(null);
  protected actionSuccess = signal<string | null>(null);
  protected showLowConfidenceModal = signal<boolean>(false);
  protected showUploadModal = signal<boolean>(false);

  // RAG query tester form
  protected queryTesterInput = '';
  protected retrievedChunks = signal<RetrievedChunk[]>([]);
  protected tested = signal<boolean>(false);

  // Categories list
  protected readonly categories = [
    'Todos',
    'Productos bancarios',
    'Procesos operativos',
    'Catálogo Olimpica',
    'Regulatorio'
  ];

  // Set category filter
  protected selectCategory(category: string) {
    this.activeCategory.set(category);
  }

  // Trigger RAG tester logic
  protected runRAGTest() {
    if (!this.queryTesterInput.trim()) return;
    this.tested.set(false);
    
    // Simulate embeding delay
    setTimeout(() => {
      const q = this.queryTesterInput.toLowerCase();
      let results: RetrievedChunk[] = [];

      if (q.includes('saldo') || q.includes('ahorro') || q.includes('cuenta')) {
        results = [
          {
            title: 'Guía cuenta de ahorros',
            category: 'Productos bancarios',
            relevance: 98,
            text: '...El saldo disponible de la Cuenta de Ahorros Serfinanza ($1,847,320 COP) puede ser visualizado en tiempo real a través de canales integrados. Las consultas por WhatsApp no tienen cobros de comisión y respetan las directrices vigentes...'
          },
          {
            title: 'Procedimiento extracto digital',
            category: 'Procesos operativos',
            relevance: 89,
            text: '...Para la expedición del extracto de cuenta de ahorros mensual, el sistema genera un PDF protegido por contraseña. La clave por defecto corresponde al número de identificación del tarjetahabiente...'
          },
          {
            title: 'Tarifas Superfinanciera 2026',
            category: 'Regulatorio',
            relevance: 74,
            text: '...Las tasas máximas de captación de cuentas de ahorro en el mercado colombiano para el año fiscal 2026 están vigiladas por la Superintendencia Financiera bajo los topes de rentabilidad vigentes...'
          }
        ];
      } else if (q.includes('cdt') || q.includes('supercdt') || q.includes('inver')) {
        results = [
          {
            title: 'Reglamento SuperCDT v3.2',
            category: 'Productos bancarios',
            relevance: 99,
            text: '...El producto comercial SuperCDT ofrece rentabilidades del 12.5% E.A. para captaciones a plazos fijos de 360 días. El monto mínimo de apertura es de $1,000,000 COP y requiere una cuenta corriente o de ahorros vinculada...'
          },
          {
            title: 'Tarifario Tarjeta Olimpica 2026',
            category: 'Productos bancarios',
            relevance: 85,
            text: '...Los inversionistas de SuperCDT tienen beneficios especiales en la Tarjeta de Crédito Olímpica, incluyendo la exoneración temporal de cuota de manejo e incremento de puntuación de scoring crediticio...'
          },
          {
            title: 'Tarifas Superfinanciera 2026',
            category: 'Regulatorio',
            relevance: 80,
            text: '...Las colocaciones a plazos fijos (CDT) están cobijadas bajo el seguro de depósito obligatorio FOGAFIN que garantiza el reintegro de hasta 50 millones de pesos por titular...'
          }
        ];
      } else if (q.includes('olimpica') || q.includes('oferta') || q.includes('plaza') || q.includes('miércoles') || q.includes('viernes')) {
        results = [
          {
            title: 'Ofertas semanales (auto-sync lunes)',
            category: 'Catálogo Olimpica',
            relevance: 97,
            text: '...El Miércoles de Plaza de Olímpica ofrece el 30% de descuento directo en frutas y verduras seleccionadas. El Viernes de Carnes entrega 25% de descuento en pollo entero, lomo y costilla pagando con Tarjeta Serfinanza...'
          },
          {
            title: 'Beneficios Tarjeta Olimpica',
            category: 'Catálogo Olimpica',
            relevance: 92,
            text: '...La Tarjeta Olímpica co-branded con Banco Serfinanza permite acumulación doble de Super Puntos y da acceso preferencial a eventos especiales de Olímpica (Sábados Madrugones con 30% en electrodomésticos)...'
          },
          {
            title: 'Calendario de eventos especiales',
            category: 'Catálogo Olimpica',
            relevance: 84,
            text: '...Los eventos de Sábado Madrugón se ejecutan en horarios de 4:00 AM a 9:00 AM. La validación del descuento se efectúa en las cajas registradoras de Supertiendas Olímpica tras deslizar el plástico Serfinanza...'
          }
        ];
      } else {
        results = [
          {
            title: 'Política Habeas Data',
            category: 'Regulatorio',
            relevance: 88,
            text: '...El consentimiento del cliente para el procesamiento de sus datos bancarios personales en Banco Serfinanza se enmarca dentro de las políticas de Habeas Data estipuladas por la Ley 1581 de 2012 de la República de Colombia...'
          },
          {
            title: 'Actualización de datos paso a paso',
            category: 'Procesos operativos',
            relevance: 78,
            text: '...El procedimiento de actualización segura de datos exige validar de forma presencial o por videollamada cifrada la identidad del usuario, antes de registrar modificaciones en la base de datos de CRM Salesforce...'
          },
          {
            title: 'Guía cuenta de ahorros',
            category: 'Productos bancarios',
            relevance: 70,
            text: '...El reglamento de la cuenta exige al cliente notificar de forma inmediata cambios en su dirección de correspondencia física o correo electrónico para el envío de notificaciones de seguridad...'
          }
        ];
      }

      this.retrievedChunks.set(results);
      this.tested.set(true);
    }, 800);
  }

  // Trigger Re-index all simulation
  protected triggerReindex() {
    this.actionSuccess.set(null);
    this.actionProgress.set('Re-indexando base RAG y actualizando embeddings en base vectorial Azure AI...');
    
    setTimeout(() => {
      this.actionProgress.set(null);
      this.actionSuccess.set('✅ Base RAG re-indexada con éxito: 2,847 documentos vectorizados y sincronizados en 245ms promedio.');
    }, 2000);
  }

  // Trigger Olimpica Catalog Sync simulation
  protected triggerOlimpicaSync() {
    this.actionSuccess.set(null);
    this.actionProgress.set('Raspando catálogo y sincronizando API de Supertiendas Olímpica...');
    
    setTimeout(() => {
      this.actionProgress.set(null);
      this.actionSuccess.set('✅ Catálogo Olímpica sincronizado exitosamente. Cargadas ofertas de "Miércoles de Plaza" y "Viernes de Carnes".');
      
      // Update mock sync time
      this.dataService.documents.update((docs) =>
        docs.map((doc) =>
          doc.id === 'doc-8' ? { ...doc, lastUpdated: 'Hace 1 min', chunks: 47 } : doc
        )
      );
    }, 1800);
  }

  // Upload file mock form submit
  protected uploadFile() {
    this.showUploadModal.set(false);
    this.actionSuccess.set('✅ Documento cargado exitosamente. Sometido a chunking y re-indexación vectorial de inmediato.');
    
    // Add new mock document to list
    const newDoc: RAGDocument = {
      id: 'doc-uploaded-' + Math.random(),
      title: 'Manual de Beneficios Ahorro Programado v1.1',
      category: 'Productos bancarios',
      lastUpdated: 'Hace un momento',
      chunks: 14,
      confidence: 96,
    };
    
    this.dataService.documents.update((items) => [newDoc, ...items]);
  }
}
