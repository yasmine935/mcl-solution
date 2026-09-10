import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { DashboardAdmin } from './components/dashboard-admin/dashboard-admin';
import { DashboardTechnicien } from './components/dashboard-technicien/dashboard-technicien';
import { DashboardKia } from './components/dashboard-kia/dashboard-kia';
import { DashboardAurelien } from './components/dashboard-aurelien/dashboard-aurelien';
import { DashboardOdile } from './components/dashboard-odile/dashboard-odile';
import { DashboardEssan } from './components/dashboard-essan/dashboard-essan';
import { Employes } from './components/employes/employes';
import { Conges } from './components/conges/conges';
import { FicheInterventionManager } from './components/fiche-intervention-manager/fiche-intervention-manager';
import { FicheInterventionTechnicien } from './components/fiche-intervention-technicien/fiche-intervention-technicien';
import { TicketingComponent } from './components/ticketing/ticketing';
import { DashboardKarine } from './components/dashboard-karine/dashboard-karine';
import { DashboardAby } from './components/dashboard-aby/dashboard-aby';
import { DashboardHaideh } from './components/dashboard-haideh/dashboard-haideh';
import { DashboardNaccera } from './components/dashboard-naccera/dashboard-naccera';
import { GestionClients } from './components/clients/clients';
import { EcranVisiteur } from './components/ecran-visiteur/ecran-visiteur';
import { authGuard } from './guards/auth.guard';
export const appRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'nouveau-ticket', component: TicketingComponent },
  { path: 'ecran-visiteur', component: EcranVisiteur },
  // Chaque dashboard est restreint à son rôle (+ FERID, l'admin).
  // Les pages partagées (employés, congés, fiches, clients) restent ouvertes à tout utilisateur connecté.
  { path: 'dashboard-admin', component: DashboardAdmin, canActivate: [authGuard], data: { roles: ['FERID'] } },
  { path: 'dashboard-technicien', component: DashboardTechnicien, canActivate: [authGuard], data: { roles: ['TECHNICIEN', 'UN', 'FERID'] } },
  { path: 'dashboard-kia', component: DashboardKia, canActivate: [authGuard], data: { roles: ['TECHNICIEN_SUP', 'FERID'] } },
  { path: 'dashboard-aurelien', component: DashboardAurelien, canActivate: [authGuard], data: { roles: ['AURELIEN', 'FERID'] } },
  { path: 'dashboard-odile', component: DashboardOdile, canActivate: [authGuard], data: { roles: ['ODILE', 'FERID'] } },
  { path: 'dashboard-essan', component: DashboardEssan, canActivate: [authGuard], data: { roles: ['ESSAN', 'FERID'] } },
  { path: 'employes', component: Employes, canActivate: [authGuard] },
  { path: 'conges', component: Conges, canActivate: [authGuard] },
  { path: 'fiche-intervention', component: FicheInterventionManager, canActivate: [authGuard] },
  { path: 'dashboard-karine', component: DashboardKarine, canActivate: [authGuard], data: { roles: ['KARINE', 'FERID'] } },
  { path: 'dashboard-aby', component: DashboardAby, canActivate: [authGuard], data: { roles: ['ABY', 'FERID'] } },
  { path: 'dashboard-haideh', component: DashboardHaideh, canActivate: [authGuard], data: { roles: ['HAIDEH', 'FERID'] } },
  { path: 'dashboard-naccera', component: DashboardNaccera, canActivate: [authGuard], data: { roles: ['NACCERA', 'FERID'] } },
  { path: 'fiche-intervention-tech/:id', component: FicheInterventionTechnicien, canActivate: [authGuard] },
  { path: 'clients', component: GestionClients, canActivate: [authGuard] }
];