/**
 * AUTH FLOW TESTS
 * Covers: login UI, OTP verification, invalid credentials, redirects
 */

describe('Auth — Login Page', () => {
  beforeEach(() => {
    // Clear any existing auth state before each test
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  // ── Page renders correctly ──────────────────────────────────────────────
  it('renders the login form', () => {
    cy.get('[data-testid="login-identifier"]').should('be.visible');
    cy.get('[data-testid="login-password"]').should('be.visible');
    cy.get('[data-testid="login-submit"]').should('be.visible').and('contain', 'Sign In');
  });

  // ── Valid credentials → OTP page ────────────────────────────────────────
  it('submits valid credentials and redirects to OTP page', () => {
    cy.fixture('users').then((users) => {
      cy.get('[data-testid="login-identifier"]').type(users.admin.identifier);
      cy.get('[data-testid="login-password"]').type(users.admin.password);
      cy.get('[data-testid="login-submit"]').click();

      // Should navigate to OTP verification
      cy.url().should('include', '/verify-otp');
      cy.contains('Verify OTP').should('be.visible');
    });
  });

  // ── Invalid credentials → error toast ───────────────────────────────────
  it('shows error toast for invalid credentials', () => {
    cy.fixture('users').then((users) => {
      cy.get('[data-testid="login-identifier"]').type(users.invalid.identifier);
      cy.get('[data-testid="login-password"]').type(users.invalid.password);
      cy.get('[data-testid="login-submit"]').click();

      // Should show error toast, stay on login page
      cy.url().should('include', '/login');
      cy.contains('Login failed', { timeout: 8000 }).should('be.visible');
    });
  });

  // ── Empty form → validation errors ──────────────────────────────────────
  it('shows validation errors when submitting empty form', () => {
    cy.get('[data-testid="login-submit"]').click();
    // Zod validation should prevent submission and show errors
    cy.url().should('include', '/login');
  });

  // ── Password toggle ──────────────────────────────────────────────────────
  it('toggles password visibility', () => {
    cy.get('[data-testid="login-password"]').should('have.attr', 'type', 'password');
    // Click the eye icon button (sibling of password input)
    cy.get('[data-testid="login-password"]').parent().find('button').click();
    cy.get('[data-testid="login-password"]').should('have.attr', 'type', 'text');
  });

  // ── Forgot password link ─────────────────────────────────────────────────
  it('navigates to forgot password page', () => {
    cy.contains('Forgot password?').click();
    cy.url().should('include', '/auth/forgot-password');
  });

  // ── Register link ────────────────────────────────────────────────────────
  it('navigates to register page', () => {
    cy.contains('Create one').click();
    cy.url().should('include', '/register');
  });

  // ── Authenticated user redirected away from login ────────────────────────
  it('redirects authenticated users to dashboard', () => {
    cy.fixture('users').then((users) => {
      cy.loginByApi(users.admin.identifier, users.admin.password);
      cy.visit('/login');
      cy.url().should('include', '/dashboard');
    });
  });
});

// ── OTP Verification ────────────────────────────────────────────────────────
describe('Auth — OTP Verification', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('renders OTP inputs when navigated from login', () => {
    // Navigate to OTP page with required state
    cy.visit('/verify-otp', {
      state: { identifier: 'admin@finance.com', purpose: 'LOGIN' },
    });
    // All 6 OTP inputs should be visible
    for (let i = 0; i < 6; i++) {
      cy.get(`[data-testid="otp-input-${i}"]`).should('be.visible');
    }
  });

  it('redirects to /login if accessed without state', () => {
    cy.visit('/verify-otp');
    cy.url().should('include', '/login');
  });

  it('shows error for invalid OTP', () => {
    cy.visit('/verify-otp', {
      state: { identifier: 'admin@finance.com', purpose: 'LOGIN' },
    });
    cy.typeOtp('000000');
    cy.contains('Invalid OTP', { timeout: 8000 }).should('be.visible');
  });
});

// ── Registration Page ────────────────────────────────────────────────────────
describe('Auth — Registration Page', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/register');
  });

  it('renders the registration form', () => {
    cy.contains('Create Account').should('be.visible');
    cy.get('input[placeholder*="email" i]').should('be.visible');
  });

  it('shows validation error for invalid email format', () => {
    cy.get('input[placeholder*="email" i]').first().type('not-an-email');
    cy.get('input[placeholder*="email" i]').first().blur();
    cy.contains('Invalid email').should('be.visible');
  });

  it('shows error when emails do not match', () => {
    cy.get('input[placeholder*="email" i]').first().type('test@example.com');
    // Find confirm email input (second email input)
    cy.get('input[placeholder*="email" i]').eq(1).type('different@example.com');
    cy.get('input[placeholder*="email" i]').eq(1).blur();
    cy.contains('do not match').should('be.visible');
  });
});
