// Custom Cypress commands for InternetLesson e2e tests
// Note: allowCypressEnv is false — do not use Cypress.env(); use module state instead.

const LESSONS = {
  internet: { key: 'm1-01', lessonId: 'internet-01-v18' },
  mvpArch: { key: 'm7-07', lessonId: 'kod-mvp-arch-v16' },
  nestResource: { key: 'm4a-03', lessonId: 'nest-arch-resource-4a-02-v18' },
  // Smoke sample — Kod / PM / Proyekt across modules
  m1Html: { key: 'm1-03', lessonId: 'html-01-v17' },
  m1PmAudience: { key: 'm1-02', lessonId: 'pm-audience-01-v18' },
  m1HtmlPractice: { key: 'm1-08', lessonId: 'html-practice-portfolio-v2' },
  m2JsIntro: { key: 'm2-01', lessonId: 'js-intro-01-v18' },
  m2PmProblem: { key: 'm2-02', lessonId: 'pm-problem-solution-04-v18' },
  m2Practice1: { key: 'm2-08', lessonId: 'practice-01-jonlantirish-v18' },
  m3ReactIntro: { key: 'm3-01', lessonId: 'react-intro-01-v18' },
  m3UserStory: { key: 'm3-02', lessonId: 'pm-m3d2-v1' },
  m3CrudPractice: { key: 'm3-07', lessonId: 'react-crud-practice-p1-v18' },
  m4DataIntro: { key: 'm4-01', lessonId: 'data-intro-04-01-v18' },
  m4PmMetrics: { key: 'm4-02', lessonId: 'pm-metrics-11-v16' },
  m4BackendCrud: { key: 'm4-08', lessonId: 'backend-crud-practice-p1-v18' },
  m4aNestAlive: { key: 'm4a-01', lessonId: 'nest-arch-alive-4a-01-v18' },
  m4aPmScale: { key: 'm4a-02', lessonId: 'pm-scalability-15-v16' },
  m4aNestPractice: { key: 'm4a-04', lessonId: 'nest-arch-practice-4a-03-v18' },
  m4bJest: { key: 'm4b-01', lessonId: 'jest-unit-04b-01-v18' },
  m4bPmQuality: { key: 'm4b-02', lessonId: 'pm-quality-value-16-v16' },
  m4cCicd: { key: 'm4c-01', lessonId: 'cicd-intro-4c-01-v18' },
  m4cPmDelivery: { key: 'm4c-02', lessonId: 'pm-delivery-speed-17-v16' },
  m4cFullPipeline: { key: 'm4c-04', lessonId: 'cicd-full-pipeline-4c-03-v18' },
  m5BotIntro: { key: 'm5-01', lessonId: 'bot-intro-05-01-v18' },
  m5PmFirstUsers: { key: 'm5-02', lessonId: 'pm-first-users-19-v16' },
  m5BotAiProject: { key: 'm5-05', lessonId: 'bot-ai-project-05-05-v18' },
  m6SysArch: { key: 'm6-01', lessonId: 'sys-arch-06-01-v18' },
  m6PmPrd: { key: 'm6-02', lessonId: 'pm-prd-22-v16' },
  m6Pipeline: { key: 'm6-08', lessonId: 'pipeline-project-06-08-v18' },
  m7PmProduct: { key: 'm7-01', lessonId: 'pm-product-26-v16' },
  m7MvpBuild1: { key: 'm7-09', lessonId: 'mvp-build1-101-v16' },
}

/** Last lesson key visited — used by selfStudy() fallback */
let lastLessonKey = null

function applyLessonStorage(win, { selfStudy = false, lessonId = null } = {}) {
  win.localStorage.setItem('inetOnboarded_learner', '1')
  win.localStorage.setItem('inetOnboarded_mentor', '1')
  if (selfStudy && lessonId) {
    win.localStorage.setItem(`liveSession:${lessonId}`, JSON.stringify({ mode: 'self' }))
  }
}

Cypress.Commands.add('prepareLessonStorage', (lessonId) => {
  cy.window().then((win) => {
    applyLessonStorage(win, { selfStudy: true, lessonId })
  })
})

Cypress.Commands.add('visitCatalog', () => {
  cy.visit('/#/', {
    onBeforeLoad(win) {
      applyLessonStorage(win)
    },
  })
  cy.contains('h1', 'Barcha darslar').should('be.visible')
})

Cypress.Commands.add('visitLesson', (key, { selfStudy = false, lessonId = null } = {}) => {
  lastLessonKey = key
  const meta = Object.values(LESSONS).find((l) => l.key === key)
  const id = lessonId || meta?.lessonId

  cy.visit(`/#/lesson/${key}`, {
    onBeforeLoad(win) {
      applyLessonStorage(win, { selfStudy, lessonId: id })
    },
  })
  cy.get('.lesson-root', { timeout: 15000 }).should('exist')
})

Cypress.Commands.add('dismissTourIfVisible', () => {
  cy.get('body').then(($body) => {
    if ($body.find('.tg-root').length) {
      cy.contains('.tg-skip', "O'tkazib yuborish").click()
      cy.get('.tg-root').should('not.exist')
    }
  })
})

Cypress.Commands.add('selfStudy', () => {
  cy.get('body').then(($body) => {
    if ($body.find('.lesson-root').length && !$body.text().includes("Darsga qo'shilish")) {
      return
    }
    if ($body.text().includes("Mustaqil o'qiyman")) {
      cy.contains('button', "Mustaqil o'qiyman").click()
    } else {
      const meta = Object.values(LESSONS).find((l) => l.key === lastLessonKey)
      if (meta?.lessonId) {
        cy.prepareLessonStorage(meta.lessonId)
        cy.reload()
      }
    }
    cy.get('.lesson-root', { timeout: 10000 }).should('exist')
    cy.dismissTourIfVisible()
  })
})

Cypress.Commands.add('nextScreen', (label) => {
  if (label) {
    cy.get('[data-tour="next"], .btn-white-accent')
      .filter(':visible')
      .contains(label)
      .first()
      .should('not.be.disabled')
      .click()
  } else {
    cy.get('[data-tour="next"], .btn-white-accent')
      .filter(':visible')
      .first()
      .should('not.be.disabled')
      .click()
  }
})

Cypress.Commands.add('goBack', () => {
  cy.get('.btn-ghost').filter(':visible').contains('Orqaga').click()
})

Cypress.Commands.add('goHome', () => {
  cy.get('[aria-label="Bosh sahifa"]').click()
  cy.url().should('match', /#\/$/)
  cy.contains('h1', 'Barcha darslar').should('be.visible')
})

Cypress.Commands.add('completeHookScreen', () => {
  cy.get('.urlbar-go').click()
  cy.get('.hook-option').first().click()
  cy.nextScreen()
})

Cypress.Commands.add('assertNoOverlap', (selectorA, selectorB) => {
  cy.get(selectorA).then(($a) => {
    cy.get(selectorB).then(($b) => {
      const a = $a[0].getBoundingClientRect()
      const b = $b[0].getBoundingClientRect()
      const overlaps = !(
        a.right <= b.left ||
        a.left >= b.right ||
        a.bottom <= b.top ||
        a.top >= b.bottom
      )
      expect(overlaps, `${selectorA} should not overlap ${selectorB}`).to.be.false
    })
  })
})

Cypress.Commands.add('getProgressWidth', () => {
  return cy
    .get('[data-tour="progress"] .progress-bar')
    .invoke('attr', 'style')
    .then((style) => {
      const match = /width:\s*([\d.]+)%/.exec(style || '')
      return match ? parseFloat(match[1]) : 0
    })
})
