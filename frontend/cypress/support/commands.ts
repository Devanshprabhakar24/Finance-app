/// <reference types="cypress" />

/**
 * Custom Cypress Commands
 * Reusable helpers for common actions across all test files
 */

// ─── Login via API (bypasses OTP — sets auth state directly) ───────────────
// This is the preferred way to authenticate in tests because:
// 1. OTP requires real email/SMS delivery
// 2. It's faster and more reliable than UI login
Cypress.Commands.add('loginByApi', (identifier: string, password: string) => {
  const apiUrl = Cypress.env('apiUrl');

  // Step 1: Get CSRF token
  cy.request({ url: `${apiUrl}/csrf-token`, method: 'GET' }).then((csrfRes) => {
    const csrfToken = csrfRes.body.csrfToken;

    // Step 2: Initiate login (triggers OTP in real flow, but in test mode OTP is 123456)
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: { identifier, password },
      headers: { 'X-CSRF-Token': csrfToken },
      failOnStatusCode: false,
    }).then(() => {
      // Step 3: Verify OTP with test code (backend OTP_EMAIL_TEST_MODE=true uses 123456)
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/verify-otp`,
        body: { identifier, otp: '123456', purpose: 'LOGIN' },
        headers: { 'X-CSRF-Token': csrfToken },
      }).then((verifyRes) => {
        const { accessToken, refreshToken, user } = verifyRes.body.data;

        // Step 4: Inject tokens into Zustand store via localStorage
        // Zustand persists auth state under the key 'auth-storage'
        const authState = {
          state: {
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            hasHydrated: true,
          },
          version: 0,
        };
        localStorage.setItem('auth-storage', JSON.stringify(authState));
      });
    });
  });
});

// ─── Navigate to dashboard after injecting auth ───────────────────────────
Cypress.Commands.add('visitDashboard', () => {
  cy.visit('/dashboard');
  // Wait for the dashboard to fully load
  cy.url().should('include', '/dashboard');
});

// ─── Fill and submit the Create Record form ───────────────────────────────
Cypress.Commands.add(
  'createRecord',
  (record: { type: string; title: string; amount: string; category: string; notes?: string }) => {
    cy.get('[data-testid="add-record-btn"]').click();
    cy.get('[data-testid="record-type"]').select(record.type);
    cy.get('[data-testid="record-title"]').clear().type(record.title);
    cy.get('[data-testid="record-amount"]').clear().type(record.amount);
    cy.get('[data-testid="record-category"]').select(record.category);
    if (record.notes) {
      cy.get('[data-testid="record-notes"]').type(record.notes);
    }
    cy.get('[data-testid="record-submit-btn"]').click();
  }
);

// ─── Wait for toast notification ──────────────────────────────────────────
Cypress.Commands.add('waitForToast', (message: string) => {
  // react-hot-toast renders in a div at the top of the DOM
  cy.contains(message, { timeout: 8000 }).should('be.visible');
});

// ─── Type OTP into the 6-digit input ──────────────────────────────────────
Cypress.Commands.add('typeOtp', (otp: string) => {
  otp.split('').forEach((digit, index) => {
    cy.get(`[data-testid="otp-input-${index}"]`).type(digit);
  });
});

// ─── TypeScript declarations ──────────────────────────────────────────────
declare global {
  namespace Cypress {
    interface Chainable {
      loginByApi(identifier: string, password: string): Chainable<void>;
      visitDashboard(): Chainable<void>;
      createRecord(record: {
        type: string;
        title: string;
        amount: string;
        category: string;
        notes?: string;
      }): Chainable<void>;
      waitForToast(message: string): Chainable<void>;
      typeOtp(otp: string): Chainable<void>;
    }
  }
}
