export async function assetRoute(request, url, body, assets) {
  if (request.method === 'GET' && url.pathname === '/api/assets') return assets.catalog();
  if (request.method === 'POST' && url.pathname === '/api/assets/tools') {
    if (
      !body ||
      typeof body.name !== 'string' ||
      !assets.handles(body.name) ||
      !body.arguments ||
      typeof body.arguments !== 'object' ||
      Array.isArray(body.arguments)
    ) {
      throw new Error('Invalid asset tool request');
    }
    return assets.call(body.name, body.arguments);
  }
  const match = /^\/api\/assets\/(scene-template|style-guide|theme-preset)\/([^/]+)$/.exec(
    url.pathname,
  );
  if (request.method === 'GET' && match) return assets.get(match[1], decodeURIComponent(match[2]));
  throw new Error('Unknown asset route');
}
