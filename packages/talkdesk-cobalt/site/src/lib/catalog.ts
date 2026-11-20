/** Derive documentation navigation from the discovered article collection. */
import { getCollection, type CollectionEntry } from 'astro:content';
import registry from '../../../registry/authoring.json';
import publicExtensionIds from '../../../components/extensions/public.json';

export interface NavigationItem {
  title: string;
  href: string;
  search: string;
}
export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

const extensionPrefix = 'components/extensions/';
export const publicExtensions = registry.components.filter((component) =>
  publicExtensionIds.includes(component.id),
);
const publicExtensionPaths = new Set(
  publicExtensions.map((component) => component.documentation.replace(/\.mdx$/, '')),
);

export function publicReference() {
  return getCollection(
    'reference',
    ({ id }) => !id.startsWith(extensionPrefix) || publicExtensionPaths.has(id),
  );
}

export function documentTitle(entry: CollectionEntry<'reference'>): string {
  const title =
    entry.body?.match(/^# (.+)$/m)?.[1] ??
    entry.id
      .split('/')
      .at(-1)
      ?.replace(/^design-md-/, '')
      .replaceAll('-', ' ') ??
    entry.id;
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export const recipeHref = (id: string) =>
  '/recipes/' + id.replace(/^recipe\./, '').replaceAll('.', '-') + '/';

export async function documentationNavigation(): Promise<NavigationGroup[]> {
  const entries = await publicReference();
  const groups: NavigationGroup[] = [
    {
      title: 'Getting started',
      items: [
        { title: 'Overview', href: '/', search: 'overview introduction' },
        { title: 'Page recipes', href: '/recipes/', search: 'page recipes templates' },
      ],
    },
    {
      title: 'Recipes',
      items: registry.recipes.map((recipe) => ({
        title: recipe.title,
        href: recipeHref(recipe.id),
        search: recipe.id + ' ' + recipe.title,
      })),
    },
  ];
  for (const [title, prefix] of [
    ['Cobalt Extensions', extensionPrefix],
    ['Cobalt core', 'components/core/'],
    ['Cobalt marketplace', 'components/marketplace/'],
    ['Foundations', 'foundations/'],
    ['Patterns', 'patterns/'],
    ['Workspace', 'workspace/'],
    ['Development', 'get-started/'],
    ['Page layouts', 'layout-templates/'],
    ['Providers', 'providers/'],
    ['Hooks', 'hooks/'],
    ['Utilities', 'utils/'],
    ['Style guides', 'styles/'],
  ]) {
    groups.push({
      title,
      items: entries
        .filter((entry) => entry.id.startsWith(prefix))
        .map((entry) => ({
          title: documentTitle(entry),
          href: '/reference/' + entry.id + '/',
          search: documentTitle(entry) + ' ' + entry.id + ' ' + title,
        }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    });
  }
  const assigned = new Set(groups.flatMap((group) => group.items.map((item) => item.href)));
  const remaining = entries.filter((entry) => !assigned.has('/reference/' + entry.id + '/'));
  if (remaining.length)
    groups.push({
      title: 'Library reference',
      items: remaining.map((entry) => ({
        title: documentTitle(entry),
        href: '/reference/' + entry.id + '/',
        search: documentTitle(entry) + ' ' + entry.id,
      })),
    });
  return groups.filter((group) => group.items.length);
}
