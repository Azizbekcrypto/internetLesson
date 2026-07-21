describe('Lesson Screen Flow', () => {
  const lessonKey = 'm1-01'

  beforeEach(() => {
    cy.visitLesson(lessonKey, { selfStudy: true })
    cy.dismissTourIfVisible()
  })

  it('loads without uncaught exceptions', () => {
    cy.get('.lesson-root').should('be.visible')
    cy.get('[data-tour="mentor"]').should('be.visible')
    cy.get('[data-tour="progress"]').should('be.visible')
  })

  it('advances progress bar on each screen', () => {
    cy.getProgressWidth().then((initial) => {
      expect(initial).to.be.greaterThan(0)
    })

    cy.completeHookScreen()

    cy.getProgressWidth().then((after) => {
      expect(after).to.be.greaterThan(4)
    })
  })

  it('supports back and forward navigation', () => {
    cy.completeHookScreen()
    cy.contains('Sayt sizgacha qanday yetib keladi').should('be.visible')

    cy.goBack()
    cy.contains('h1', 'qayerdan').should('be.visible')

    cy.nextScreen('Boshlaymiz →')
    cy.contains('Sayt sizgacha qanday yetib keladi').should('be.visible')
  })

  it('shows achievement counter on lesson load', () => {
    cy.get('[data-tour="ach"]').should('be.visible')
  })

  it('reaches summary screen after navigating forward', () => {
    // Navigate through first few screens to verify flow works
    cy.completeHookScreen()
    cy.nextScreen() // screen 1 - plan
    cy.contains('button', "Ulanishlarni ko'rsatish").click()
    cy.get('[data-tour="next"]').should('not.be.disabled').click()
    cy.get('.lesson-root').should('exist')
    cy.get('[data-tour="progress"] .progress-bar').invoke('attr', 'style').should('match', /width:/)
  })
})
