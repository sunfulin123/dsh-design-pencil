/** Page-side interface inventory. Hidden DOM is evidence, never forcibly exposed. */
export function discoverInterfaces() {
  const visible = (el) => {
    const r = el.getBoundingClientRect(),
      s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
  };
  const selector = (el) => {
    if (el.id) return '#' + CSS.escape(el.id);
    const parts = [];
    for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
      const siblings = [...node.parentElement.children].filter((n) => n.tagName === node.tagName);
      parts.unshift(node.tagName.toLowerCase() + `:nth-of-type(${siblings.indexOf(node) + 1})`);
    }
    return 'html>' + parts.join('>');
  };
  const candidates = [];
  for (const el of document.querySelectorAll(
    'button,[role="tab"],[role="button"],a[href],select,[onclick],[aria-controls],[aria-haspopup],summary',
  )) {
    if (!visible(el)) continue;
    const label = (
      el.getAttribute('aria-label') ||
      el.textContent ||
      el.getAttribute('title') ||
      el.name ||
      el.tagName
    )
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 160);
    let expected = el.getAttribute('aria-controls');
    if (expected) expected = '#' + CSS.escape(expected);
    if (!expected && el.getAttribute('href')?.startsWith('#') && el.hash.length > 1)
      expected = el.hash;
    if (!expected)
      for (const [key, value] of Object.entries(el.dataset)) {
        if (!/(tab|page|panel|view|target)/i.test(key) || !value) continue;
        const match = [...document.querySelectorAll('[hidden],[role="tabpanel"],section,div')].find(
          (n) =>
            n !== el &&
            [...n.attributes].some(
              (a) => /data-.*(panel|page|view|target)/i.test(a.name) && a.value === value,
            ),
        );
        if (match) {
          expected = selector(match);
          break;
        }
      }
    const dangerous =
      /delete|remove|pay|purchase|send|submit|logout|sign.out|terminate|取消订单|删除|支付|发送/i.test(
        label,
      ) ||
      (el.type === 'submit' && el.closest('form') !== null);
    const tab =
      el.getAttribute('role') === 'tab' || /(?:^|[\s_-])tab(?:$|[\s_-])/i.test(el.className || '');
    const popup = el.hasAttribute('aria-haspopup') || el.tagName === 'SUMMARY';
    const safe =
      !dangerous &&
      (Boolean(expected) ||
        tab ||
        popup ||
        /\b(open|show|view|details|compare|settings|filter|menu)\b/i.test(label));
    if (el.tagName === 'SELECT') {
      candidates.push({
        label,
        kind: 'selection',
        selector: selector(el),
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
        selector: selector(el),
        safe: false,
        reason: 'Navigation outside the current source requires explicit scope',
      });
      continue;
    }
    candidates.push({
      label,
      kind: tab ? 'tab' : popup ? 'overlay' : 'action',
      selector: selector(el),
      expected: expected || undefined,
      safe,
      reason: dangerous
        ? 'Business submission is not executed'
        : safe
          ? undefined
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
    .slice(0, 100)
    .map((el) => ({
      selector: selector(el),
      role: el.getAttribute('role'),
      label: (el.getAttribute('aria-label') || el.id || el.className || el.tagName)
        .toString()
        .slice(0, 120),
    }));
  const scrollContainers = [...document.querySelectorAll('body *')]
    .filter(
      (el) =>
        visible(el) &&
        el.scrollHeight > el.clientHeight + 5 &&
        /(auto|scroll)/.test(getComputedStyle(el).overflowY),
    )
    .slice(0, 40)
    .map((el) => ({
      selector: selector(el),
      visibleHeight: el.clientHeight,
      contentHeight: el.scrollHeight,
    }));
  return {
    url: location.pathname + location.search + location.hash,
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
    visibleContainers: [
      ...document.querySelectorAll(
        '[role="tabpanel"],dialog,[role="dialog"],section,[class*="panel"]',
      ),
    ]
      .filter(visible)
      .map(selector),
    text: document.body.innerText.slice(0, 100000),
  };
}

/** Verify activation against actual visibility and capture bounded semantic evidence. */
export function inspectState({ expected }) {
  const visible = (el) => {
    const r = el.getBoundingClientRect(),
      s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
  };
  const matches = expected ? [...document.querySelectorAll(expected)].filter(visible) : [];
  const root = matches[0] || document.body;
  return {
    expectedVisible: !expected || matches.length === 1,
    text: root.innerText.slice(0, 100000),
    tables: [...root.querySelectorAll('table')].filter(visible).map((t) => ({
      rows: t.querySelectorAll('tbody tr').length,
      columns: t.querySelector('tr')?.children.length || 0,
    })),
    graphics: {
      canvases: root.querySelectorAll('canvas').length,
      svg: root.querySelectorAll('svg').length,
    },
    chartCandidates: [...root.querySelectorAll('canvas,svg')]
      .filter(
        (el) =>
          visible(el) &&
          el.getBoundingClientRect().width >= 100 &&
          el.getBoundingClientRect().height >= 60,
      )
      .map((el) => ({
        rect: {
          x: el.getBoundingClientRect().left - document.body.getBoundingClientRect().left,
          y: el.getBoundingClientRect().top - document.body.getBoundingClientRect().top,
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
        },
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        label: el.getAttribute('aria-label'),
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
      })),
    viewport: { width: innerWidth, height: innerHeight, scrollX, scrollY },
    height: document.documentElement.scrollHeight,
  };
}
