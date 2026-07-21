import './commands'

// Fail tests on unexpected app errors unless explicitly handled in a spec
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver loop')) return false
  return true
})
