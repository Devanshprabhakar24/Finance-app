/**
 * NAVIGATION & UI TESTS
 * Covers: page routing, protected routes, sidebar navigation, 404
 */

describe('Navigation — Public Routes', () => {
  it('landing page loads at /', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
    // Should show landing page or redirect to dashboard if authenticated
  });

  it('login page loads at /login', () => {
    cy.clearLocalStorage();
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.contains('Welcome Back').should('be.visible');
  });

  it('register page loads at /register', () => {
    cy.clearLocalStorage();
    cy.visit('/register');
    cy.url().should('include', '/register');
  });

  it('404 page shows for unknown routes', () => {
    cy.visit('/this-route-does-not-exist', { failOnStatusCode: false });
    cy.url().should('include', '/this-route-does-not-exist');
    // Should show 404 page or redirect
    cy.get('body').should('be.visible');
  });
});

describe('Navigation — Protected Routes', () => {
  it('redirects unauthenticated users from /dashboard to /', () => {
    cy.clearLocalStorage();
    cy.visit('/dashboard');
    // ProtectedRoute should redirect to landing or login
    cy.url().should('not.include', '/dashboard');
  });

  it('redirects unauthenticated users from /dashboard/records to /', () => {
    cy.clearLocalStorage();
    cy.visit('/dashboard/records');
    cy.url().should('not.include', '/dashboard/records');
  });
});

describe('Navigation — Authenticated Sidebar', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.fixture('users').then((users) => {
      cy.loginByApi(users.admin.identifier, users.admin.password);
    });
    cy.visitDashboard();
  });

  it('dashboard page loads after login', () => {
    cy.url().should('include', '/dashboard');
    cy.contains('Overview').should('be.visible');
  });

  it('navigates to Transactions page via sidebar', () => {
    cy.contains('Transactions').click();
    cy.url().should('include', '/dashboard/records');
    cy.contains('Financial Records').should('be.visible');
  });

  it('navigates to Insights/Analytics page via sidebar', () => {
    cy.contains('Insights').click();
    cy.url().should('include', '/dashboard/analytics');
  });

  it('navigates to Account/Profile page via sidebar', () => {
    cy.contains('Account').click();
    cy.url().should('include', '/dashboard/profile');
  });

  it('logout button is visible and clickable', () => {
    cy.contains('Logout').should('be.visible').click();
    // After logout, should redirect away from dashboard
    cy.url().should('not.include', '/dashboard');
  });
});
