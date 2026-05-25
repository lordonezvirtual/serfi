import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./views/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'chat',
    loadComponent: () => import('./views/chat/chat').then((m) => m.ChatComponent),
  },
  {
    path: 'channels',
    loadComponent: () => import('./views/channels/channels').then((m) => m.ChannelsComponent),
  },
  {
    path: 'alerts',
    loadComponent: () => import('./views/alerts/alerts').then((m) => m.AlertsComponent),
  },
  {
    path: 'knowledge',
    loadComponent: () => import('./views/knowledge/knowledge').then((m) => m.KnowledgeComponent),
  },
  {
    path: 'offers',
    loadComponent: () => import('./views/offers/offers').then((m) => m.OffersComponent),
  },
  {
    path: 'geomarketing',
    loadComponent: () => import('./views/geomarketing/geomarketing').then((m) => m.GeomarketingComponent),
  },
  {
    path: 'agents-orchestration',
    loadComponent: () => import('./views/agents-orchestration/agents-orchestration').then((m) => m.AgentsOrchestrationComponent),
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
