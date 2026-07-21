describe('Error and Edge Cases', () => {
  it('shows catalog for invalid lesson key without crashing', () => {
    cy.visit('/#/lesson/invalid-lesson-key-xyz')
    cy.contains('h1', 'Barcha darslar').should('be.visible')
    cy.get('a.lz-card').should('have.length.at.least', 1)
    cy.get('.lesson-root').should('not.exist')
  })

  it('handles rapid next-button clicks without breaking state', () => {
    cy.visitLesson('m7-07')
    cy.get('.hook-option').first().click()

    cy.get('.btn-white-accent').contains('Davom etish').click()
    cy.get('.btn-white-accent').contains('Boshlaymiz').click({ multiple: true, force: true })

    cy.get('.lesson-root').should('exist')
    cy.get('.btn-white-accent').should('exist')
  })

  it('preserves catalog when using browser back from lesson', () => {
    cy.visitCatalog()
    cy.get('a.lz-card[href="#/lesson/m7-07"]').click()
    cy.get('.lesson-root', { timeout: 15000 }).should('exist')

    cy.go('back')
    cy.contains('h1', 'Barcha darslar').should('be.visible')
  })

  it('restores self-study mode from localStorage after refresh', () => {
    cy.visitLesson('m1-01', { selfStudy: true })
    cy.dismissTourIfVisible()
    cy.contains("Darsga qo'shilish").should('not.exist')

    cy.reload()
    cy.get('.lesson-root', { timeout: 15000 }).should('exist')
    cy.contains("Darsga qo'shilish").should('not.exist')
  })

  it('handles empty search gracefully', () => {
    cy.visitCatalog()
    cy.get('input.lz-in').type('   ')
    cy.get('a.lz-card').should('have.length.at.least', 50)
  })

  it('disables lesson cards without component (soon state)', () => {
    cy.visitCatalog()
    cy.get('.lz-card.soon').should('have.length.at.least', 1)
    cy.get('.lz-card.soon').first().should('not.have.attr', 'href')
  })
})
