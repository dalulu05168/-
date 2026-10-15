export const onRequestGet: PagesFunction = () =>
  Response.json({ ok: true, service: "wmsystem-api", timestamp: new Date().toISOString() });
