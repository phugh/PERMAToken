var CACHE_NAME = 'cache-v1'
var urlsToCache = [
  '/',
  '/index.html',
  '/css/style.min.css',
  '/js/main.js',
  'json/perma/permaV3_dd.json',
  '/manifest.json'
]
self.addEventListener('install', function (event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(urlsToCache)
      })
  )
})
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response
        }
        var fetchRequest = event.request.clone()
        return fetch(fetchRequest).then(
          function (response) {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }
            var responseToCache = response.clone()
            caches.open(CACHE_NAME)
              .then(function (cache) {
                cache.put(event.request, responseToCache)
              })
            return response
          }
        )
      })
    )
})
self.addEventListener('activate', function (event) {
  var cacheWhitelist = ['cache-v1']
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
