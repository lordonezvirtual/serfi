import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, AgentMetric, IntegrationMetric, HITLTask } from '../../services/mock-data.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private readonly dataService = inject(MockDataService);
  
  // Expose signals to template
  protected readonly kpis = this.dataService.kpis;
  protected readonly internalAgents = this.dataService.internalAgents;
  protected readonly externalIntegrations = this.dataService.externalIntegrations;
  protected readonly alerts = this.dataService.alerts;
  protected readonly hitlTasks = this.dataService.hitlTasks;

  // HITL state management
  protected selectedHITLTask = signal<HITLTask | null>(null);
  protected hitlFilter = signal<'pending' | 'history'>('pending');
  protected isPlayingAudio = signal<boolean>(false);
  protected audioProgress = signal<number>(0);
  private audioInterval?: any;
  protected operatorNotesInput = '';

  @ViewChild('channelChart') private channelChartRef!: ElementRef<HTMLCanvasElement>;
  private chartInstance?: Chart;

  // Filter tasks based on selected tab ('pending' vs approved/rejected 'history')
  protected getFilteredTasks(): HITLTask[] {
    const filter = this.hitlFilter();
    const tasks = this.hitlTasks();
    if (filter === 'pending') {
      return tasks.filter(t => t.status === 'pending');
    } else {
      return tasks.filter(t => t.status === 'approved' || t.status === 'rejected');
    }
  }

  // Open detail modal
  protected openHITLDetail(task: HITLTask) {
    this.selectedHITLTask.set(task);
    this.operatorNotesInput = '';
    this.isPlayingAudio.set(false);
    this.audioProgress.set(0);
    if (this.audioInterval) clearInterval(this.audioInterval);
  }

  // Close detail modal
  protected closeHITLDetail() {
    this.selectedHITLTask.set(null);
    this.isPlayingAudio.set(false);
    this.audioProgress.set(0);
    if (this.audioInterval) clearInterval(this.audioInterval);
  }

  // Toggle simulated audio playback for voice verification
  protected toggleAudio() {
    if (this.isPlayingAudio()) {
      this.isPlayingAudio.set(false);
      if (this.audioInterval) clearInterval(this.audioInterval);
    } else {
      this.isPlayingAudio.set(true);
      this.audioProgress.set(0);
      this.audioInterval = setInterval(() => {
        if (this.audioProgress() >= 100) {
          this.audioProgress.set(0);
          this.isPlayingAudio.set(false);
          clearInterval(this.audioInterval);
        } else {
          this.audioProgress.update(v => v + 5);
        }
      }, 150);
    }
  }

  // Approve a task and apply live updates
  protected approveTask(task: HITLTask) {
    this.dataService.approveHITLTask(task.id, this.operatorNotesInput);
    this.closeHITLDetail();
  }

  // Reject a task
  protected rejectTask(task: HITLTask) {
    this.dataService.rejectHITLTask(task.id, this.operatorNotesInput);
    this.closeHITLDetail();
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.initChart();
  }

  private initChart() {
    const ctx = this.channelChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['WhatsApp', 'Telegram', 'Web', 'CenterCall', 'Instagram', 'SMS'],
        datasets: [
          {
            label: 'Volumen de Canal (%)',
            data: [52, 18, 14, 10, 4, 2],
            backgroundColor: [
              '#16A34A', // WhatsApp green
              '#0284C7', // Telegram blue
              '#1E4D8C', // Serfinanza Navy
              '#4F46E5', // Indigo
              '#DB2777', // Pink
              '#6B7280', // Gray
            ],
            borderRadius: 8,
            borderSkipped: false,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0F172A',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context) => ` ${context.parsed.x}% del tráfico total`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#64748B',
              callback: (value) => `${value}%`
            },
            max: 60
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              font: { family: 'Inter', size: 12, weight: 'bold' },
              color: '#334155'
            }
          }
        }
      }
    });
  }
}
