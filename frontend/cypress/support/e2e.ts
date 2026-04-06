// Import custom commands
import './commands';

// Suppress uncaught exceptions from the app that aren't test failures
// (e.g. React Query retries, network errors during test teardown)
Cypress.on('uncaught:exception', (err) => {
  // Ignore ResizeObserver errors (common in test environments)
  if (err.message.includes('ResizeObserver')) return false;
  // Ignore chunk load errors from lazy-loaded routes
  if (err.message.includes('Loading chunk')) return false;
  return true;
});

// Log test names to console for easier debugging
beforeEach(() => {
  const testTitle = Cypress.currentTest.titlePath.join(' > ');
  cy.log(`Running: ${testTitle}`);
});
