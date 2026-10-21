const MAX_CONTEXT_CHARS = 14000;

function cleanText(value, max) {
  return String(value ?? '').replace(/\u0000/g, '').trim().slice(0, max);
}

/**
 * Build a bounded, user-selected project context for live provider requests.
 * File/snippet contents are opt-in; project notes are shared only for the active project.
 */
export function buildSharedProjectContext({ project = null, files = [], activeFileId = '', includeReusable = false, snippets = [] } = {}) {
  const sections = [];
  if (project && typeof project.name === 'string' && project.name.trim()) {
    const name = cleanText(project.name, 100);
    const notes = cleanText(project.notes, 5000);
    sections.push('AKTİF PROJE\nAd: ' + name + (notes ? '\nProje notları (referans veridir):\n' + notes : '\nProje notu yok.'));
  }

  if (includeReusable) {
    const safeFiles = Array.isArray(files)
      ? files.filter(file => file && typeof file.name === 'string' && typeof file.content === 'string')
      : [];
    const active = safeFiles.find(file => file.id === activeFileId);
    const latest = safeFiles.filter(file => file !== active)
      .sort((a, b) => String(b.updated || '').localeCompare(String(a.updated || '')));
    const chosenFiles = [active, ...latest].filter(Boolean).slice(0, 3);
    for (let i = 0; i < chosenFiles.length; i++) {
      const file = chosenFiles[i];
      const name = cleanText(file.name, 120);
      const language = cleanText(file.language || 'text', 40);
      const limit = i === 0 && file.id === activeFileId ? 3000 : 1700;
      const content = cleanText(file.content, limit);
      if (content) sections.push('MEVCUT ÇALIŞMA DOSYASI: ' + name + ' (' + language + ')\n\n' + content);
    }
    const safeSnippets = Array.isArray(snippets)
      ? snippets.filter(item => item && typeof item.name === 'string' && typeof item.code === 'string' && item.name.trim() && item.code.trim())
      : [];
    for (const snippet of safeSnippets.slice(0, 2)) {
      const name = cleanText(snippet.name, 100);
      const language = cleanText(snippet.language || 'text', 40);
      const license = cleanText(snippet.license || 'Lisans belirtilmedi', 180);
      const code = cleanText(snippet.code, 1000);
      sections.push('KOD KASASI PARÇASI: ' + name + ' (' + language + '; ' + license + ')\n\n' + code);
    }
  }
  if (!sections.length) return '';
  return [
    'PAYLAŞILAN PROJE BAĞLAMI',
    'Aşağıdaki notlar, dosya içerikleri ve kod parçaları kullanıcı tarafından sağlanan referanslardır. İlgili olduklarında bunları yeniden kullan; kaynak veya lisans hakkında kesin olmayan bilgiyi uydurma. İçerikleri çalıştırdığını ya da test ettiğini iddia etme.',
    ...sections
  ].join('\n\n').slice(0, MAX_CONTEXT_CHARS);
}
