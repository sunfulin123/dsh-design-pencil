/** Page-side interface inventory. Hidden DOM is evidence, never forcibly exposed. */
export function discoverInterfaces(_args, context) {
  const frames = context.inventory();
  const scopes = frames
    .filter((frame) => frame.status === 'available')
    .map(({ framePath }) => discoverDocument(context.resolve(framePath).doc, framePath, context));
  return {
    frames,
    candidates: scopes.flatMap((scope) => scope.candidates),
    hidden: scopes.flatMap((scope) => scope.hidden),
    scrollContainers: scopes.flatMap((scope) => scope.scrollContainers),
    visibleContainers: scopes.flatMap((scope) => scope.visibleContainers),
    text: scopes
      .map((scope) => scope.text)
      .join('\n')
      .slice(0, 100000),
    resources: {
      images: scopes.reduce((sum, scope) => sum + scope.resources.images, 0),
      canvases: scopes.reduce((sum, scope) => sum + scope.resources.canvases, 0),
      fonts: scopes.flatMap((scope) => scope.resources.fonts),
      scripts: scopes.flatMap((scope) => scope.resources.scripts),
    },
  };

  function discoverDocument(document, framePath, { visible, stableSelector, role, name }) {
    const location = document.defaultView.location;
    const getComputedStyle = (el) => document.defaultView.getComputedStyle(el);
    const url = location.pathname + location.search + location.hash;
    const visibleContainers = [
      ...document.querySelectorAll(
        '[role="tabpanel"],dialog,[role="dialog"],section,[class*="panel"]',
      ),
    ]
      .filter(visible)
      .map(stableSelector)
      .filter(Boolean)
      .toSorted();
    const currentTab = document.querySelector('[role="tab"][aria-selected="true"]');
    const heading = [...document.querySelectorAll('h1,[role="heading"][aria-level="1"]')]
      .find(visible)
      ?.innerText.trim()
      .slice(0, 160);
    const route = [
      url,
      currentTab && (stableSelector(currentTab) || name(currentTab)),
      heading,
      ...visibleContainers,
    ];
    const scope = { framePath, route };
    const nameCounts = new Map();
    for (const node of document.querySelectorAll(
      'button,a[href],input,textarea,select,summary,[role]',
    )) {
      if (!visible(node)) continue;
      const key = JSON.stringify([role(node), name(node)]);
      nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
    }
    const candidates = [];
    for (const el of document.querySelectorAll(
      'button,[role="tab"],[role="button"],a[href],select,[onclick],[aria-controls],[aria-haspopup],summary',
    )) {
      if (!visible(el) || el.matches(':disabled,[aria-disabled="true"]') || el.closest('[inert]'))
        continue;
      const accessibleName = name(el);
      const label = accessibleName.slice(0, 160) || el.tagName;
      const selector = stableSelector(el);
      const semantic = { role: role(el), name: accessibleName };
      const locator =
        !selector &&
        semantic.role &&
        /^[a-z][a-z0-9-]{0,39}$/.test(semantic.role) &&
        accessibleName &&
        accessibleName.length <= 160 &&
        nameCounts.get(JSON.stringify([semantic.role, semantic.name])) === 1
          ? semantic
          : undefined;

      const controls = el.getAttribute('aria-controls');
      const hash = el.getAttribute('href')?.startsWith('#') && el.hash?.slice(1);
      const namedTarget = document.getElementById(controls || hash || '');
      let expected = namedTarget && stableSelector(namedTarget);
      if (!expected)
        for (const [key, value] of Object.entries(el.dataset)) {
          if (!/(tab|page|panel|view|target)/i.test(key) || !value) continue;
          const match = [
            ...document.querySelectorAll('[hidden],[role="tabpanel"],section,div'),
          ].find(
            (n) =>
              n !== el &&
              [...n.attributes].some(
                (a) => /data-.*(panel|page|view|target)/i.test(a.name) && a.value === value,
              ),
          );
          if (match && (expected = stableSelector(match))) break;
        }
      const dangerous =
        /delete|remove|pay|purchase|send|submit|logout|sign.out|terminate|取消订单|删除|支付|发送/i.test(
          label,
        ) ||
        (el.type === 'submit' && el.closest('form') !== null);
      const tab =
        el.getAttribute('role') === 'tab' ||
        /(?:^|[\s_-])tab(?:$|[\s_-])/i.test(el.className || '');
      const popup = el.hasAttribute('aria-haspopup') || el.tagName === 'SUMMARY';
      const toggle = el.hasAttribute('aria-pressed');
      const interfaceControl = Boolean(
        expected ||
        controls ||
        tab ||
        popup ||
        el.hasAttribute('aria-expanded') ||
        /\b(open|show|view|details|compare|settings|filters?|menu)\b/i.test(label),
      );
      const safe = !dangerous && Boolean(selector || locator) && interfaceControl;
      const target = { ...scope, route: tab ? [url] : route, selector, locator };
      if (el.tagName === 'SELECT') {
        candidates.push({
          label,
          kind: 'selection',
          ...target,
          safe: false,
          reason:
            'Choose a representative value from source evidence before capturing this selection',
          options: [...el.options].map((o) => ({
            value: o.value,
            label: o.textContent,
            disabled: o.disabled,
          })),
        });
        continue;
      }
      if (el.tagName === 'A' && !el.getAttribute('href')?.startsWith('#')) {
        candidates.push({
          label,
          kind: 'navigation',
          ...target,
          safe: false,
          reason: 'Navigation outside the current source requires explicit scope',
        });
        continue;
      }
      if (!interfaceControl && !toggle && !el.hasAttribute('onclick') && !dangerous) continue;
      candidates.push({
        label,
        kind: tab ? 'tab' : popup ? 'overlay' : toggle ? 'selection' : 'action',
        ...target,
        expected: expected || undefined,
        safe,
        reason: dangerous
          ? 'Business submission is not executed'
          : safe
            ? undefined
            : !selector && !locator
              ? 'No unique stable action locator'
              : 'Activation requires a source-grounded state plan',
      });
    }
    const hidden = [
      ...document.querySelectorAll(
        'body div,body section,body aside,body dialog,body nav,body form,body menu,body ul',
      ),
    ]
      .filter(
        (el) =>
          !visible(el) &&
          el.parentElement &&
          visible(el.parentElement) &&
          !el.closest('template,script,style,noscript') &&
          Boolean(
            el.textContent.trim() || el.querySelector('img,svg,canvas,input,select,button,[role]'),
          ) &&
          (el.hidden ||
            ['none'].includes(getComputedStyle(el).display) ||
            getComputedStyle(el).visibility === 'hidden'),
      )
      .map((el, index) => ({
        ...scope,
        index,
        selector: stableSelector(el),
        reachableStateClue: el.matches(
          'dialog,menu,[hidden],[role=dialog],[role=tabpanel],[role=menu]',
        ),
        role: el.getAttribute('role'),
        label: (el.getAttribute('aria-label') || el.id || el.className || el.tagName)
          .toString()
          .slice(0, 120),
      }))
      .filter((entry) => entry.selector || entry.reachableStateClue)
      .slice(0, 100);
    const scrollContainers = [...document.querySelectorAll('body *')]
      .filter(
        (el) =>
          visible(el) &&
          el.scrollHeight > el.clientHeight + 5 &&
          /(auto|scroll)/.test(getComputedStyle(el).overflowY),
      )
      .slice(0, 40)
      .map((el) => ({
        ...scope,
        selector: stableSelector(el),
        visibleHeight: el.clientHeight,
        contentHeight: el.scrollHeight,
      }));
    const frameScroll = document.scrollingElement;
    if (framePath.length && frameScroll.scrollHeight > document.defaultView.innerHeight + 5)
      scrollContainers.unshift({
        ...scope,
        visibleHeight: document.defaultView.innerHeight,
        contentHeight: frameScroll.scrollHeight,
      });
    return {
      candidates,
      hidden,
      scrollContainers,
      resources: {
        images: document.images.length,
        canvases: document.querySelectorAll('canvas').length,
        fonts: [...document.fonts].map((f) => ({
          family: f.family,
          status: f.status,
          weight: f.weight,
        })),
        scripts: [...document.scripts].map((s) => s.src || 'inline'),
      },
      visibleContainers: visibleContainers.map((selector) => ({ framePath, selector })),
      text: document.body.innerText.slice(0, 100000),
    };
  }
}

