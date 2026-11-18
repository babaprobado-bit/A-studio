const REPO = (id, name, repository, kind, group, description, options = {}) => ({
  id, name, repository, branch: options.branch || 'main', kind, group, description,
  community: options.community === true, archived: options.archived === true,
  desktopRequired: options.desktopRequired === true,
  sourceUrl: 'https://github.com/' + repository,
  downloadable: true
});

export const PLUGIN_REPOSITORY_CATALOG = Object.freeze([
  {
    id: 'rea-companion',
    name: 'REA Companion',
    repository: null,
    kind: 'companion',
    group: 'priority',
    description: 'Öncelikli REA entegrasyonu. REA yerel masaüstü MCP süreci olarak çalışır; AI Studio Android uygulamasında gerçek companion bağlantısı henüz tamamlanmadı.',
    docsUrl: 'https://rea.vaked.dev/get-started/',
    packageUrl: 'https://www.npmjs.com/package/rea-agents',
    downloadable: false,
    priority: 0
  },
  REPO('superpowers', 'superpowers', 'obra/superpowers', 'plugin', 'plugin', 'Claude Code için planlama, test ve yazılım geliştirme iş akışları.'),
  REPO('anthropic-skills', 'anthropic-skills', 'anthropics/skills', 'skill', 'skill', 'Anthropic tarafından yayımlanan örnek Agent Skills koleksiyonu.'),
  REPO('karpathy-skills', 'karpathy-skills', 'multica-ai/andrej-karpathy-skills', 'skill', 'skill', 'Karpathy’nin yazılım geliştirme gözlemlerinden esinlenen topluluk talimatları.', { community: true }),
  REPO('everything-claude-code', 'everything-claude-code', 'affaan-m/everything-claude-code', 'plugin', 'plugin', 'Agent, Skill, hook ve geliştirme iş akışlarını bir araya getiren kapsamlı paket.'),
  REPO('gstack', 'gstack', 'garrytan/gstack', 'plugin', 'plugin', 'Claude Code için rol tabanlı yazılım geliştirme ve inceleme iş akışları.'),
  REPO('ponytail', 'ponytail', 'DietrichGebert/ponytail', 'cli', 'cli', 'Bağlam ve token kullanımını yönetmeye yönelik yardımcı araç.', { desktopRequired: true }),
  REPO('caveman', 'caveman', 'JuliusBrussee/caveman', 'skill', 'skill', 'Daha kısa ve doğrudan yanıtlar için Claude Code talimatları.'),
  REPO('graphify', 'graphify', 'Graphify-Labs/graphify', 'plugin', 'plugin', 'Kod tabanını ve ilişkileri grafik temelli keşfetmeye yönelik araç.'),
  REPO('claude-mem', 'claude-mem', 'thedotmack/claude-mem', 'memory', 'memory', 'Claude Code oturumları arasında proje bağlamı ve hafıza yönetimi.', { desktopRequired: true }),
  REPO('planning-with-files', 'planning-with-files', 'OthmanAdi/planning-with-files', 'skill', 'skill', 'Plan, ilerleme ve görev notlarını dosyalar üzerinden düzenleyen Skill.'),
  REPO('taste-skill', 'taste-skill', 'Leonxlnx/taste-skill', 'skill', 'skill', 'Arayüz ve ürün kararlarında tasarım kalitesini destekleyen Skill.'),
  REPO('ui-ux-pro-max', 'ui-ux-pro-max', 'nextlevelbuilder/ui-ux-pro-max-skill', 'skill', 'skill', 'UI/UX ilkeleri, tasarım sistemleri ve arayüz önerileri için Skill.'),
  REPO('mattpocock-skills', 'mattpocock skills', 'mattpocock/skills', 'skill', 'skill', 'Matt Pocock tarafından yayımlanan yazılım mühendisliği Skill paketi.'),
  REPO('wshobson-agents', 'wshobson agents', 'wshobson/agents', 'plugin', 'plugin', 'Claude Code ve diğer agent araçları için agent, Skill ve komut paketleri.'),
  REPO('awesome-claude-skills', 'awesome-claude-skills', 'ComposioHQ/awesome-claude-skills', 'collection', 'collection', 'Topluluk tarafından derlenen Claude Skill kaynakları ve örnekleri.'),
  REPO('awesome-claude-code', 'awesome-claude-code', 'hesreallyhim/awesome-claude-code', 'collection', 'collection', 'Claude Code araçları, eklentileri ve kaynakları için liste.'),
  REPO('claude-plugins', 'claude-plugins', 'anthropics/claude-plugins-official', 'collection', 'collection', 'Anthropic’in resmi Claude Code plugin kataloğu.'),
  REPO('repomix', 'repomix', 'yamadashy/repomix', 'cli', 'cli', 'Kod tabanını AI araçları için paketleyen CLI ve MCP entegrasyonu.', { desktopRequired: true }),
  REPO('context7', 'context7', 'upstash/context7', 'mcp', 'mcp', 'Model yanıtlarında güncel kütüphane dokümantasyonu sağlayan MCP sunucusu.', { desktopRequired: true }),
  REPO('serena', 'serena', 'oraios/serena', 'mcp', 'mcp', 'Kod sembolleri ve proje yapısı üzerinde semantik geliştirme araçları.', { desktopRequired: true }),
  REPO('firecrawl', 'firecrawl', 'firecrawl/firecrawl-mcp-server', 'mcp', 'mcp', 'Web sayfalarını tarama ve içerik çıkarma araçları sağlayan MCP sunucusu.', { desktopRequired: true }),
  REPO('beads', 'beads', 'steveyegge/beads', 'cli', 'cli', 'Ajanlar için Git tabanlı görev ve bağımlılık takibi.', { desktopRequired: true }),
  REPO('vibe-kanban', 'vibe-kanban', 'BloopAI/vibe-kanban', 'desktop', 'cli', 'Kod ajanları için görev panosu ve çalışma alanı yönetimi.', { desktopRequired: true }),
  REPO('github-mcp', 'github-mcp', 'github/github-mcp-server', 'mcp', 'mcp', 'GitHub depoları, issue ve pull request işlemleri için resmi MCP sunucusu.', { desktopRequired: true }),
  REPO('playwright-mcp', 'playwright-mcp', 'microsoft/playwright-mcp', 'mcp', 'mcp', 'Tarayıcı otomasyonu ve web testi için Microsoft Playwright MCP sunucusu.', { desktopRequired: true }),
  REPO('awesome-mcp-servers', 'awesome-mcp-servers', 'punkpeye/awesome-mcp-servers', 'collection', 'collection', 'Farklı kullanım alanları için MCP sunucuları listesi.'),
  REPO('claude-code-router', 'claude-code-router', 'musistudio/claude-code-router', 'router', 'cli', 'Claude Code isteklerini yapılandırılmış model sağlayıcılarına yönlendiren router.', { desktopRequired: true }),
  REPO('cc-switch', 'cc-switch', 'farion1231/cc-switch', 'desktop', 'cli', 'Claude Code ve benzeri araçların sağlayıcı/konfigürasyon profillerini yönetir.', { desktopRequired: true }),
  REPO('claude-hud', 'claude-hud', 'jarrodwatts/claude-hud', 'plugin', 'plugin', 'Claude Code oturum ve bağlam durumunu gösteren HUD eklentisi.'),
  REPO('rtk', 'rtk', 'rtk-ai/rtk', 'cli', 'cli', 'Ajan iş akışlarında komut çıktısı ve token kullanımını azaltmaya yönelik CLI.', { branch: 'develop', desktopRequired: true }),
  REPO('headroom', 'headroom', 'headroomlabs-ai/headroom', 'cli', 'cli', 'LLM bağlamını daha verimli kullanmaya yönelik araç ve örnekler.', { desktopRequired: true }),
  REPO('system-prompts', 'system-prompts-and-models-of-ai-tools', 'x1xhlol/system-prompts-and-models-of-ai-tools', 'collection', 'collection', 'AI araçlarına ait sistem istemleri ve model bilgileri koleksiyonu.')
]);

const BY_ID = new Map(PLUGIN_REPOSITORY_CATALOG.map(item => [item.id, item]));

export function getPluginRepositoryById(id) {
  return typeof id === 'string' ? (BY_ID.get(id) || null) : null;
}

export function getPluginRepositoryArchiveUrl(id) {
  const item = getPluginRepositoryById(id);
  if (!item || !item.downloadable || !item.repository) return null;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(item.repository)) return null;
  if (!/^[A-Za-z0-9._/-]+$/.test(item.branch) || item.branch.split('/').some(part => !part || part === '.' || part === '..')) return null;
  const encodedBranch = item.branch.split('/').map(encodeURIComponent).join('/');
  return 'https://github.com/' + item.repository + '/archive/refs/heads/' + encodedBranch + '.zip';
}

export function isAllowedPluginRepositoryDownload(id, url) {
  const expected = getPluginRepositoryArchiveUrl(id);
  return Boolean(expected && url === expected);
}
