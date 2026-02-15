import thinkersIndexRaw from '../../resources/thinkers/INDEX.md?raw';

const thinkerLoaders: Record<string, () => Promise<string>> = {
  'karl-marx': () => import('../../resources/thinkers/karl-marx.md?raw').then((m) => m.default),
  'friedrich-engels': () =>
    import('../../resources/thinkers/friedrich-engels.md?raw').then((m) => m.default),
  'paul-lafargue': () =>
    import('../../resources/thinkers/paul-lafargue.md?raw').then((m) => m.default),
  'daniel-deleon': () =>
    import('../../resources/thinkers/daniel-deleon.md?raw').then((m) => m.default),
  'karl-kautsky': () =>
    import('../../resources/thinkers/karl-kautsky.md?raw').then((m) => m.default),
  'georgi-plekhanov': () =>
    import('../../resources/thinkers/georgi-plekhanov.md?raw').then((m) => m.default),
  'clara-zetkin': () =>
    import('../../resources/thinkers/clara-zetkin.md?raw').then((m) => m.default),
  'james-connolly': () =>
    import('../../resources/thinkers/james-connolly.md?raw').then((m) => m.default),
  'vladimir-lenin': () =>
    import('../../resources/thinkers/vladimir-lenin.md?raw').then((m) => m.default),
  'rosa-luxemburg': () =>
    import('../../resources/thinkers/rosa-luxemburg.md?raw').then((m) => m.default),
  'alexandra-kollontai': () =>
    import('../../resources/thinkers/alexandra-kollontai.md?raw').then((m) => m.default),
  'leon-trotsky': () =>
    import('../../resources/thinkers/leon-trotsky.md?raw').then((m) => m.default),
  'georg-lukacs': () =>
    import('../../resources/thinkers/georg-lukacs.md?raw').then((m) => m.default),
  'karl-korsch': () => import('../../resources/thinkers/karl-korsch.md?raw').then((m) => m.default),
  'mn-roy': () => import('../../resources/thinkers/mn-roy.md?raw').then((m) => m.default),
  'nikolai-bukharin': () =>
    import('../../resources/thinkers/nikolai-bukharin.md?raw').then((m) => m.default),
  'antonio-gramsci': () =>
    import('../../resources/thinkers/antonio-gramsci.md?raw').then((m) => m.default),
  'jose-carlos-mariategui': () =>
    import('../../resources/thinkers/jose-carlos-mariategui.md?raw').then((m) => m.default),
  'clr-james': () => import('../../resources/thinkers/clr-james.md?raw').then((m) => m.default),
  'george-padmore': () =>
    import('../../resources/thinkers/george-padmore.md?raw').then((m) => m.default),
  'paul-mattick': () =>
    import('../../resources/thinkers/paul-mattick.md?raw').then((m) => m.default),
  'hal-draper': () => import('../../resources/thinkers/hal-draper.md?raw').then((m) => m.default),
};

export function getThinkersIndex(): string {
  return thinkersIndexRaw;
}

export async function loadThinker(name: string): Promise<string> {
  const loader = thinkerLoaders[name];
  if (!loader) throw new Error(`Unknown thinker: ${name}`);
  return loader();
}

export async function loadThinkers(names: string[]): Promise<string[]> {
  return Promise.all(names.map(loadThinker));
}

export const TOPIC_THINKER_MAP: Record<string, string[]> = {
  imperialism: ['vladimir-lenin', 'rosa-luxemburg'],
  military: ['vladimir-lenin', 'rosa-luxemburg'],
  war: ['vladimir-lenin', 'rosa-luxemburg'],
  intervention: ['vladimir-lenin', 'george-padmore'],
  labor: ['karl-marx', 'rosa-luxemburg'],
  union: ['karl-marx', 'rosa-luxemburg'],
  strike: ['rosa-luxemburg', 'clara-zetkin'],
  wage: ['karl-marx', 'paul-lafargue'],
  trade: ['karl-marx', 'nikolai-bukharin'],
  globalization: ['nikolai-bukharin', 'vladimir-lenin'],
  austerity: ['paul-mattick', 'karl-marx'],
  crisis: ['paul-mattick', 'karl-marx'],
  recession: ['paul-mattick', 'nikolai-bukharin'],
  nationalism: ['james-connolly', 'mn-roy'],
  patriotism: ['james-connolly', 'hal-draper'],
  gender: ['clara-zetkin', 'alexandra-kollontai'],
  feminism: ['clara-zetkin', 'alexandra-kollontai'],
  women: ['clara-zetkin', 'alexandra-kollontai'],
  race: ['clr-james', 'george-padmore'],
  racism: ['clr-james', 'george-padmore'],
  colonialism: ['george-padmore', 'jose-carlos-mariategui'],
  development: ['george-padmore', 'mn-roy'],
  housing: ['paul-lafargue', 'friedrich-engels'],
  property: ['paul-lafargue', 'friedrich-engels'],
  land: ['karl-kautsky', 'jose-carlos-mariategui'],
  fascism: ['clara-zetkin', 'antonio-gramsci'],
  authoritarian: ['antonio-gramsci', 'georg-lukacs'],
  election: ['hal-draper', 'vladimir-lenin'],
  voting: ['hal-draper', 'daniel-deleon'],
  democracy: ['vladimir-lenin', 'hal-draper'],
  productivity: ['paul-lafargue', 'antonio-gramsci'],
  hustle: ['paul-lafargue', 'karl-marx'],
  media: ['antonio-gramsci', 'karl-marx'],
  journalism: ['antonio-gramsci', 'james-connolly'],
  religion: ['paul-lafargue', 'james-connolly'],
  culture: ['alexandra-kollontai', 'antonio-gramsci'],
};

export function selectThinkersForArticle(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const selected = new Set<string>();

  for (const [keyword, thinkers] of Object.entries(TOPIC_THINKER_MAP)) {
    if (text.includes(keyword)) {
      thinkers.forEach((t) => selected.add(t));
    }
  }

  return Array.from(selected);
}
