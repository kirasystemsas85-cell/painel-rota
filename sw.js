// Toda vez que você publicar uma mudança no index.html, aumente esse número.
// É essa mudança que faz o navegador perceber que existe versão nova.
const CACHE_VERSION = "v14";
const CACHE_NAME = "painel-rota-" + CACHE_VERSION;

const APP_SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Sempre tenta buscar a versão mais nova primeiro; se estiver sem internet, usa a guardada.
// IMPORTANTE: só faz cache dos arquivos do próprio site (HTML, ícones, manifesto).
// Chamadas para o Supabase (outro domínio) nunca passam por aqui nem ficam salvas no aparelho.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // deixa passar direto pra rede, sem cache
  e.respondWith(
    fetch(e.request, {cache: "no-store"})
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
