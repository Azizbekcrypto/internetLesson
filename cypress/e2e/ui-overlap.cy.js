describe('UI Overlap Checks', () => {
  describe('Desktop viewport (1280x720)', () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
      cy.visitLesson('m7-07')
    })

    it('home button and lesson content are both visible', () => {
      cy.get('[aria-label="Bosh sahifa"]').should('be.visible')
      cy.get('.lesson-root').should('be.visible')
      cy.contains('h1', 'Million dollarlik sayt').should('be.visible')
    })

    it('mentor panel stays within lesson root bounds', () => {
      cy.get('[data-tour="mentor"], .mentor').first().then(($mentor) => {
        const mentor = $mentor[0].getBoundingClientRect()
        cy.get('.lesson-root').then(($root) => {
          const root = $root[0].getBoundingClientRect()
          expect(mentor.left).to.be.at.least(root.left - 5)
          expect(mentor.right).to.be.at.most(root.right + 5)
        })
      })
    })

    it('navigation buttons are visible and clickable', () => {
      cy.get('.hook-option').first().click()
      cy.get('.btn-white-accent').should('be.visible').and('not.be.disabled')
    })
  })

  describe('Mobile viewport (375x667)', () => {
    beforeEach(() => {
      cy.viewport(375, 667)
      cy.visitLesson('m7-07')
    })

    it('lesson content renders without horizontal overflow', () => {
      cy.get('.lesson-root').should('be.visible')
      cy.document().then((doc) => {
        const scrollWidth = doc.documentElement.scrollWidth
        const clientWidth = doc.documentElement.clientWidth
        expect(scrollWidth).to.be.at.most(clientWidth + 20)
      })
    })

    it('home button remains accessible on mobile', () => {
      cy.get('[aria-label="Bosh sahifa"]')
        .should('be.visible')
        .and('have.css', 'position', 'fixed')
    })
  })

  describe('Live badge overlap (self-study mode)', () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
      cy.visitLesson('m1-01', { selfStudy: true })
      cy.dismissTourIfVisible()
    })

    it('live badge does not block primary navigation', () => {
      cy.completeHookScreen()
      cy.get('[data-tour="next"]')
        .should('be.visible')
        .click({ force: false })
    })

    it('home button and live badge do not overlap', () => {
      cy.get('[data-tour="live"], .live-badge').then(($badge) => {
        if ($badge.length === 0) return
        cy.assertNoOverlap('[aria-label="Bosh sahifa"]', '[data-tour="live"], .live-badge')
      })
    })
  })
})
