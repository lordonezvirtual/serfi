import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../services/mock-data.service';

export interface AgeDistribution {
  range: string;
  percentage: number;
}

export interface GenderDistribution {
  label: string;
  percentage: number;
}

export interface OlimpicaStore {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  zone: string;
  estrato: string;
  customerMetrics: {
    totalClients: number;
    avgAge: number;
    mainSegment: string;
    socioeconomicLevel: string;
    avgTicket: number;
    loyaltyRate: number;
    preferredChannel: string;
    ageDistribution: AgeDistribution[];
    genderDistribution: GenderDistribution[];
  };
  serfinanzaServices: {
    tarjetaOlimpicaPenetration: number;
    activeCreditCards: number;
    microloansDisbursed: number;
    cdtPlacements: number;
    digitalAccountsActive: number;
    creditAppUsage: number;
    preferredService: string;
    activePromoName: string;
    activePromoValue: string;
  };
  insights: string[];
}

@Component({
  selector: 'app-geomarketing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './geomarketing.html',
})
export class GeomarketingComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly dataService = inject(MockDataService);

  // Leaflet map reference
  private map: any;
  private markers: any[] = [];
  
  // Available map styles
  protected currentMapStyle = signal<'dark' | 'voyager' | 'osm'>('dark');
  private tileLayer: any;

  // Selected store signal
  protected selectedStore = signal<OlimpicaStore | null>(null);

  // Active tab in details card
  protected activeTab = signal<'clients' | 'serfinanza'>('clients');

  // Campaign launching status
  protected showToast = signal<boolean>(false);
  protected toastMessage = signal<string>('');

  // Stores Data List
  protected readonly stores: OlimpicaStore[] = [
    {
      id: 'prado',
      name: 'Olímpica Portal del Prado',
      address: 'Calle 53 # 46-192',
      lat: 10.9856,
      lng: -74.7885,
      zone: 'Centro-Norte',
      estrato: 'Estrato 3',
      customerMetrics: {
        totalClients: 18500,
        avgAge: 42,
        mainSegment: 'Familias Trabajadoras',
        socioeconomicLevel: 'Clase Media-Baja',
        avgTicket: 185000,
        loyaltyRate: 78,
        preferredChannel: 'WhatsApp Presencial',
        ageDistribution: [
          { range: '18-25', percentage: 12 },
          { range: '26-40', percentage: 38 },
          { range: '41-60', percentage: 35 },
          { range: '60+', percentage: 15 }
        ],
        genderDistribution: [
          { label: 'Mujeres', percentage: 56 },
          { label: 'Hombres', percentage: 44 }
        ]
      },
      serfinanzaServices: {
        tarjetaOlimpicaPenetration: 48,
        activeCreditCards: 8400,
        microloansDisbursed: 1240,
        cdtPlacements: 145,
        digitalAccountsActive: 3100,
        creditAppUsage: 35,
        preferredService: 'Avances en Efectivo en Caja',
        activePromoName: 'Miércoles de Plaza',
        activePromoValue: '25% de ahorro en víveres'
      },
      insights: [
        'Se observa un 22% de rechazo en compras por cupo límite los fines de semana. Oportunidad: Lanzar aumento proactivo de cupo mediante el Agente IA.',
        'El 64% de los usuarios prefiere pagar presencialmente en cajas. Implementar incentivos digitales en la App para pagos con PSE.',
        'Gran afinidad con el segmento familias. La campaña de electrodomésticos en el Sábado Madrugón tiene el mayor potencial aquí.'
      ]
    },
    {
      id: 'calle72',
      name: 'Olímpica Calle 72',
      address: 'Calle 72 # 46-07',
      lat: 10.9995,
      lng: -74.8055,
      zone: 'Comercial Prado',
      estrato: 'Estrato 4',
      customerMetrics: {
        totalClients: 24000,
        avgAge: 35,
        mainSegment: 'Profesionales & Estudiantes',
        socioeconomicLevel: 'Clase Media',
        avgTicket: 220000,
        loyaltyRate: 65,
        preferredChannel: 'App Móvil & Telegram',
        ageDistribution: [
          { range: '18-25', percentage: 25 },
          { range: '26-40', percentage: 48 },
          { range: '41-60', percentage: 20 },
          { range: '60+', percentage: 7 }
        ],
        genderDistribution: [
          { label: 'Mujeres', percentage: 51 },
          { label: 'Hombres', percentage: 49 }
        ]
      },
      serfinanzaServices: {
        tarjetaOlimpicaPenetration: 32,
        activeCreditCards: 7680,
        microloansDisbursed: 890,
        cdtPlacements: 280,
        digitalAccountsActive: 8900,
        creditAppUsage: 68,
        preferredService: 'Bolsillo Ahorro Digital',
        activePromoName: 'Tecnología Olímpica',
        activePromoValue: '12 cuotas sin interés Serfinanza'
      },
      insights: [
        'Zona de alta competencia con otros bancos. Ofrecer exención del 100% en cuota de manejo por compras > $200k al mes.',
        'Preferencia por WhatsApp/Telegram. Implementar un chatbot express con código QR en pasillos para entrega de Tarjeta de Crédito en 3 minutos.',
        'Bajo uso de avances en caja pero alto uso de transferencias digitales. Promocionar el CDT Digital con tasas del 12.8% E.A.'
      ]
    },
    {
      id: 'torcoroma',
      name: 'Olímpica Torcoroma',
      address: 'Calle 84 # 51B-12',
      lat: 11.0112,
      lng: -74.8215,
      zone: 'Norte Premium',
      estrato: 'Estrato 5-6',
      customerMetrics: {
        totalClients: 12000,
        avgAge: 54,
        mainSegment: 'Pensionados & Empresarios',
        socioeconomicLevel: 'Clase Alta',
        avgTicket: 480000,
        loyaltyRate: 85,
        preferredChannel: 'WhatsApp Asistido / Correo',
        ageDistribution: [
          { range: '18-25', percentage: 5 },
          { range: '26-40', percentage: 22 },
          { range: '41-60', percentage: 38 },
          { range: '60+', percentage: 35 }
        ],
        genderDistribution: [
          { label: 'Mujeres', percentage: 58 },
          { label: 'Hombres', percentage: 42 }
        ]
      },
      serfinanzaServices: {
        tarjetaOlimpicaPenetration: 24,
        activeCreditCards: 2880,
        microloansDisbursed: 150,
        cdtPlacements: 1890,
        digitalAccountsActive: 1950,
        creditAppUsage: 25,
        preferredService: 'CDT Plazo Fijo & Gold/Black TC',
        activePromoName: 'Licores & Dermocosmética',
        activePromoValue: '15% Cashback con Tarjeta Black'
      },
      insights: [
        'El 40% del fondeo del banco proviene de pensionados de esta zona. Sugerencia: Ofrecer exención total de cuotas en CDT.',
        'Preferencia por atención RAG/HITL asistida en WhatsApp. Evitar envíos masivos impersonales e incentivar asesoría personalizada.',
        'Gran potencial de captación: El saldo promedio de cuentas de ahorro es 4.5 veces mayor que el promedio de la ciudad.'
      ]
    },
    {
      id: 'boston',
      name: 'Olímpica Boston',
      address: 'Calle 61 # 44-50',
      lat: 10.9882,
      lng: -74.7952,
      zone: 'Histórico Residencial',
      estrato: 'Estrato 3',
      customerMetrics: {
        totalClients: 15200,
        avgAge: 46,
        mainSegment: 'Familias & Microempresarios',
        socioeconomicLevel: 'Clase Media-Media',
        avgTicket: 165000,
        loyaltyRate: 82,
        preferredChannel: 'WhatsApp Chat & SMS',
        ageDistribution: [
          { range: '18-25', percentage: 10 },
          { range: '26-40', percentage: 32 },
          { range: '41-60', percentage: 40 },
          { range: '60+', percentage: 18 }
        ],
        genderDistribution: [
          { label: 'Mujeres', percentage: 54 },
          { label: 'Hombres', percentage: 46 }
        ]
      },
      serfinanzaServices: {
        tarjetaOlimpicaPenetration: 52,
        activeCreditCards: 7900,
        microloansDisbursed: 1950,
        cdtPlacements: 210,
        digitalAccountsActive: 2800,
        creditAppUsage: 30,
        preferredService: 'Microcrédito Capital de Trabajo',
        activePromoName: 'Sábado Madrugón',
        activePromoValue: '30% descuento en marcas Olímpica'
      },
      insights: [
        'El 35% de los clientes son tenderos o pequeños comerciantes. Lanzar la línea de microcrédito "Serfinanza Aliado" con aprobación inmediata.',
        'El "Sábado Madrugón" genera filas extensas en caja. Posicionar un agente móvil con tablet Serfinanza para originar créditos en pasillo.',
        'Oportunidad RAG: Muchos clientes preguntan por tasas de interés de compras diferidas. Automatizar respuestas mediante WhatsApp bot.'
      ]
    },
    {
      id: 'murillo',
      name: 'Olímpica Murillo (La 14)',
      address: 'Calle 45 # 14-11',
      lat: 10.9575,
      lng: -74.7985,
      zone: 'Sur Metropolitana',
      estrato: 'Estrato 2-3',
      customerMetrics: {
        totalClients: 29500,
        avgAge: 41,
        mainSegment: 'Hogares & Empleados',
        socioeconomicLevel: 'Clase Popular Trab.',
        avgTicket: 110000,
        loyaltyRate: 74,
        preferredChannel: 'SMS & WhatsApp Express',
        ageDistribution: [
          { range: '18-25', percentage: 15 },
          { range: '26-40', percentage: 37 },
          { range: '41-60', percentage: 36 },
          { range: '60+', percentage: 12 }
        ],
        genderDistribution: [
          { label: 'Mujeres', percentage: 61 },
          { label: 'Hombres', percentage: 39 }
        ]
      },
      serfinanzaServices: {
        tarjetaOlimpicaPenetration: 64,
        activeCreditCards: 18880,
        microloansDisbursed: 4210,
        cdtPlacements: 68,
        digitalAccountsActive: 4900,
        creditAppUsage: 22,
        preferredService: 'Avances Express & Pago de Servicios',
        activePromoName: 'Madrugón de Alimentos',
        activePromoValue: 'Precios de costo pagando con Tarjeta'
      },
      insights: [
        'Es el punto con mayor facturación global y colocación de Tarjetas Olímpica de Barranquilla (64% de penetración).',
        'Alta tasa de mora temprana (1-30 días). Solución: Configurar alertas automáticas de pago vía SMS personalizadas 3 días antes del corte.',
        'Gran potencial de inclusión financiera. Promover la apertura de "Cuenta de Ahorro Digital Cero Costo" directo en las tirillas de pago.'
      ]
    },
    {
      id: 'metropolitana',
      name: 'Olímpica Metropolitana',
      address: 'Calle 45 (Av. Murillo) # 1G-30',
      lat: 10.9325,
      lng: -74.8048,
      zone: 'Sur Oriente Estadio',
      estrato: 'Estrato 2',
      customerMetrics: {
        totalClients: 21000,
        avgAge: 37,
        mainSegment: 'Hogares Jóvenes & Trabajadores',
        socioeconomicLevel: 'Clase Popular',
        avgTicket: 95000,
        loyaltyRate: 70,
        preferredChannel: 'SMS & Redes Sociales',
        ageDistribution: [
          { range: '18-25', percentage: 22 },
          { range: '26-40', percentage: 41 },
          { range: '41-60', percentage: 28 },
          { range: '60+', percentage: 9 }
        ],
        genderDistribution: [
          { label: 'Mujeres', percentage: 53 },
          { label: 'Hombres', percentage: 47 }
        ]
      },
      serfinanzaServices: {
        tarjetaOlimpicaPenetration: 58,
        activeCreditCards: 12180,
        microloansDisbursed: 3120,
        cdtPlacements: 42,
        digitalAccountsActive: 3950,
        creditAppUsage: 18,
        preferredService: 'Retiros sin Tarjeta & Giros',
        activePromoName: 'Súper Puntos Juniorista',
        activePromoValue: 'Doble acumulación los días de partido'
      },
      insights: [
        'Fuerte estacionalidad durante los días de partido del Junior. Diseñar combos de licores y carnes frías con 30% de descuento usando Tarjeta.',
        'Solo el 15% tiene instalada la App móvil de Serfinanza. Campaña: Descuento inmediato de $20,000 en cajas al activar la App.',
        'Implementar tótems de auto-atención digital Serfinanza para retiros rápidos de avances y giros, reduciendo colas del 35% en horas pico.'
      ]
    }
  ];

  ngOnInit() {
    // Select first store by default
    this.selectedStore.set(this.stores[0]);
  }

  ngAfterViewInit() {
    this.loadLeaflet()
      .then((L) => {
        this.initMap(L);
      })
      .catch((err) => {
        console.error('Error al cargar Leaflet de manera dinámica:', err);
      });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  // Load Leaflet dynamically to secure run-time and build safety
  private loadLeaflet(): Promise<any> {
    if ((window as any).L) {
      return Promise.resolve((window as any).L);
    }
    return new Promise((resolve, reject) => {
      // 1. Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);

      // 2. Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => {
        resolve((window as any).L);
      };
      script.onerror = (err) => {
        reject(err);
      };
      document.body.appendChild(script);
    });
  }

  private initMap(L: any) {
    // 1. Initialize map centered in Barranquilla
    this.map = L.map('leaflet-map', {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([10.9785, -74.8020], 13);

    // 2. Set Tile Layer according to current selected style
    this.updateTileLayer(L);

    // 3. Create Custom Premium Markers for stores
    this.createMarkers(L);
  }

  private updateTileLayer(L: any) {
    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }

    const style = this.currentMapStyle();
    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'; // default dark
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    if (style === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (style === 'voyager') {
      url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }

    this.tileLayer = L.tileLayer(url, {
      attribution: attribution,
      maxZoom: 20
    }).addTo(this.map);
  }

  // Handle map style toggle
  protected setMapStyle(style: 'dark' | 'voyager' | 'osm') {
    this.currentMapStyle.set(style);
    const L = (window as any).L;
    if (L) {
      this.updateTileLayer(L);
    }
  }

  private createMarkers(L: any) {
    // Clear previous markers if any
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    // Pin custom icon design
    const defaultColor = '#1E4D8C'; // Serfinanza Blue
    const selectedColor = '#C00000'; // Serfinanza Red

    this.stores.forEach(store => {
      // Define a custom HTML marker for premium look and feel
      const isSelected = this.selectedStore()?.id === store.id;
      const color = isSelected ? selectedColor : defaultColor;
      const sizeClass = isSelected ? 'scale-115 shadow-xl' : 'hover:scale-110';

      // Beautiful SVG pin with logo or text
      const iconHtml = `
        <div class="relative flex items-center justify-center transition-all duration-300 ${sizeClass}" style="width: 42px; height: 42px;">
          <!-- Pulse animation for the selected store -->
          ${isSelected ? `
            <span class="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60 animate-ping" style="animation-duration: 2s;"></span>
          ` : ''}
          <!-- Map Pin marker structure -->
          <svg class="h-10 w-10 filter drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="${color}"/>
          </svg>
          <!-- Center label -->
          <div class="absolute text-[8px] font-black text-white" style="bottom: 18px;">🛒</div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      const marker = L.marker([store.lat, store.lng], { icon: customIcon })
        .addTo(this.map)
        .bindTooltip(`
          <div class="p-2 font-sans">
            <p class="font-extrabold text-slate-800 text-xs">${store.name}</p>
            <p class="text-slate-500 text-[10px] mt-0.5">${store.address}</p>
            <span class="inline-block bg-slate-100 text-[#1E4D8C] text-[9px] font-bold px-1.5 py-0.5 rounded mt-1">${store.zone}</span>
          </div>
        `, {
          permanent: false,
          direction: 'top',
          className: 'leaflet-tooltip-premium'
        });

      // Handle marker selection clicks
      marker.on('click', () => {
        this.selectStore(store);
      });

      this.markers.push(marker);
    });
  }

  // Select store and zoom/re-pan
  protected selectStore(store: OlimpicaStore) {
    this.selectedStore.set(store);
    
    // Zoom and pan to coordinates slightly off center to let details card look balanced on larger screen
    if (this.map) {
      this.map.setView([store.lat, store.lng], 15, {
        animate: true,
        duration: 1.0
      });
    }

    // Refresh markers to update colors and animations
    const L = (window as any).L;
    if (L) {
      this.createMarkers(L);
    }
  }

  // Focus view on specific city zones
  protected focusZone(zone: 'all' | 'norte' | 'sur') {
    if (!this.map) return;

    if (zone === 'all') {
      this.map.setView([10.9785, -74.8020], 13, { animate: true });
    } else if (zone === 'norte') {
      this.map.setView([11.008, -74.816], 14.5, { animate: true });
    } else if (zone === 'sur') {
      this.map.setView([10.948, -74.801], 14.5, { animate: true });
    }
  }

  // Launcher action back to the Human-in-the-Loop approval dashboard
  protected launchAICampaign(store: OlimpicaStore) {
    // Generate a new HITLTask in the central queue
    const taskId = 'geomarketing-task-' + Date.now();
    const targetClientsCount = Math.round(store.customerMetrics.totalClients * 0.15); // e.g. 15% VIP
    
    const newTask = {
      id: taskId,
      clientName: `Campaña: Aumento de Cupo ${store.name.split('Olímpica ')[1] || store.name}`,
      clientSegment: `Segmento VIP ${store.name.split('Olímpica ')[1] || store.name} (${targetClientsCount} cls)`,
      agentName: 'Agente Retail Olimpica',
      taskType: 'Difusión de Campaña',
      description: `Campaña proactiva gatillada vía Geomarketing GIS. Envío de aumentos temporales de cupo para el próximo Sábado Madrugón en la sucursal ${store.name}.`,
      proposedValue: `Aumento de 25% de cupo para ${targetClientsCount} tarjetahabientes AAA`,
      confidence: 98,
      status: 'pending' as const,
      timeAgo: 'Hace 1 seg',
      ragDocUsed: 'Calendario de eventos especiales',
      transcriptDialog: `Agente Geomarketing: "Propuesta de campaña basada en análisis espacial del mapa GIS. Olímpica ${store.name.split('Olímpica ')[1]} registra una utilización de tarjeta de crédito del 74% y una mora temprana baja (<1.5%). El retorno comercial proyectado es del +14.2%."`
    };

    // Update HITL task list inside the MockDataService so it appears live in control board!
    this.dataService.hitlTasks.update((tasks) => [newTask, ...tasks]);

    // Add a live green alert too!
    this.dataService.alerts.update((alerts) => [
      {
        id: String(Date.now()),
        severity: 'green',
        message: `Geomarketing: Nueva campaña de marketing de fidelización propuesta para Olímpica ${store.name.split('Olímpica ')[1] || store.name} (${targetClientsCount} clientes).`,
        timeAgo: 'Ahora mismo'
      },
      ...alerts
    ]);

    // Show beautiful toast notification
    this.toastMessage.set(`🚀 ¡Campaña para ${store.name} enviada con éxito a la Cola de Auditoría HITL!`);
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 4500);
  }

  // Simulated GIS report download action
  protected exportGISReport() {
    this.toastMessage.set('📊 Exportando modelo espacial y caracterización GIS en formato GeoJSON...');
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }
}
