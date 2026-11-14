/** Persist appearance and manage searchable, keyboard-accessible documentation navigation. */
const root = document.documentElement;
const scheme = document.querySelector<HTMLSelectElement>('#color-scheme')!;
const media = matchMedia('(prefers-color-scheme: dark)');
const accents = document.querySelectorAll<HTMLButtonElement>('[data-accent-choice]');
const search = document.querySelector<HTMLInputElement>('.sidebar-search input')!;
const groups = [...document.querySelectorAll<HTMLDetailsElement>('[data-nav-group]')];
const entries = [...document.querySelectorAll<HTMLLIElement>('[data-search-entry]')];
const feedback = document.querySelector<HTMLElement>('.search-feedback')!;
const empty = document.querySelector<HTMLElement>('.search-empty')!;
const sidebar = document.querySelector<HTMLElement>('#docs-sidebar')!;
const menu = document.querySelector<HTMLButtonElement>('[data-open-menu]')!;
const backdrop = document.querySelector<HTMLButtonElement>('.menu-backdrop')!;
let openBeforeSearch: boolean[] | undefined;

function applyAppearance() {
  root.dataset.scheme =
    root.dataset.mode === 'system' ? (media.matches ? 'dark' : 'light') : root.dataset.mode;
  scheme.value = root.dataset.mode ?? 'system';
  accents.forEach((button) =>
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.accentChoice === root.dataset.accent),
    ),
  );
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', root.dataset.scheme === 'dark' ? '#151719' : '#ffffff');
  try {
    localStorage.setItem(
      'cobalt-docs-appearance',
      JSON.stringify({ mode: root.dataset.mode, accent: root.dataset.accent }),
    );
  } catch {}
  document.dispatchEvent(new CustomEvent('docs:appearance', { detail: root.dataset.scheme }));
}
scheme.addEventListener('change', () => {
  root.dataset.mode = scheme.value;
  applyAppearance();
});
accents.forEach((button) =>
  button.addEventListener('click', () => {
    root.dataset.accent = button.dataset.accentChoice;
    applyAppearance();
    const picker = button.closest('details')!;
    picker.open = false;
    picker.querySelector('summary')?.focus();
  }),
);
media.addEventListener('change', () => {
  if (root.dataset.mode === 'system') applyAppearance();
});
applyAppearance();

search.addEventListener('input', () => {
  const query = search.value.trim().toLowerCase();
  if (query && !openBeforeSearch) openBeforeSearch = groups.map((group) => group.open);
  let count = 0;
  entries.forEach((entry) => {
    entry.hidden = !!query && !entry.dataset.searchEntry?.includes(query);
    if (!entry.hidden) count++;
  });
  groups.forEach((group, index) => {
    group.hidden = !!query && !group.querySelector('li:not([hidden])');
    if (query) group.open = true;
    else if (openBeforeSearch) group.open = openBeforeSearch[index];
  });
  feedback.hidden = !query;
  feedback.textContent = `${count} ${count === 1 ? 'page' : 'pages'} found`;
  empty.hidden = !query || count > 0;
  if (!query) openBeforeSearch = undefined;
});

function setMenu(open: boolean, restoreFocus = false) {
  root.toggleAttribute('data-menu-open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  backdrop.hidden = !open;
  if (open) {
    sidebar.setAttribute('role', 'dialog');
    sidebar.setAttribute('aria-modal', 'true');
    document.querySelector<HTMLElement>('.docs-main')!.inert = true;
    document.querySelector<HTMLElement>('.docs-header')!.inert = true;
    sidebar.querySelector<HTMLButtonElement>('[data-close-menu]')?.focus();
  } else {
    sidebar.removeAttribute('role');
    sidebar.removeAttribute('aria-modal');
    document.querySelector<HTMLElement>('.docs-main')!.inert = false;
    document.querySelector<HTMLElement>('.docs-header')!.inert = false;
    if (restoreFocus) menu.focus();
  }
}
menu.addEventListener('click', () => setMenu(!root.hasAttribute('data-menu-open')));
backdrop.addEventListener('click', () => setMenu(false, true));
sidebar.querySelector('[data-close-menu]')?.addEventListener('click', () => setMenu(false, true));
matchMedia('(min-width: 960px)').addEventListener('change', (event) => {
  if (event.matches) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.isComposing) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (innerWidth < 960) setMenu(true);
    search.focus();
  }
  if (event.key === 'Escape')
    document.querySelector<HTMLDetailsElement>('.accent-menu')!.open = false;
  if (event.key === 'Escape' && root.hasAttribute('data-menu-open')) setMenu(false, true);
  if (event.key === 'Tab' && root.hasAttribute('data-menu-open')) {
    const targets = [...sidebar.querySelectorAll<HTMLElement>('a,button,input,summary')].filter(
      (element) => {
        const group = element.closest('details');
        return (
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility === 'visible' &&
          (!group || group.open || group.querySelector('summary') === element)
        );
      },
    );
    const first = targets[0],
      last = targets.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});
sidebar.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });

document.addEventListener('click', (event) => {
  const picker = document.querySelector<HTMLDetailsElement>('.accent-menu')!;
  if (event.target instanceof Node && !picker.contains(event.target)) picker.open = false;
});
