/* ============================================================
   BOARDINGPAY SERVICE WORKER
   Stable GitHub Pages Offline Support
============================================================ */

const CACHE_NAME = "boardingpay-v5";


/* ============================================================
   GET CURRENT APP SCOPE
============================================================ */

const APP_SCOPE = self.registration.scope;


/*
   Example:

   https://jealouabellanosa03-oss.github.io/hunat/

   This automatically works for the current GitHub Pages folder.
*/


const APP_URL = new URL(
    "./",
    APP_SCOPE
).href;


const INDEX_URL = new URL(
    "index.html",
    APP_SCOPE
).href;


const STYLE_URL = new URL(
    "style.css",
    APP_SCOPE
).href;


const SCRIPT_URL = new URL(
    "script.js",
    APP_SCOPE
).href;


/* ============================================================
   INSTALL
============================================================ */

self.addEventListener("install", event => {

    console.log(
        "[BoardingPay SW] Installing:",
        CACHE_NAME
    );

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(async cache => {

                console.log(
                    "[BoardingPay SW] App scope:",
                    APP_SCOPE
                );

                console.log(
                    "[BoardingPay SW] App URL:",
                    APP_URL
                );

                console.log(
                    "[BoardingPay SW] Index URL:",
                    INDEX_URL
                );


                /*
                   ------------------------------------------------
                   CACHE ROOT PAGE
                   ------------------------------------------------
                */

                try {

                    const response = await fetch(
                        APP_URL,
                        {
                            cache: "no-store"
                        }
                    );

                    if (response.ok) {

                        await cache.put(
                            APP_URL,
                            response.clone()
                        );

                        console.log(
                            "[BoardingPay SW] Cached app:",
                            APP_URL
                        );

                    } else {

                        console.warn(
                            "[BoardingPay SW] App request failed:",
                            response.status
                        );

                    }

                } catch (error) {

                    console.warn(
                        "[BoardingPay SW] App could not be cached:",
                        error
                    );

                }


                /*
                   ------------------------------------------------
                   CACHE INDEX
                   ------------------------------------------------
                */

                try {

                    const response = await fetch(
                        INDEX_URL,
                        {
                            cache: "no-store"
                        }
                    );

                    if (response.ok) {

                        await cache.put(
                            INDEX_URL,
                            response.clone()
                        );

                        console.log(
                            "[BoardingPay SW] Cached index:",
                            INDEX_URL
                        );

                    } else {

                        console.warn(
                            "[BoardingPay SW] Index request failed:",
                            response.status
                        );

                    }

                } catch (error) {

                    console.warn(
                        "[BoardingPay SW] Index could not be cached:",
                        error
                    );

                }


                /*
                   ------------------------------------------------
                   CACHE CSS
                   ------------------------------------------------
                */

                try {

                    const response = await fetch(
                        STYLE_URL,
                        {
                            cache: "no-store"
                        }
                    );

                    if (response.ok) {

                        await cache.put(
                            STYLE_URL,
                            response.clone()
                        );

                        console.log(
                            "[BoardingPay SW] Cached CSS:",
                            STYLE_URL
                        );

                    }

                } catch (error) {

                    console.warn(
                        "[BoardingPay SW] CSS not cached:",
                        error
                    );

                }


                /*
                   ------------------------------------------------
                   CACHE JAVASCRIPT
                   ------------------------------------------------
                */

                try {

                    const response = await fetch(
                        SCRIPT_URL,
                        {
                            cache: "no-store"
                        }
                    );

                    if (response.ok) {

                        await cache.put(
                            SCRIPT_URL,
                            response.clone()
                        );

                        console.log(
                            "[BoardingPay SW] Cached JS:",
                            SCRIPT_URL
                        );

                    }

                } catch (error) {

                    console.warn(
                        "[BoardingPay SW] JS not cached:",
                        error
                    );

                }


                console.log(
                    "[BoardingPay SW] Installation complete."
                );

            })

            .then(() => {

                return self.skipWaiting();

            })

    );

});


/* ============================================================
   ACTIVATE
============================================================ */

self.addEventListener("activate", event => {

    console.log(
        "[BoardingPay SW] Activating:",
        CACHE_NAME
    );

    event.waitUntil(

        caches.keys()

            .then(cacheNames => {

                return Promise.all(

                    cacheNames
                        .filter(cacheName => {

                            return (
                                cacheName.startsWith(
                                    "boardingpay-"
                                ) &&
                                cacheName !== CACHE_NAME
                            );

                        })

                        .map(oldCache => {

                            console.log(
                                "[BoardingPay SW] Removing old cache:",
                                oldCache
                            );

                            return caches.delete(
                                oldCache
                            );

                        })

                );

            })

            .then(() => {

                console.log(
                    "[BoardingPay SW] Activation complete."
                );

                return self.clients.claim();

            })

    );

});


/* ============================================================
   FETCH
   NETWORK + RUNTIME CACHE
============================================================ */

