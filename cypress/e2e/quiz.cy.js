describe('Quiz Interactions', () => {
  beforeEach(() => {
    cy.visitLesson('m1-01', { selfStudy: true })
    cy.dismissTourIfVisible()

    // Navigate to first MC quiz (screen 4)
    cy.completeHookScreen()
    cy.nextScreen() // screen 1 - plan
    cy.contains('button', "Ulanishlarni ko'rsatish").click()
    cy.nextScreen() // screen 2 - network
    cy.contains('button', 'Chrome').click()
    cy.nextScreen() // screen 3 - browser
    // now on screen 4 - quiz
  })

  it('allows selecting an MC option', () => {
    cy.get('.option').should('have.length', 4)
    cy.get('.option').contains('Brauzer').click()
    cy.get('.option').first().should('be.disabled')
  })

  it('highlights correct answer after solving', () => {
    cy.get('.option').contains('Brauzer').click()
    cy.get('.option-correct').should('contain.text', 'Brauzer')
    cy.get('.option-wrong').should('have.length.at.least', 1)
  })

  it('shows wrong answer styling when incorrect option picked', () => {
    cy.get('.option').contains('Server').click()
    cy.get('.option-picked-wrong').should('exist')
    cy.get('.option-correct').should('contain.text', 'Brauzer')
  })

  it('enables continue button only after correct answer', () => {
    cy.get('[data-tour="next"]').should('be.disabled')
    cy.get('.option').contains('Server').click()
    cy.get('[data-tour="next"]').should('be.disabled')

    cy.get('.option').contains('Brauzer').click()
    cy.get('[data-tour="next"]').should('not.be.disabled')
  })

  it('shows feedback text after answering', () => {
    cy.get('.option').contains('Brauzer').click()
    cy.contains("To'g'ri").should('be.visible')
    cy.contains('Brauzer').should('be.visible')
  })
})
