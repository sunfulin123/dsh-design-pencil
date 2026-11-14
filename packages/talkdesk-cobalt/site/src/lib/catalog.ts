/** Derive documentation navigation from the discovered article collection. */
import { getCollection, type CollectionEntry } from 'astro:content';
import registry from '../../../registry/authoring.json';

export interface NavigationItem {
  title: string;
  href: string;
  search: string;
}
export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
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

export const recipeTitles: Record<string, string> = {
  'recipe.list-page': 'List page',
  'recipe.detail-page': 'Detail page',
  'recipe.form-page': 'Form page',
  'recipe.extensions.users-list': 'Users list with extensions',
};
export const recipeHref = (id: string) =>
  '/recipes/' + id.replace(/^recipe\./, '').replaceAll('.', '-') + '/';

export async function documentationNavigation(): Promise<NavigationGroup[]> {
  const entries = await getCollection('reference');
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
        title: recipeTitles[recipe.id] ?? recipe.id,
        href: recipeHref(recipe.id),
        search: recipe.id + ' ' + recipeTitles[recipe.id],
      })),
    },
  ];
  for (const [title, prefix] of [
    ['Cobalt Extensions', 'components/extensions/'],
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
