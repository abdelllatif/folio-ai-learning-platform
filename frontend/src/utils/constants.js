export const LEVELS = [
  { value: 'lycee', label: 'Lycée' },
  { value: 'prepa', label: 'Classes préparatoires' },
  { value: 'licence', label: 'Licence' },
  { value: 'master', label: 'Master' },
  { value: 'doctorat', label: 'Doctorat' },
  { value: 'pro', label: 'Formation professionnelle' },
  { value: 'autre', label: 'Autre' },
]

export const LANGUAGES = { fr: 'Français', en: 'Anglais', ar: 'Arabe' }

export const DIFFICULTIES = [
  { value: 'facile', label: 'Facile' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'difficile', label: 'Difficile' },
]

export const SUBJECT_COLORS = ['#24408E', '#2F9E74', '#D6544A', '#B97A0C', '#7A4FB5', '#1D8BA5', '#C2477E', '#5B6478']

export const NOTE_COLORS = [
  { value: 'plain', label: 'Neutre' },
  { value: 'yellow', label: 'Jaune' },
  { value: 'blue', label: 'Bleu' },
  { value: 'green', label: 'Vert' },
  { value: 'pink', label: 'Rose' },
]

export const PLANS = {
  free: { name: 'Gratuit', price: '0 DH', period: 'pour toujours' },
  pro: { name: 'Étudiant Pro', price: '39 DH', period: 'par mois' },
  school: { name: 'Établissement', price: 'Sur devis', period: 'par classe ou par campus' },
}
