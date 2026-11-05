export function normalizeTeamSelection(selection, availableProviderIds) {
  const available = new Set(Array.isArray(availableProviderIds) ? availableProviderIds : []);
  if (!Array.isArray(selection)) return [];
  return [...new Set(selection.filter(id => typeof id === 'string' && available.has(id)))];
}
