export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get("User-Agent") || "";

  // 1. 识别爬虫（示例：Googlebot、Bingbot）
  const isBot = /Googlebot|Bingbot|Slurp/i.test(userAgent);

  // 2. 爬虫直接放行，返回 Pages 原始内容
  if (isBot) {
    return next();
  }

  // 3. 普通用户：从 KV 获取可用域名
  const statusData = await env.DOMAIN_MONITOR.get("domain_status", "json") || {};
  const availableDomains = Object.entries(statusData)
    .filter(([_, s]) => s.status === "UP")
    .map(([domain]) => domain);

  // 4. 存在可用域名则 301 跳转
  if (availableDomains.length > 0) {
    const target = availableDomains[Math.floor(Math.random() * availableDomains.length)];
    return Response.redirect(`https://${target}${url.pathname}`, 301);
  }

  // 5. 无可用域名时继续返回 Pages 内容
  return next();
}
