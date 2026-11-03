// Fonds colorés des visuels produits (aplat + coupe en diagonale)
export const THEMES = {
  kraft:    { a: '#D9C3A0', b: '#F5EDE0', text: '#6B2D3C', label: 'Kraft / crème' },
  chocolat: { a: '#4A2C20', b: '#D9C3A0', text: '#F5EDE0', label: 'Chocolat / kraft' },
  bordeaux: { a: '#6B2D3C', b: '#EBCFCB', text: '#F5EDE0', label: 'Bordeaux / rose' },
  creme:    { a: '#F5EDE0', b: '#EBCFCB', text: '#4A2C20', label: 'Crème / rose' },
  rose:     { a: '#EBCFCB', b: '#D9C3A0', text: '#6B2D3C', label: 'Rose poudré / kraft' },
}

export const THEME_OPTIONS = Object.entries(THEMES).map(([value, t]) => ({ value, label: t.label }))

export function theme(name) {
  return THEMES[name] || THEMES.kraft
}
