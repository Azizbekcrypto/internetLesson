describe('Catalog and Navigation', () => {
  beforeEach(() => {
    cy.visitCatalog()
  })

  it('loads the catalog with module sections', () => {
    cy.contains('h1', 'Barcha darslar').should('be.visible')
    cy.get('section.lz-mod').should('have.length.at.least', 7)
    cy.get('a.lz-card').should('have.length.at.least', 50)
    cy.contains('1-MODUL').should('be.visible')
    cy.contains('7-MODUL').should('be.visible')
  })

  it('filters lessons by search query', () => {
    cy.get('input.lz-in').type('Internet qanday')
    cy.get('a.lz-card').should('have.length', 1)
    cy.contains('Internet qanday ishlaydi').should('be.visible')

    cy.get('input.lz-in').clear().type('xyznotfound123')
    cy.contains('Hech narsa topilmadi').should('be.visible')
  })

  it('filters lessons by type (Kod / PM / Proyekt)', () => {
    cy.contains('button.lz-pill', 'Kod').click()
    cy.get('a.lz-card .lz-chip').each(($chip) => {
      cy.wrap($chip).should('contain.text', 'Kod')
    })

    cy.contains('button.lz-pill', 'PM').click()
    cy.get('a.lz-card .lz-chip').each(($chip) => {
      cy.wrap($chip).should('contain.text', 'PM')
    })

    cy.contains('button.lz-pill', 'Proyekt').click()
    cy.get('a.lz-card .lz-chip').each(($chip) => {
      cy.wrap($chip).should('contain.text', 'Proyekt')
    })

    cy.contains('button.lz-pill', 'Hammasi').click()
    cy.get('a.lz-card').should('have.length.at.least', 50)
  })

  it('navigates to a lesson when clicking a card', () => {
    cy.get('a.lz-card[href="#/lesson/m1-01"]').click()
    cy.url().should('include', '#/lesson/m1-01')
    cy.get('.lesson-root', { timeout: 15000 }).should('exist')
  })

  it('returns to catalog via home button', () => {
    cy.visitLesson('m7-07')
    cy.goHome()
    cy.get('a.lz-card').should('have.length.at.least', 1)
  })

  it('scrolls to module sections via anchor links', () => {
    cy.get('a.lz-pill[href="#m2"]').click()
    cy.url().should('include', '#m2')
    cy.get('#m2').should('be.visible')
    cy.contains('h2', "Sistemalar qanday o'ylaydi").should('be.visible')
  })
})
