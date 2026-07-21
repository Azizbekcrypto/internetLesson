describe('Self-Study Student Flow', () => {
  describe('MVP Architecture lesson (no LiveGate)', () => {
    beforeEach(() => {
      cy.visitLesson('m7-07')
    })

    it('enters lesson directly without live gate', () => {
      cy.contains("Darsga qo'shilish").should('not.exist')
      cy.get('.lesson-root').should('be.visible')
      cy.contains('h1', 'Million dollarlik sayt').should('be.visible')
    })

    it('completes hook screen and navigates forward', () => {
      cy.get('.hook-option').contains('Google Jadval').click()
      cy.get('.btn-white-accent').contains('Davom etish').should('not.be.disabled').click()
      cy.contains('h2', 'Arxitektura').should('be.visible')
    })

    it('navigates multiple screens without errors', () => {
      cy.get('.hook-option').first().click()
      cy.get('.btn-white-accent').contains('Davom etish').click()
      cy.get('.btn-white-accent').contains('Boshlaymiz').click()
      cy.get('.lesson-root').should('exist')
      cy.contains('3 qavat').should('be.visible')
    })
  })

  describe('Internet lesson (self-study via localStorage)', () => {
    beforeEach(() => {
      cy.visitLesson('m1-01', { selfStudy: true })
      cy.dismissTourIfVisible()
    })

    it('bypasses LiveGate in self-study mode', () => {
      cy.contains("Darsga qo'shilish").should('not.exist')
      cy.contains('h1', 'qayerdan').should('be.visible')
    })

    it('completes MC quiz with answer feedback', () => {
      cy.completeHookScreen()
      cy.nextScreen() // screen 1 - plan
      cy.contains('button', "Ulanishlarni ko'rsatish").click()
      cy.nextScreen() // screen 2 - network
      cy.contains('button', 'Chrome').click()
      cy.nextScreen() // screen 3 - browser
      // now on screen 4 - first quiz

      cy.contains('Brauzer').click()
      cy.get('.option-correct').should('exist')
      cy.get('[data-tour="next"]').should('not.be.disabled').click()
    })
  })

  describe('Nest resource lesson (self-study link)', () => {
    beforeEach(() => {
      cy.visitLesson('m4a-03')
    })

    it('offers Mustaqil o\'qiyman bypass on LiveGate', () => {
      cy.contains("Darsga qo'shilish").should('be.visible')
      cy.contains('button', "Mustaqil o'qiyman").click()
      cy.get('.lesson-root').should('exist')
      cy.contains("Darsga qo'shilish").should('not.exist')
    })
  })
})
