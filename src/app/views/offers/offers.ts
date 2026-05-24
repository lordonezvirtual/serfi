import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MockDataService, Offer } from '../../services/mock-data.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offers.html',
})
export class OffersComponent implements OnInit, AfterViewInit {
  private readonly dataService = inject(MockDataService);
  private readonly router = inject(Router);

  // Offers signal from service
  protected readonly offers = this.dataService.offers;

  // New offer form modal state
  protected showCreateModal = signal<boolean>(false);
  protected actionAlert = signal<string | null>(null);

  // Form model
  protected newOfferTitle = '';
  protected newOfferDesc = '';
  protected newOfferSegment = 'Ahorradores sin CDT';
  protected newOfferChannel = 'WhatsApp';
  protected newOfferTrigger = '';
  protected newOfferPriority = 3;
  protected newOfferActive = true;

  @ViewChild('conversionChart') private conversionChartRef!: ElementRef<HTMLCanvasElement>;
  private chartInstance?: Chart;

  // Available segments & channels
  protected readonly segments = [
    'Ahorradores sin CDT',
    'Tarjetahabientes Olímpica',
    'Clientes con buen historial',
    'Adulto Mayor (Sin App 30d)',
    'Compradores de carnes',
    'Mujeres 25-55 años',
    'Deudores recurrentes',
    'Asesores nuevos < 90 días'
  ];

  protected readonly channels = [
    'WhatsApp',
    'Telegram',
    'Web',
    'WhatsApp, Telegram',
    'WhatsApp, SMS',
    'Instagram',
    'Internal copilot'
  ];

  ngOnInit() {}

  ngAfterViewInit() {
    this.initChart();
  }

  private initChart() {
    const ctx = this.conversionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [
          'Adulto mayor 50+ (WhatsApp)',
          'Tarjetahabiente Olimpica',
          'Inversionista CDT',
          'Cliente nuevo',
          'Asesor interno'
        ],
        datasets: [
          {
            label: 'Tasa de Conversión Semanal (%)',
            data: [78, 65, 54, 42, 91],
            backgroundColor: [
              '#C00000', // Red
              '#1E4D8C', // Navy
              '#10B981', // Green
              '#F59E0B', // Amber
              '#6366F1'  // Indigo
            ],
            borderRadius: 6,
            barThickness: 32
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0F172A',
            padding: 10,
            callbacks: {
              label: (context) => ` ${context.parsed.y}% de conversión`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 10, weight: 'bold' }, color: '#475569' }
          },
          y: {
            grid: { color: '#E2E8F0' },
            border: { display: false },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#64748B',
              callback: (value) => `${value}%`
            },
            max: 100
          }
        }
      }
    });
  }

  // Toggle active / paused offer
  protected toggleOfferStatus(id: number) {
    this.dataService.toggleOffer(id);
    this.actionAlert.set(`Estado de la oferta cambiado exitosamente.`);
    setTimeout(() => this.actionAlert.set(null), 3000);
  }

  // Save new offer
  protected saveNewOffer() {
    if (!this.newOfferTitle || !this.newOfferDesc) return;

    const offerObj: Offer = {
      id: Math.floor(Math.random() * 1000) + 10,
      title: this.newOfferTitle,
      description: this.newOfferDesc,
      targetSegment: this.newOfferSegment,
      channel: this.newOfferChannel,
      metricLabel: 'Conversión estimada',
      metricValue: '+15%',
      isActive: this.newOfferActive,
      priority: this.newOfferPriority,
      triggerCondition: this.newOfferTrigger || 'Condición personalizada',
    };

    this.dataService.addOffer(offerObj);
    this.showCreateModal.set(false);

    // Clean form
    this.newOfferTitle = '';
    this.newOfferDesc = '';
    this.newOfferTrigger = '';

    // Set success banner
    this.actionAlert.set(`✅ Oferta "${offerObj.title}" creada y cargada en el motor de campañas.`);
    setTimeout(() => this.actionAlert.set(null), 4000);
  }

  // Preview in Chat redirection (Hackathon shortcut)
  protected previewInChat(offer: Offer) {
    // We map segments to demo profile IDs to make the jump smart and relevant!
    // María Amparo (Adulto Mayor) / Carlos Herrera (Digital Activo) / Juliana (Asesor)
    let profileId = 'maria';
    if (offer.targetSegment.toLowerCase().includes('digital') || offer.targetSegment.toLowerCase().includes('historial') || offer.targetSegment.toLowerCase().includes('cdt')) {
      profileId = 'carlos';
    } else if (offer.targetSegment.toLowerCase().includes('asesor') || offer.targetSegment.toLowerCase().includes('onboarding')) {
      profileId = 'juliana';
    }

    // Go to chat. The active welcome triggers automatically on redirect.
    this.router.navigate(['/chat']).then(() => {
      // Small delay just to let page transition, then we alert the tester
      setTimeout(() => {
        alert(`Demostración: Has saltado al Chat para previsualizar la oferta de "${offer.title}". Escribe "saldo" o selecciona el caso rápido correspondiente para ver al agente presentarla.`);
      }, 500);
    });
  }
}
