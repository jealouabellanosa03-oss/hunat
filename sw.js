<script>
if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./sw.js", {
                scope: "./"
            })

            .then(registration => {

                console.log(
                    "[BoardingPay] Service Worker registered:",
                    registration.scope
                );

                registration.update();

            })

            .catch(error => {

                console.error(
                    "[BoardingPay] Service Worker registration failed:",
                    error
                );

            });

    });

}
</script>
