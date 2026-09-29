/* ============================================================
   BOARDINGPAY SERVICE WORKER
   Offline Cache / App Support
============================================================ */

const CACHE_NAME = "boardingpay-v3";

/*
   ============================================================
   CORE FILES
   These files MUST exist.
   ============================================================
*/

const CORE_FILES = [
    "./",
    "./index.html"
];


/*
   ============================================================
   OPTIONAL APP FILES
   Based on the ACTUAL files in the repository.
   ============================================================
*/

const OPTIONAL_FILES = [

    /* Main Pages */
    "./get-started.html",
    "./login.html",

    /* Admin */
    "./admin-register.html",
    "./create-account.html",
    "./admin-dashboard.html",

    /* Landlord */
    "./landlord-register.html",
    "./landlord-dashboard.html",

    /* Tenant */
    "./tenant-register.html",
    "./tenant-dashboard.html",

    /* Payments */
    "./paymentmethod.html",
    "./payment-details.html",
    "./payment-success.html",

    /* Other Pages */
    "./profile.html",
    "./settings.html",
    "./history.html",
    "./announcements.html",
    "./contact.html",
    "./forgot-password.html",

    /* CSS */
    "./style.css",

    /* JavaScript */
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

                /*
                   Core files must work.
                */

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
                                "[BoardingPay SW] Cached core:",
                                file
                            );

                        } else {

                            console.error(
                                "[BoardingPay SW] Core file failed:",
                                file,
                                response.status
                            );

                        }

                    } catch (error) {

                        console.error(
                            "[BoardingPay SW] Core file error:",
                            file,
                            error
                        );

                    }

                }


                /*
                   Optional files are cached one by one.
                   If one file is missing, installation
                   will NOT fail.
                */

                console.log(
                    "[BoardingPay SW] Caching optional files..."
                );


                for (const file of OPTIONAL_FILES) {

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
                                "[BoardingPay SW] Cached:",
                                file
                            );

                        } else {

                            console.warn(
                                "[BoardingPay SW] Skipped:",
                                file,
                                "Status:",
                                response.status
                            );

                        }

                    } catch (error) {

                        console.warn(
                            "[BoardingPay SW] Could not cache:",
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
                   Activate the new service worker
                   immediately.
                */

                return self.skipWaiting();

            })

            .catch(error => {

                console.error(
                    "[BoardingPay SW] Installation failed:",
                    error
                );

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

                /*
                   Take control of all open pages.
                */

                return self.clients.claim();

            })

    );

});


/* ============================================================
   FETCH
   CACHE FIRST → NETWORK → OFFLINE FALLBACK
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
                   1. USE CACHE FIRST
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
                   2. TRY NETWORK
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
                                    );

                                })
                                .catch(error => {

                                    console.warn(
                                        "[BoardingPay SW] Cache put failed:",
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

                                    return indexResponse;

                                }


                                /*
                                   If even index.html is unavailable,
                                   return an offline page.
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
                           4. NON-DOCUMENT OFFLINE RESPONSE
                           =================================================
                        */

                        return new Response(

                            "",

                            {
                                status: 404,
                                statusText:
                                    "Offline resource not cached"
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
                #f7f7f7;

            color:
                #333;

            text-align: center;

        }

        .offline-box {

            width: 100%;

            max-width: 450px;

            background:
                #ffffff;

            padding: 35px 25px;

            border-radius: 18px;

            box-shadow:
                0 10px 30px
                rgba(0, 0, 0, 0.10);

        }

        .offline-icon {

            font-size: 55px;

            margin-bottom: 15px;

        }

        h1 {

            margin:
                0 0 10px;

            font-size: 26px;

        }

        p {

            margin:
                0 0 22px;

            line-height: 1.6;

            color:
                #666;

        }

        button {

            border: none;

            padding:
                12px 22px;

            border-radius:
                10px;

            cursor:
                pointer;

            font-size:
                15px;

            background:
                #333;

            color:
                white;

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
            BoardingPay cannot connect to the internet
            right now. Please check your connection
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
       =========================================================
       FORCE SERVICE WORKER TO ACTIVATE
       =========================================================
    */

    if (
        event.data.action ===
        "SKIP_WAITING"
    ) {

        console.log(
            "[BoardingPay SW] Skip waiting requested."
        );

        self.skipWaiting();

    }


    /*
       =========================================================
       CLEAR BOARDINGPAY CACHE
       =========================================================
    */

    if (
        event.data.action ===
        "CLEAR_CACHE"
    ) {

        console.log(
            "[BoardingPay SW] Clearing caches..."
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
