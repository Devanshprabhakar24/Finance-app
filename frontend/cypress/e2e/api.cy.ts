/**
 * API INTEGRATION TESTS
 * Tests backend endpoints directly via cy.request()
 * No UI involved — pure HTTP assertions
 */

const API = Cypress.env('apiUrl'); // http://localhost:8000/api

// Helper: get a fresh CSRF token
function getCsrf() {
  return cy.request(`${API}/csrf-token`).its('body.csrfToken');
}

// ── Health Check ─────────────────────────────────────────────────────────────
describe('API — Health', () => {
  it('GET /api/health returns 200 with status ok', () => {
    cy.request(`${API}/health`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.status).to.eq('ok');
      expect(res.body).to.have.property('uptime');
      expect(res.body).to.have.property('memory');
    });
  });
});

// ── Auth API ─────────────────────────────────────────────────────────────────
describe('API — Auth', () => {
  it('POST /api/auth/login with valid credentials returns 200', () => {
    getCsrf().then((csrfToken) => {
      cy.fixture('users').then((users) => {
        cy.request({
          method: 'POST',
          url: `${API}/auth/login`,
          body: { identifier: users.admin.identifier, password: users.admin.password },
          headers: { 'X-CSRF-Token': csrfToken },
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.success).to.be.true;
          expect(res.body.message).to.include('OTP');
        });
      });
    });
  });

  it('POST /api/auth/login with invalid credentials returns 401', () => {
    getCsrf().then((csrfToken) => {
      cy.request({
        method: 'POST',
        url: `${API}/auth/login`,
        body: { identifier: 'nobody@test.com', password: 'wrongpass' },
        headers: { 'X-CSRF-Token': csrfToken },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(401);
        expect(res.body.success).to.be.false;
      });
    });
  });

  it('POST /api/auth/login with missing body returns 400', () => {
    getCsrf().then((csrfToken) => {
      cy.request({
        method: 'POST',
        url: `${API}/auth/login`,
        body: {},
        headers: { 'X-CSRF-Token': csrfToken },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 422]);
        expect(res.body.success).to.be.false;
      });
    });
  });

  it('POST /api/auth/verify-otp with wrong OTP returns 400', () => {
    getCsrf().then((csrfToken) => {
      cy.fixture('users').then((users) => {
        // First trigger login to create an OTP
        cy.request({
          method: 'POST',
          url: `${API}/auth/login`,
          body: { identifier: users.admin.identifier, password: users.admin.password },
          headers: { 'X-CSRF-Token': csrfToken },
          failOnStatusCode: false,
        });

        // Then try wrong OTP
        cy.request({
          method: 'POST',
          url: `${API}/auth/verify-otp`,
          body: { identifier: users.admin.identifier, otp: '000000', purpose: 'LOGIN' },
          headers: { 'X-CSRF-Token': csrfToken },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.be.oneOf([400, 401]);
          expect(res.body.success).to.be.false;
        });
      });
    });
  });
});

// ── Records API ───────────────────────────────────────────────────────────────
describe('API — Records', () => {
  let authToken: string;

  before(() => {
    // Authenticate once for all record tests
    getCsrf().then((csrfToken) => {
      cy.fixture('users').then((users) => {
        cy.request({
          method: 'POST',
          url: `${API}/auth/login`,
          body: { identifier: users.admin.identifier, password: users.admin.password },
          headers: { 'X-CSRF-Token': csrfToken },
        });

        cy.request({
          method: 'POST',
          url: `${API}/auth/verify-otp`,
          body: { identifier: users.admin.identifier, otp: '123456', purpose: 'LOGIN' },
          headers: { 'X-CSRF-Token': csrfToken },
        }).then((res) => {
          authToken = res.body.data.accessToken;
        });
      });
    });
  });

  it('GET /api/records returns 200 with data array', () => {
    cy.request({
      method: 'GET',
      url: `${API}/records`,
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array');
      expect(res.body.meta).to.have.property('totalCount');
    });
  });

  it('GET /api/records without auth returns 401', () => {
    cy.request({
      method: 'GET',
      url: `${API}/records`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it('POST /api/records creates a record and returns 201', () => {
    getCsrf().then((csrfToken) => {
      cy.fixture('records').then((records) => {
        cy.request({
          method: 'POST',
          url: `${API}/records`,
          body: {
            title: records.income.title + ' API Test',
            amount: parseFloat(records.income.amount),
            type: records.income.type,
            category: records.income.category,
            date: new Date().toISOString(),
            notes: records.income.notes,
          },
          headers: {
            Authorization: `Bearer ${authToken}`,
            'X-CSRF-Token': csrfToken,
          },
        }).then((res) => {
          expect(res.status).to.eq(201);
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.have.property('_id');
          expect(res.body.data.title).to.include(records.income.title);
        });
      });
    });
  });

  it('POST /api/records with missing fields returns 400', () => {
    getCsrf().then((csrfToken) => {
      cy.request({
        method: 'POST',
        url: `${API}/records`,
        body: { title: 'Incomplete' }, // missing required fields
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-CSRF-Token': csrfToken,
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 422]);
        expect(res.body.success).to.be.false;
      });
    });
  });
});

// ── Dashboard API ─────────────────────────────────────────────────────────────
describe('API — Dashboard', () => {
  let authToken: string;

  before(() => {
    getCsrf().then((csrfToken) => {
      cy.fixture('users').then((users) => {
        cy.request({
          method: 'POST',
          url: `${API}/auth/login`,
          body: { identifier: users.admin.identifier, password: users.admin.password },
          headers: { 'X-CSRF-Token': csrfToken },
        });
        cy.request({
          method: 'POST',
          url: `${API}/auth/verify-otp`,
          body: { identifier: users.admin.identifier, otp: '123456', purpose: 'LOGIN' },
          headers: { 'X-CSRF-Token': csrfToken },
        }).then((res) => {
          authToken = res.body.data.accessToken;
        });
      });
    });
  });

  it('GET /api/dashboard/summary returns financial summary', () => {
    cy.request({
      method: 'GET',
      url: `${API}/dashboard/summary`,
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.data).to.have.property('totalIncome');
      expect(res.body.data).to.have.property('totalExpense');
      expect(res.body.data).to.have.property('netBalance');
    });
  });

  it('GET /api/dashboard/summary without auth returns 401', () => {
    cy.request({
      method: 'GET',
      url: `${API}/dashboard/summary`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});
