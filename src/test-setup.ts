import { beforeEach } from 'vitest';

// Node n'expose localStorage que derrière --localstorage-file :
// polyfill mémoire pour que les tests (guard, interceptor, composants) fonctionnent.
let disponible = false;
try {
  disponible = typeof globalThis.localStorage?.getItem === 'function';
} catch {
  disponible = false;
}

// ApexCharts exige ResizeObserver, absent de l'environnement de test
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Isolation : le stockage est partagé entre les suites d'un même worker,
// un test qui y laisse une valeur corrompue ferait planter les suivants.
beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    // stockage indisponible : rien à nettoyer
  }
});

if (!disponible) {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => void store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size;
      },
    },
  });
}
