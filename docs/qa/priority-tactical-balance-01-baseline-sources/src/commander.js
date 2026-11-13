// ME1 dossier choices. These describe Shepard's history, without adding
// unverified combat or morality bonuses to this adaptation.
export const COMMANDER_APPEARANCES = {
  male: { name: 'Masculine', description: 'Apparence masculine de Shepard.', sprite: 'shepard' },
  female: { name: 'Féminine', description: 'Apparence féminine de Shepard.', sprite: 'femshep' },
};

export const ORIGINS = {
  spacer: { name: 'Stellaire', description: 'Enfant de militaires de l’Alliance, vous avez grandi sur des vaisseaux et des stations.' },
  colonist: { name: 'Colon', description: 'Vous avez grandi sur Mindoir et survécu à l’attaque de la colonie par des esclavagistes.' },
  earthborn: { name: 'Terrien', description: 'Vous avez grandi dans les rues de la Terre avant de rejoindre l’Alliance.' },
};

export const PSYCHOLOGICAL_PROFILES = {
  'sole-survivor': { name: 'Rescapé', description: 'Vous avez survécu à la destruction de votre unité sur Akuze.' },
  'war-hero': { name: 'Héros de guerre', description: 'Vous avez défendu Elysium lors du Blitz skyllien.' },
  ruthless: { name: 'Impitoyable', description: 'Vous avez mené une opération militaire à son terme, au prix de lourdes pertes.' },
};
