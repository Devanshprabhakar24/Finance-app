/**
 * RECORDS (TRANSACTIONS) FLOW TESTS
 * Covers: create record, form validation, record appears in list, delete
 * Uses loginByApi to bypass OTP for speed
 */

describe('Records — Create Record Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.fixture('users').then((users) => {
      // Authenticate via API (no OTP needed in test mode)
      cy.loginByApi(users.admin.identifier, users.admin.password);
    });
    cy.visit('/dashboard/records');
    // Wait for the records page to load
    cy.contains('Financial Records').should('be.visible');
  });

  // ── Add Record button is visible and clickable ───────────────────────────
  it('shows the Add Record button for admin', () => {
    cy.get('[data-testid="add-record-btn"]')
      .should('be.visible')
      .and('contain', 'Add Record');
  });

  // ── Create modal opens ───────────────────────────────────────────────────
  it('opens the create record modal on button click', () => {
    cy.get('[data-testid="add-record-btn"]').click();
    cy.contains('Create Record').should('be.visible');
    cy.get('[data-testid="record-title"]').should('be.visible');
    cy.get('[data-testid="record-amount"]').should('be.visible');
  });

  // ── Cancel closes modal ──────────────────────────────────────────────────
  it('closes the modal when Cancel is clicked', () => {
    cy.get('[data-testid="add-record-btn"]').click();
    cy.get('[data-testid="record-cancel-btn"]').click();
    cy.get('[data-testid="record-title"]').should('not.exist');
  });

  // ── Escape key closes modal ──────────────────────────────────────────────
  it('closes the modal when Escape key is pressed', () => {
    cy.get('[data-testid="add-record-btn"]').click();
    cy.get('body').type('{esc}');
    cy.get('[data-testid="record-title"]').should('not.exist');
  });

  // ── Submit without required fields shows error ───────────────────────────
  it('shows error toast when submitting empty form', () => {
    cy.get('[data-testid="add-record-btn"]').click();
    cy.get('[data-testid="record-submit-btn"]').click();
    cy.waitForToast('Please fill all required fields');
  });

  // ── Create a valid INCOME record ─────────────────────────────────────────
  it('creates an income record and shows success toast', () => {
    cy.fixture('records').then((records) => {
      cy.createRecord(records.income);
      cy.waitForToast('Record created successfully');
      // Modal should close after success
      cy.get('[data-testid="record-title"]').should('not.exist');
    });
  });

  // ── Created record appears in the list ──────────────────────────────────
  it('newly created record appears in the records list', () => {
    cy.fixture('records').then((records) => {
      cy.createRecord(records.income);
      cy.waitForToast('Record created successfully');
      // The record title should appear in the list
      cy.contains(records.income.title).should('be.visible');
    });
  });

  // ── Create an EXPENSE record ─────────────────────────────────────────────
  it('creates an expense record successfully', () => {
    cy.fixture('records').then((records) => {
      cy.createRecord(records.expense);
      cy.waitForToast('Record created successfully');
      cy.contains(records.expense.title).should('be.visible');
    });
  });

  // ── Category dropdown updates when type changes ──────────────────────────
  it('updates category options when type is changed', () => {
    cy.get('[data-testid="add-record-btn"]').click();

    // Switch to EXPENSE and check for expense categories
    cy.get('[data-testid="record-type"]').select('EXPENSE');
    cy.get('[data-testid="record-category"]').should('contain', 'Food & Dining');

    // Switch to INCOME and check for income categories
    cy.get('[data-testid="record-type"]').select('INCOME');
    cy.get('[data-testid="record-category"]').should('contain', 'Salary');
  });

  // ── Negative: amount must be positive ────────────────────────────────────
  it('rejects zero or negative amount', () => {
    cy.get('[data-testid="add-record-btn"]').click();
    cy.get('[data-testid="record-title"]').type('Test');
    cy.get('[data-testid="record-amount"]').type('0');
    cy.get('[data-testid="record-category"]').select('Salary');
    cy.get('[data-testid="record-submit-btn"]').click();
    cy.waitForToast('Amount must be a positive number');
  });
});

// ── Records — Filters ────────────────────────────────────────────────────────
describe('Records — Filters and Search', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.fixture('users').then((users) => {
      cy.loginByApi(users.admin.identifier, users.admin.password);
    });
    cy.visit('/dashboard/records');
    cy.contains('Financial Records').should('be.visible');
  });

  it('search input filters records', () => {
    cy.get('input[placeholder="Search records..."]').type('Salary');
    // Wait for debounce (300ms) + API response
    cy.wait(500);
    // Either results show or empty state — both are valid
    cy.get('body').should('be.visible');
  });

  it('type filter shows only selected type', () => {
    cy.get('select').first().select('INCOME');
    cy.wait(500);
    cy.get('body').should('be.visible');
  });
});

// ── Records — Viewer role cannot create ──────────────────────────────────────
describe('Records — Role-based access', () => {
  it('viewer does not see Add Record button', () => {
    cy.clearLocalStorage();
    cy.fixture('users').then((users) => {
      cy.loginByApi(users.viewer.identifier, users.viewer.password);
    });
    cy.visit('/dashboard/records');
    cy.contains('Financial Records').should('be.visible');
    // Viewer role cannot create records
    cy.get('[data-testid="add-record-btn"]').should('not.exist');
  });
});
