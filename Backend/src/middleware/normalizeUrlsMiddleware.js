// Middleware que reemplaza dominios obsoletos en URLs de respuestas JSON.
// Permite migrar entre hosts sin alterar los datos en la DB.
// Configurar STALE_DOMAINS en .env con los dominios viejos separados por comas.

const STALE_DOMAINS_DEFAULT = 'https://librosfera.onrender.com';

function normalizeUrlsMiddleware(req, res, next) {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) return next();

  const staleDomainsEnv = process.env.STALE_DOMAINS || STALE_DOMAINS_DEFAULT;
  const staleDomains = staleDomainsEnv
    .split(',')
    .map(d => d.trim())
    .filter(d => d && d !== baseUrl);

  if (staleDomains.length === 0) return next();

  const originalJson = res.json.bind(res);
  res.json = function(data) {
    if (data) {
      let jsonStr = JSON.stringify(data);
      let changed = false;
      for (const staleDomain of staleDomains) {
        const replaced = jsonStr.split(staleDomain).join(baseUrl);
        if (replaced !== jsonStr) {
          jsonStr = replaced;
          changed = true;
        }
      }
      if (changed) return originalJson(JSON.parse(jsonStr));
    }
    return originalJson(data);
  };

  next();
}

module.exports = normalizeUrlsMiddleware;
