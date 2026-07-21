/**
 * Thin smoke: open a sample of ready lessons (Kod / PM / Proyekt per module).
 * Load + shell UI only — no gated walks or deep journeys.
 */
const SMOKE = [
  { key: 'm1-03', type: 'Kod', module: 'm1' },
  { key: 'm1-02', type: 'PM', module: 'm1' },
  { key: 'm1-08', type: 'Proyekt', module: 'm1' },
  { key: 'm2-01', type: 'Kod', module: 'm2' },
  { key: 'm2-02', type: 'PM', module: 'm2' },
  { key: 'm2-08', type: 'Proyekt', module: 'm2' },
  { key: 'm3-01', type: 'Kod', module: 'm3' },
  { key: 'm3-02', type: 'PM', module: 'm3' },
  { key: 'm3-07', type: 'Proyekt', module: 'm3' },
  { key: 'm4-01', type: 'Kod', module: 'm4' },
  { key: 'm4-02', type: 'PM', module: 'm4' },
  { key: 'm4-08', type: 'Proyekt', module: 'm4' },
  { key: 'm4a-01', type: 'Kod', module: 'm4a' },
  { key: 'm4a-02', type: 'PM', module: 'm4a' },
  { key: 'm4a-04', type: 'Proyekt', module: 'm4a' },
  { key: 'm4b-01', type: 'Kod', module: 'm4b' },
  { key: 'm4b-02', type: 'PM', module: 'm4b' },
  { key: 'm4c-01', type: 'Kod', module: 'm4c' },
  { key: 'm4c-02', type: 'PM', module: 'm4c' },
  { key: 'm4c-04', type: 'Proyekt', module: 'm4c' },
  { key: 'm5-01', type: 'Kod', module: 'm5' },
  { key: 'm5-02', type: 'PM', module: 'm5' },
  { key: 'm5-05', type: 'Proyekt', module: 'm5' },
  { key: 'm6-01', type: 'Kod', module: 'm6' },
  { key: 'm6-02', type: 'PM', module: 'm6' },
  { key: 'm6-08', type: 'Proyekt', module: 'm6' },
  { key: 'm7-01', type: 'PM', module: 'm7' },
  { key: 'm7-09', type: 'Proyekt', module: 'm7' },
]

describe('Lesson smoke sample', () => {
  SMOKE.forEach(({ key, type, module }) => {
    it(`opens ${module} ${type} (${key})`, () => {
      cy.visitLesson(key, { selfStudy: true })
      cy.dismissTourIfVisible()
      cy.get('.lesson-root').should('be.visible')
      cy.contains("Darsga qo'shilish").should('not.exist')
      // Portable shell markers (data-tour mentor/progress exist only on some lessons)
      cy.get('.progress-track').should('be.visible')
      cy.get('.progress-bar').should('exist')
    })
  })
})
