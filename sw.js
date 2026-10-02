/* Shabara Motors — service worker: يخزّن الواجهة للفتح السريع، والبيانات تبقى مباشرة من Firebase */
const CACHE = 'shabara-v1';
const SHELL = ['./','./index.html','./carbooking.html','./001.png','./icon-192.png','./icon-512.png'];
const STATIC_HOSTS = ['www.gstatic.com','cdnjs.cloudflare.com','fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  // صفحات التطبيق نفسه: الشبكة أولًا (لتصل التحديثات) ثم النسخة المخزنة عند انقطاع الإنترنت
  if(url.origin===location.origin){
    e.respondWith(fetch(req).then(res=>{
      if(res.ok){ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); }
      return res;
    }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
    return;
  }
  // مكتبات وخطوط ثابتة: من الكاش أولًا مع تحديثها في الخلفية
  if(STATIC_HOSTS.includes(url.hostname)){
    e.respondWith(caches.match(req).then(hit=>{
      const net=fetch(req).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); return res; }).catch(()=>hit);
      return hit||net;
    }));
  }
  // بقية الطلبات (Firestore والخرائط...) تمر مباشرة بدون تدخل
});
