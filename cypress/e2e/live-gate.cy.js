describe('Live Session Gate', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.removeItem('liveSession:internet-01-v18')
    })
    cy.visitLesson('m1-01', { selfStudy: false })
  })

  it('renders join form with PIN and nickname inputs', () => {
    cy.contains('h2', "Darsga qo'shilish").should('be.visible')
    cy.get('input[placeholder="483 920"]').should('be.visible')
    cy.get('input[placeholder*="Ismingiz"]').should('be.visible')
    cy.contains('button', "Qo'shilish").should('be.visible')
  })

  it('has hidden mentor login button with low opacity', () => {
    cy.get('[aria-label="Mentor"]')
      .should('exist')
      .and('be.visible')
      .then(($btn) => {
        const opacity = parseFloat($btn.css('opacity'))
        expect(opacity).to.be.lessThan(0.5)
      })
  })

  it('opens mentor login form when mentor button clicked', () => {
    cy.get('[aria-label="Mentor"]').click({ force: true })
    cy.contains('h2', 'Mentor kirishi').should('be.visible')
    cy.get('input[placeholder="Mentor kodi"]').should('be.visible')
    cy.contains('button', '← Orqaga').click()
    cy.contains('h2', "Darsga qo'shilish").should('be.visible')
  })

  it('validates empty nickname client-side', () => {
    cy.get('input[placeholder="483 920"]').type('123456')
    cy.contains('button', "Qo'shilish").click()
    cy.contains('Ismingizni kiriting').should('be.visible')
  })

  it('validates short PIN client-side', () => {
    cy.get('input[placeholder="483 920"]').type('12')
    cy.get('input[placeholder*="Ismingiz"]').type('Ali')
    cy.contains('button', "Qo'shilish").click()
    cy.contains("Kodni to'liq kiriting").should('be.visible')
  })

  it('shows error for non-existent PIN', () => {
    cy.intercept('GET', '**/live_sessions*', { statusCode: 200, body: [] }).as('liveSessions')

    cy.get('input[placeholder="483 920"]').type('999999')
    cy.get('input[placeholder*="Ismingiz"]').type('TestUser')
    cy.contains('button', "Qo'shilish").click()

    cy.wait('@liveSessions')
    cy.contains('Bunday kod topilmadi').should('be.visible')
  })
})

describe('Self-study bypass on NestArchResourceLesson', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      Object.keys(win.localStorage).forEach((k) => {
        if (k.startsWith('liveSession:')) win.localStorage.removeItem(k)
      })
    })
    cy.visitLesson('m4a-03', { selfStudy: false })
  })

  it('bypasses gate via Mustaqil o\'qiyman link', () => {
    cy.contains('button', "Mustaqil o'qiyman").should('be.visible').click()
    cy.get('.lesson-root').should('exist')
    cy.contains("Darsga qo'shilish").should('not.exist')
  })
})
