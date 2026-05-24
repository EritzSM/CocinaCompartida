import { defineConfig } from "cypress";
export default defineConfig({
    e2e: {
        baseUrl: "http://localhost",
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
        // Adding reasonable retries for CI/flakiness
        retries: {
            runMode: 2,
            openMode: 0,
        },
        viewportWidth: 1280,
        viewportHeight: 720,
        video: false,
        screenshotOnRunFailure: true,
    },
});