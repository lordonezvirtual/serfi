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

  // Sub-view Tab state
  protected activeSubView = signal<'documents' | 'scraper' | 'translator'>('documents');

  // Scraper Tab State
  protected scraperUrl = 'https://www.serfinanza.com.co/tasas-y-tarifas';
  protected customRateCDT = 12.50;
  protected customBenefit = '';
  protected isScraping = signal<boolean>(false);
  protected scrapingStep = signal<string>('');
  protected scrapProgress = signal<number>(0);
  protected hasScraped = signal<boolean>(false);
  protected scrapedRates = signal<any[]>([]);
  protected scrapedBenefits = signal<any[]>([]);
  protected detectedChanges = signal<boolean>(false);

  // Translator Tab State
  protected technicalInput = 'Tasa CDT 90 días: Tasa autorizada del 10.25% E.A., con cobro del GMF 4x1000 exento por retiros de montos menores a 10 millones de pesos.';
  protected friendlyOutput = signal<string>('');
  protected isTranslating = signal<boolean>(false);

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

  // Trigger Autonomous Scraper Simulation
  protected async runPortfolioScrape() {
    this.isScraping.set(true);
    this.scrapProgress.set(5);
    this.scrapingStep.set('Iniciando Worker Autónomo de Portafolio...');

    const steps = [
      { progress: 15, step: 'Conectando a ' + this.scraperUrl + '...' },
      { progress: 35, step: 'Scraping de tablas HTML completado. Analizando nodos de tasas y tarifas...' },
      { progress: 55, step: 'Extrayendo valores financieros de captación y beneficios vigentes...' },
      { progress: 75, step: 'Procesando chunking semántico y generando embeddings vectoriales (Azure OpenAI)...' },
      { progress: 90, step: 'Subiendo embeddings a la base de datos vectorial e indexando...' },
      { progress: 100, step: 'Base de conocimiento RAG actualizada exitosamente.' }
    ];

    for (const s of steps) {
      await new Promise(resolve => setTimeout(resolve, 350));
      this.scrapProgress.set(s.progress);
      this.scrapingStep.set(s.step);
    }

    try {
      const res = await fetch('http://localhost:8000/api/portfolio/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: this.scraperUrl,
          force_rate_change: this.customRateCDT,
          force_benefit_change: this.customBenefit || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        this.scrapedRates.set(data.extracted_rates);
        this.scrapedBenefits.set(data.extracted_benefits);
        this.detectedChanges.set(data.detected_changes);

        // If rate was changed, update documents and add a new dynamic auto-scraped document for visual wow
        if (data.detected_changes) {
          const formattedRate = `${this.customRateCDT.toFixed(2)}% E.A.`;
          
          // 1. Update the mock document in MockDataService
          this.dataService.documents.update(docs => 
            docs.map(d => 
              d.title.includes('Reglamento SuperCDT') 
                ? { ...d, lastUpdated: 'Auto-Sincronizado Hoy', chunks: d.chunks + 1 }
                : d
            )
          );

          // 2. Add an "Auto-Scraped Update" document
          const scraperDocId = 'doc-scraped-' + Date.now();
          const newScrapedDoc: RAGDocument = {
            id: scraperDocId,
            title: `Autónomo: Actualización de Tasas CDT (${formattedRate})`,
            category: 'Productos bancarios',
            lastUpdated: 'Hace un momento',
            chunks: 5,
            confidence: 99
          };
          this.dataService.documents.update(items => [newScrapedDoc, ...items]);
        }
      }
    } catch (err) {
      console.warn("Backend scraper endpoint not reachable, running high fidelity mock scraper", err);
      // Fallback:
      const formattedRate = `${this.customRateCDT.toFixed(2)}% E.A.`;
      this.scrapedRates.set([
        { product: 'Súper CDT Olímpica 90 días', rate: '10.25% E.A.', old_rate: '10.25% E.A.' },
        { product: 'Súper CDT Olímpica 180 días', rate: '11.50% E.A.', old_rate: '11.50% E.A.' },
        { product: 'Súper CDT Olímpica 360 días', rate: formattedRate, old_rate: '12.50% E.A.' },
        { product: 'Cuenta de Ahorros Estándar', rate: '3.00% E.A.', old_rate: '3.00% E.A.' }
      ]);

      const initialBenefits = [
        { product: 'Tarjeta Olímpica', benefit: '30% descuento en electrodomésticos en Sábado Madrugón.', status: 'Vigente' },
        { product: 'Tarjeta Olímpica', benefit: '20% descuento en frutas y verduras en Miércoles de Plaza.', status: 'Vigente' }
      ];

      if (this.customBenefit) {
        initialBenefits.push({
          product: 'Tarjeta Olímpica',
          benefit: this.customBenefit,
          status: '¡NUEVO BENEFICIO DETECTADO!'
        });
      }

      this.scrapedBenefits.set(initialBenefits);
      this.detectedChanges.set(true);

      // Update documents list
      this.dataService.documents.update(docs => 
        docs.map(d => 
          d.title.includes('Reglamento SuperCDT') 
            ? { ...d, lastUpdated: 'Auto-Sincronizado Hoy', chunks: d.chunks + 1 }
            : d
        )
      );

      const scraperDocId = 'doc-scraped-' + Date.now();
      const newScrapedDoc: RAGDocument = {
        id: scraperDocId,
        title: `Autónomo: Actualización de Tasas CDT (${formattedRate})`,
        category: 'Productos bancarios',
        lastUpdated: 'Hace un momento',
        chunks: 5,
        confidence: 99
      };
      this.dataService.documents.update(items => [newScrapedDoc, ...items]);
    }

    this.isScraping.set(false);
    this.hasScraped.set(true);
    this.actionSuccess.set('✅ Sincronización de Portafolio Autónoma Completada. ¡Se detectaron cambios e indexaron nuevos embeddings vectoriales!');
  }

  // Reset Scraper View
  protected resetScraper() {
    this.hasScraped.set(false);
    this.scrapedRates.set([]);
    this.scrapedBenefits.set([]);
    this.detectedChanges.set(false);
    this.customBenefit = '';
  }

  // Trigger Senior Language Friendly Translation
  protected async runUX50Translation() {
    if (!this.technicalInput.trim()) return;
    this.isTranslating.set(true);
    this.friendlyOutput.set('');

    try {
      const res = await fetch('http://localhost:8000/api/portfolio/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technical_text: this.technicalInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        this.friendlyOutput.set(data.translation);
      }
    } catch (err) {
      console.warn("Backend translation endpoint not reachable, running local rules-based simulation", err);
      // Fallback
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const t = this.technicalInput.toLowerCase();
      if (t.includes('10.25') || t.includes('90')) {
        this.friendlyOutput.set(
          "👵 **¡Hola mi señora linda!** Qué alegría saludarla hoy. 🌸\n\n" +
          "Para los **3 meses** (90 días) por los que me pregunta, nuestro banco le ofrece una tasa maravillosa del **10.25% E.A.** " +
          "Eso significa, en palabras sencillas, que por cada monedita que guarde con nosotros, su **platica ganará de forma muy segura** un rendimiento muy bonito. " +
          "Es como sembrar una semillita y verla crecer sin riesgos. ¡Su platica estará durmiendo segura mientras gana dinero para sus gustos o sus nietos!\n\n" +
          "Y lo mejor de todo es que el impuesto del **4 por mil no se lo cobrarán** si retira montos de menos de 10 millones. ¡Todo es para consentirla!"
        );
      } else if (t.includes('12.5') || t.includes('360')) {
        this.friendlyOutput.set(
          "👴 **¡Hola mi estimado caballero!** Qué gusto saludarlo en este lindo día. 👔\n\n" +
          "Si decide guardar sus ahorros con nosotros durante **un año completo** (360 días), le tenemos una noticia excelente: " +
          "su dinero ganará una tasa súper especial del **12.50% E.A.**\n\n" +
          "Esto significa que su platica estará **totalmente protegida y creciendo a paso firme**. Por ejemplo, si decide guardar su platica en el **Súper CDT Olímpica**, " +
          "al final del año recibirá sus ahorros completitos más un extra muy generoso para que disfrute con total tranquilidad.\n\n" +
          "¿Desea que le hagamos una simulación exacta con el monto que tiene pensado invertir?"
        );
      } else {
        this.friendlyOutput.set(
          "👵 **¡Hola mi señora linda!** Qué gusto me da saludarla en este día. 🌸\n\n" +
          "Le traduzco estos datos tan fríos del banco en palabras muy sencillas: lo que nos dice el papel es que **su dinero estará muy seguro** y le dará **excelentes ganancias** sin sorpresas raras de cobros. " +
          "Además, con su **Tarjeta Olímpica** o su cuenta, su platica rinde mucho más y está completamente protegida por nuestras normas seguras.\n\n" +
          "¡Aquí estoy para cuidarle su platica y explicárselo todo con calma y una sonrisa!"
        );
      }
    }

    this.isTranslating.set(false);
  }
}