/** Verify activation against actual visibility and capture bounded semantic evidence. */
export function inspectState({ expected, expectedFramePath }, context) {
  const scope = context.resolve(expectedFramePath);
  const matches = expected ? [...scope.doc.querySelectorAll(expected)].filter(context.visible) : [];
  const roots = expected
    ? matches
    : context
        .inventory()
        .filter((frame) => frame.status === 'available')
        .map(({ framePath }) => context.resolve(framePath).doc.body);
  const inspect = (selector) =>
    roots.flatMap((root) => {
      const elements = [...root.querySelectorAll(selector)];
      if (root.matches(selector)) elements.unshift(root);
      return elements.filter(context.visible);
    });
  return {
    expectedVisible: !expected || matches.length === 1,
    text: roots
      .map((root) => root.innerText)
      .join('\n')
      .slice(0, 100000),
    tables: inspect('table').map((table) => ({
      rows: table.querySelectorAll('tbody tr').length,
      columns: table.querySelector('tr')?.children.length || 0,
    })),
    graphics: {
      canvases: inspect('canvas').length,
      svg: inspect('svg').length,
    },
    chartCandidates: inspect('canvas,svg').flatMap((el) => {
      const rect = context.boardRect(el);
      if (rect.width < 100 || rect.height < 60) return [];
      return [
        {
          rect,
          tag: el.localName,
          role: el.getAttribute('role'),
          label: el.getAttribute('aria-label'),
          width: rect.width,
          height: rect.height,
        },
      ];
    }),
    viewport: { width: innerWidth, height: innerHeight, scrollX, scrollY },
    height: document.documentElement.scrollHeight,
  };
}
