/**
 * Statuts des projets (table "taches") — source unique pour Gestion des Projets
 * et les tableaux de bord. Miroir côté backend : ALIAS_STATUTS dans TacheController
 * (filtre serveur), à tenir à jour avec ANCIENS_STATUTS ci-dessous.
 */
export const STATUTS_PROJET = ['Qualification', 'Devis', 'Commande', 'En cours', 'Réalisé', 'Perdu'];

export const COULEURS_STATUT_PROJET: Record<string, string> = {
  'Qualification': '#9e9e9e', 'Devis': '#f57f17', 'Commande': '#1565c0',
  'En cours': '#FFA500', 'Réalisé': '#00CC00', 'Perdu': '#FF0000'
};

/** Anciens codes/libellés encore présents en base (dont prod). */
const ANCIENS_STATUTS: Record<string, string> = {
  'A_FAIRE': 'Qualification', 'EN_COURS': 'En cours', 'TERMINEE': 'Réalisé',
  'En Qualification': 'Qualification', 'En Attente': 'Qualification',
  'Fait': 'Réalisé', 'Validation Resp': 'Devis', 'Bon de commande': 'Commande',
  'Réalisation': 'Réalisé', 'Clôture': 'Réalisé'
};

/** Ramène un statut venant de la BDD à l'une des 6 valeurs de STATUTS_PROJET —
 * tout ce qui n'est pas reconnu devient "Qualification". */
export function normaliserStatutProjet(statutBrut: string): string {
  if (STATUTS_PROJET.includes(statutBrut)) return statutBrut;
  return ANCIENS_STATUTS[statutBrut] || 'Qualification';
}

/** Nombre de projets par statut, dans l'ordre de STATUTS_PROJET. */
export function compterParStatutProjet(projets: { statut: string }[]): number[] {
  const normalises = projets.map(p => normaliserStatutProjet(p.statut));
  return STATUTS_PROJET.map(s => normalises.filter(n => n === s).length);
}
