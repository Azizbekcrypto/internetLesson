import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'n4d4kd',
  allowCypressEnv: false,

  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,

    setupNodeEvents(on, config) {
      return config
    },
  },
})
