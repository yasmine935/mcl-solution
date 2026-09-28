import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

// Par défaut, le navigateur restaure la position de défilement après un
// rechargement (F5) ou un retour en arrière — on scrollait tout en bas.
// 'manual' désactive cette restauration automatique : la page démarre
// toujours en haut, comme un chargement classique.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));