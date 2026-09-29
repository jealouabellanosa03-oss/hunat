/* ============================================================
   BOARDINGPAY SERVICE WORKER
   Runtime Cache / Offline Support
============================================================ */

const CACHE_NAME = "boardingpay-v4";

/*
   ============================================================
   CORE FILES
   These are the only files cached during installation.
   ============================================================
*/

const CORE_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js"
];


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
                    "[BoardingPay SW] Caching core files..."
                );

                for (const file of CORE_FILES) {

                    try {

                        const response = await fetch(
                            new Request(file, {
                                cache: "no-cache"
                            })
                        );

                        if (response.ok) {

                            await cache.put(
                                file,
                                response.clone()
                            );

                            console.log(
                                "[BoardingPay SW] Core cached:",
                                file
                            );

                        } else {

                            console.warn(
                                "[BoardingPay SW] Core file failed:",
                                file,
                                response.status
                            );

                        }

                    } catch (error) {

                        console.warn(
                            "[BoardingPay SW] Core file could not be cached:",
                            file,
                            error
                        );

                    }

                }

                console.log(
                    "[BoardingPay SW] Installation complete."
                );

            })

            .then(() => {

                /*
                   Activate immediately.
                */

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
   RUNTIME CACHE
============================================================ */

self.addEventListener("fetch", event => {

    const request = event.request;


    /*
       Only handle GET requests.
    */

    if (request.method !== "GET") {

        return;

    }


    event.respondWith(

        caches.match(request)

            .then(cachedResponse => {

                /*
                   =================================================
                   1. CACHE HIT
                   =================================================
                */

                if (cachedResponse) {

                    console.log(
                        "[BoardingPay SW] Cache hit:",
                        request.url
                    );

                    return cachedResponse;

                }


                /*
                   =================================================
                   2. NO CACHE
                   TRY NETWORK
                   =================================================
                */

                return fetch(request)

                    .then(networkResponse => {

                        /*
                           Only cache successful responses.
                        */

                        if (
                            networkResponse &&
                            networkResponse.ok &&
                            networkResponse.type === "basic"
                        ) {

                            const responseClone =
                                networkResponse.clone();


                            caches.open(CACHE_NAME)

                                .then(cache => {

                                    cache.put(
                                        request,
                                        responseClone
                                    )
                                    .then(() => {

                                        console.log(
                                            "[BoardingPay SW] Runtime cached:",
                                            request.url
                                        );

                                    })
                                    .catch(error => {

                                        console.warn(
                                            "[BoardingPay SW] Runtime cache failed:",
                                            request.url,
                                            error
                                        );

                                    });

                                })

                                .catch(error => {

                                    console.warn(
                                        "[BoardingPay SW] Cache open failed:",
                                        error
                                    );

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
                           =================================================
                           3. OFFLINE DOCUMENT FALLBACK
                           =================================================
                        */

                        if (
                            request.destination === "document"
                        ) {

                            return caches.match(
                                "./index.html"
                            )

                            .then(indexResponse => {

                                if (indexResponse) {

                                    console.log(
                                        "[BoardingPay SW] Offline fallback:",
                                        "./index.html"
                                    );

                                    return indexResponse;

                                }


                                /*
                                   No index cache available.
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
                           =================================================
                           4. NON-DOCUMENT RESOURCE
                           =================================================
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
   OFFLINE FALLBACK PAGE
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

    <meta
        name="theme-color"
        content="#ffffff"
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

            text-align: center;

        }


        .offline-box {

            width: 100%;

            max-width: 420px;

            background: #ffffff;

            padding: 35px 25px;

            border-radius: 20px;

            box-shadow:
                0 10px 35px
                rgba(7, 63, 120, 0.12);

        }


        .offline-icon {

            font-size: 52px;

            margin-bottom: 15px;

        }


        h1 {

            margin:
                0 0 12px;

            font-size: 27px;

            color: #073f78;

        }


        p {

            margin:
                0 0 24px;

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
            Pages that you have already opened
            can still be accessed.
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
       =========================================================
       SKIP WAITING
       =========================================================
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
       =========================================================
       CLEAR CACHE
       =========================================================
    */

    if (
        event.data.action ===
        "CLEAR_CACHE"
    ) {

        console.log(
            "[BoardingPay SW] Clearing BoardingPay caches..."
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
                        "[BoardingPay SW] BoardingPay cache cleared."
                    );

                })

        );

    }

});