self.addEventListener("fetch", event => {

    const request = event.request;


    /*
       Only GET requests.
    */

    if (request.method !== "GET") {
        return;
    }


    event.respondWith(

        caches.match(request)

            .then(cachedResponse => {

                /*
                   ------------------------------------------------
                   CACHE HIT
                   ------------------------------------------------
                */

                if (cachedResponse) {

                    console.log(
                        "[BoardingPay SW] Cache hit:",
                        request.url
                    );

                    return cachedResponse;

                }


                /*
                   ------------------------------------------------
                   NETWORK
                   ------------------------------------------------
                */

                return fetch(request)

                    .then(networkResponse => {

                        /*
                           Save successful same-origin
                           responses.
                        */

                        if (
                            networkResponse &&
                            networkResponse.ok &&
                            networkResponse.type === "basic"
                        ) {

                            const clone =
                                networkResponse.clone();


                            caches.open(CACHE_NAME)
                                .then(cache => {

                                    cache.put(
                                        request,
                                        clone
                                    )
                                    .then(() => {

                                        console.log(
                                            "[BoardingPay SW] Runtime cached:",
                                            request.url
                                        );

                                    });

                                });

                        }


                        return networkResponse;

                    })

                    .catch(error => {

                        console.warn(
                            "[BoardingPay SW] Network failed:",
                            request.url,
                            error
                        );


                        /*
                           ------------------------------------------------
                           OFFLINE NAVIGATION
                           ------------------------------------------------
                        */

                        if (
                            request.mode === "navigate" ||
                            request.destination === "document"
                        ) {

                            return caches.match(
                                request
                            )
                            .then(response => {

                                if (response) {

                                    return response;

                                }


                                /*
                                   Try current app root.
                                */

                                return caches.match(
                                    APP_URL
                                );

                            })
                            .then(response => {

                                if (response) {

                                    console.log(
                                        "[BoardingPay SW] Offline page served from cache."
                                    );

                                    return response;

                                }


                                /*
                                   Last fallback.
                                */

                                return new Response(

                                    offlinePage(),

                                    {
                                        status: 200,

                                        headers: {
                                            "Content-Type":
                                                "text/html; charset=UTF-8"
                                        }

                                    }

                                );

                            });

                        }


                        /*
                           Non-document resources.
                        */

                        return new Response(
                            "",
                            {
                                status: 503,
                                statusText:
                                    "Offline resource unavailable"
                            }
                        );

                    });

            })

    );

});


/* ============================================================
   OFFLINE PAGE
============================================================ */

function offlinePage() {

    return `
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>BoardingPay - Offline</title>

    <style>

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            background:
                linear-gradient(
                    145deg,
                    #eaf6ff,
                    #f8fcff,
                    #eef8ff
                );

            color: #073f78;
        }

        .offline-box {

            width: 100%;
            max-width: 420px;

            background: #ffffff;

            padding: 35px 25px;

            border-radius: 20px;

            text-align: center;

            box-shadow:
                0 10px 35px
                rgba(7, 63, 120, 0.12);
        }

        .offline-icon {
            font-size: 52px;
            margin-bottom: 15px;
        }

        h1 {
            margin: 0 0 12px;
            color: #073f78;
        }

        p {
            margin: 0 0 24px;
            line-height: 1.6;
            color: #647b8c;
        }

        button {

            border: none;

            padding:
                13px 25px;

            border-radius: 10px;

            cursor: pointer;

            font-size: 15px;

            font-weight: 700;

            background:
                linear-gradient(
                    135deg,
                    #0aa0e8,
                    #087dc7
                );

            color: #ffffff;
        }

    </style>

</head>

<body>

    <div class="offline-box">

        <div class="offline-icon">
            📡
        </div>

        <h1>
            You're Offline
        </h1>

        <p>
            BoardingPay is currently offline.
            Please reconnect to the internet
            and try again.
        </p>

        <button onclick="location.reload()">
            Try Again
        </button>

    </div>

</body>

</html>
`;

}


/* ============================================================
   MESSAGE HANDLER
============================================================ */

self.addEventListener("message", event => {

    if (!event.data) {
        return;
    }


    /*
       SKIP WAITING
    */

    if (
        event.data.action ===
        "SKIP_WAITING"
    ) {

        console.log(
            "[BoardingPay SW] SKIP_WAITING requested."
        );

        self.skipWaiting();

    }


    /*
       CLEAR CACHE
    */

    if (
        event.data.action ===
        "CLEAR_CACHE"
    ) {

        console.log(
            "[BoardingPay SW] Clearing cache..."
        );

        event.waitUntil(

            caches.keys()

                .then(cacheNames => {

                    return Promise.all(

                        cacheNames

                            .filter(cacheName =>
                                cacheName.startsWith(
                                    "boardingpay-"
                                )
                            )

                            .map(cacheName =>
                                caches.delete(
                                    cacheName
                                )
                            )

                    );

                })

                .then(() => {

                    console.log(
                        "[BoardingPay SW] Cache cleared."
                    );

                })

        );

    }

});
