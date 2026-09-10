// ╔══════════════════════════════════════════════════════╗
// ║  CONFIGURATION SERVEUR MCL Solutions                ║
// ║  L'URL de l'API vit dans src/environments/          ║
// ║  (environment.ts = production,                      ║
// ║   environment.development.ts = développement)       ║
// ╚══════════════════════════════════════════════════════╝
import { environment } from '../environments/environment';

export const SERVER_URL = environment.apiUrl;
