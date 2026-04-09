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
import { DashboardAydeh } from './components/dashboard-aydeh/dashboard-aydeh';
import { DashboardNaccera } from './components/dashboard-naccera/dashboard-naccera';
export const appRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'nouveau-ticket', component: TicketingComponent },// ✅ PAGE PUBLIQUE CLIENT
  { path: 'dashboard-admin', component: DashboardAdmin },
  { path: 'dashboard-technicien', component: DashboardTechnicien },
  { path: 'dashboard-kia', component: DashboardKia },
  { path: 'dashboard-aurelien', component: DashboardAurelien },
  { path: 'dashboard-odile', component: DashboardOdile },
  { path: 'dashboard-essan', component: DashboardEssan },
  { path: 'employes', component: Employes },
  { path: 'conges', component: Conges },
  { path: 'fiche-intervention', component: FicheInterventionManager },
  { path: 'dashboard-karine', component: DashboardKarine },
  { path: 'dashboard-aby', component: DashboardAby },
  { path: 'dashboard-aydeh', component: DashboardAydeh },
  { path: 'dashboard-naccera', component: DashboardNaccera },
  { path: 'fiche-intervention-tech/:id', component: FicheInterventionTechnicien }
];