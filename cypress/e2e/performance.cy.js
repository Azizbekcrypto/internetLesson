describe('Performance and Load', () => {
  it('loads catalog within 3 seconds', () => {
    const start = Date.now()
    cy.visit('/#/')
    cy.contains('h1', 'Barcha darslar').should('be.visible')
    cy.get('a.lz-card').should('have.length.at.least', 1).then(() => {
      const elapsed = Date.now() - start
      expect(elapsed).to.be.lessThan(3000)
    })
  })

  it('lazy-loads lesson within 5 seconds', () => {
    const start = Date.now()
    cy.visitLesson('m7-07')
    cy.get('.lesson-root').should('be.visible').then(() => {
      const elapsed = Date.now() - start
      expect(elapsed).to.be.lessThan(5000)
    })
  })

  it('has no console errors during catalog navigation', () => {
    const errors = []
    cy.on('window:before:load', (win) => {
      cy.stub(win.console, 'error').callsFake((...args) => {
        errors.push(args.join(' '))
      })
    })

    cy.visitCatalog()
    cy.get('a.lz-card').first().click()
    cy.get('.lesson-root', { timeout: 15000 }).should('exist')

    cy.then(() => {
      const critical = errors.filter((e) => !e.includes('ResizeObserver'))
      expect(critical).to.have.length(0)
    })
  })

  it('completes screen transition within 1 second', () => {
    cy.visitLesson('m7-07')
    cy.get('.hook-option').first().click()

    const start = Date.now()
    cy.get('.btn-white-accent').contains('Davom etish').click()
    cy.contains('h2', 'Arxitektura').should('be.visible').then(() => {
      const elapsed = Date.now() - start
      expect(elapsed).to.be.lessThan(1000)
    })
  })
})
