import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const outputFile = path.resolve(__dirname, '../tests/collection.json')

const collection = {
  info: {
    _postman_id: 'champions-club-api-collection',
    name: 'Champions Club Sports Complex API',
    description: 'Complete API Collection for Champions Club Management System matching API_CONTRACT.md v1.1',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000/api/v1', type: 'string' },
    { key: 'authToken', value: '', type: 'string' },
  ],
  item: [
    {
      name: '01. Auth',
      item: [
        {
          name: 'POST Register Member',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/auth/register', host: ['{{baseUrl}}'], path: ['auth', 'register'] },
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'Karan Mehra',
                email: 'karan.m@example.com',
                phone: '+919876543219',
                password: 'Password@123',
              }, null, 2),
            },
          },
        },
        {
          name: 'POST Login (Owner)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status is 200", () => pm.response.to.have.status(200));',
                  'const data = pm.response.json();',
                  'if (data.data && data.data.token) { pm.environment.set("authToken", data.data.token); }',
                ],
                type: 'text/javascript',
              },
            },
          ],
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] },
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: 'owner@championsclub.in', password: 'Admin@123' }, null, 2),
            },
          },
        },
        {
          name: 'POST Login (Member)',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status is 200", () => pm.response.to.have.status(200));',
                  'const data = pm.response.json();',
                  'if (data.data && data.data.token) { pm.environment.set("authToken", data.data.token); }',
                ],
                type: 'text/javascript',
              },
            },
          ],
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] },
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: 'member@championsclub.in', password: 'Member@123' }, null, 2),
            },
          },
        },
        {
          name: 'GET Me',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/auth/me', host: ['{{baseUrl}}'], path: ['auth', 'me'] },
            header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }],
          },
        },
        {
          name: 'PATCH Change Password',
          request: {
            method: 'PATCH',
            url: { raw: '{{baseUrl}}/auth/password', host: ['{{baseUrl}}'], path: ['auth', 'password'] },
            header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }, { key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ currentPassword: 'Member@123', newPassword: 'NewPassword@123' }, null, 2),
            },
          },
        },
        {
          name: 'POST Logout',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/auth/logout', host: ['{{baseUrl}}'], path: ['auth', 'logout'] },
            header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }],
          },
        },
      ],
    },
    {
      name: '02. Public API',
      item: [
        {
          name: 'GET Club Details',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/public/club', host: ['{{baseUrl}}'], path: ['public', 'club'] } },
        },
        {
          name: 'GET Public Plans',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/public/plans', host: ['{{baseUrl}}'], path: ['public', 'plans'] } },
        },
        {
          name: 'GET Public Courts',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/public/courts', host: ['{{baseUrl}}'], path: ['public', 'courts'] } },
        },
        {
          name: 'GET Public Availability',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/public/availability?from=2026-10-05&days=7', host: ['{{baseUrl}}'], path: ['public', 'availability'], query: [{ key: 'from', value: '2026-10-05' }, { key: 'days', value: '7' }] },
          },
        },
        {
          name: 'GET Public Categories',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/public/categories', host: ['{{baseUrl}}'], path: ['public', 'categories'] } },
        },
        {
          name: 'GET Public Products',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/public/products?page=1&limit=20', host: ['{{baseUrl}}'], path: ['public', 'products'] } },
        },
        {
          name: 'POST Public Enquiry',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/public/enquiries', host: ['{{baseUrl}}'], path: ['public', 'enquiries'] },
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ name: 'Vikram Seth', email: 'vikram.seth@example.com', phone: '+919988776655', interest: 'membership', message: 'Interested in Gold plan' }, null, 2),
            },
          },
        },
        {
          name: 'POST Public Trial Booking',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/public/trial-bookings', host: ['{{baseUrl}}'], path: ['public', 'trial-bookings'] },
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ name: 'Rohit Sharma', phone: '+919876543299', courtId: 'court-tennis-1', startAt: '2026-10-05T10:00:00.000Z' }, null, 2),
            },
          },
        },
      ],
    },
    {
      name: '03. Settings & Uploads',
      item: [
        {
          name: 'GET Settings',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/settings', host: ['{{baseUrl}}'], path: ['settings'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'PATCH Settings (Owner)',
          request: {
            method: 'PATCH',
            url: { raw: '{{baseUrl}}/settings', host: ['{{baseUrl}}'], path: ['settings'] },
            header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }, { key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ cancelCutoffHours: 3, lowStockDefault: 6 }, null, 2),
            },
          },
        },
      ],
    },
    {
      name: '04. Plans & Members',
      item: [
        {
          name: 'GET Plans',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/plans', host: ['{{baseUrl}}'], path: ['plans'] } },
        },
        {
          name: 'GET Members List',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/members?page=1&limit=20', host: ['{{baseUrl}}'], path: ['members'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'GET Members Lookup',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/members/lookup?q=Arun', host: ['{{baseUrl}}'], path: ['members', 'lookup'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'POST Create Member',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/members', host: ['{{baseUrl}}'], path: ['members'] },
            header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }, { key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ fullName: 'Ramesh Powar', phone: '+919988112233', planId: 'plan-gold-001', paymentMethod: 'cash' }, null, 2),
            },
          },
        },
        {
          name: 'GET Member Profile',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/members/mem-001', host: ['{{baseUrl}}'], path: ['members', 'mem-001'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'GET Member History',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/members/mem-001/history', host: ['{{baseUrl}}'], path: ['members', 'mem-001', 'history'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'PATCH Cancel Membership',
          request: { method: 'PATCH', url: { raw: '{{baseUrl}}/memberships/mship-mem-001/cancel', host: ['{{baseUrl}}'], path: ['memberships', 'mship-mem-001', 'cancel'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'POST Purchase Membership (Member)',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/me/membership/purchase', host: ['{{baseUrl}}'], path: ['me', 'membership', 'purchase'] },
            header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }, { key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: JSON.stringify({ planId: 'plan-gold-001' }, null, 2) },
          },
        },
      ],
    },
    {
      name: '05. Courts & Bookings',
      item: [
        {
          name: 'GET Courts',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/courts', host: ['{{baseUrl}}'], path: ['courts'] } },
        },
        {
          name: 'GET Courts Availability',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/courts/availability?date=2026-10-05', host: ['{{baseUrl}}'], path: ['courts', 'availability'] } },
        },
        {
          name: 'POST Create Booking',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/bookings', host: ['{{baseUrl}}'], path: ['bookings'] },
            header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }, { key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ courtId: 'court-tennis-1', startAt: '2026-10-05T10:00:00.000Z', paymentMethod: 'pay_at_club' }, null, 2),
            },
          },
        },
        {
          name: 'GET My Bookings',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/bookings/mine', host: ['{{baseUrl}}'], path: ['bookings', 'mine'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'GET All Bookings (Staff)',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/bookings', host: ['{{baseUrl}}'], path: ['bookings'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
      ],
    },
    {
      name: '06. Shop & Orders',
      item: [
        {
          name: 'POST Quote Cart',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/shop/orders/quote', host: ['{{baseUrl}}'], path: ['shop', 'orders', 'quote'] },
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: JSON.stringify({ items: [{ productId: 'prd-06', qty: 2 }] }, null, 2) },
          },
        },
        {
          name: 'POST Place Order',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/shop/orders', host: ['{{baseUrl}}'], path: ['shop', 'orders'] },
            header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }, { key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ items: [{ productId: 'prd-06', qty: 1 }], fulfilment: 'in_store', paymentMethod: 'pay_at_club' }, null, 2),
            },
          },
        },
        {
          name: 'GET Low Stock Products',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/products/low-stock', host: ['{{baseUrl}}'], path: ['products', 'low-stock'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'GET My Shop Orders',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/shop/orders/mine', host: ['{{baseUrl}}'], path: ['shop', 'orders', 'mine'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
      ],
    },
    {
      name: '07. Bar & Kitchen',
      item: [
        {
          name: 'GET Bar Menu',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/bar/menu', host: ['{{baseUrl}}'], path: ['bar', 'menu'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'GET Bar Tables',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/bar/tables', host: ['{{baseUrl}}'], path: ['bar', 'tables'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'GET Kitchen Display Queue',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/bar/kitchen', host: ['{{baseUrl}}'], path: ['bar', 'kitchen'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'GET Bar Summary',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/bar/summary?date=2026-10-03', host: ['{{baseUrl}}'], path: ['bar', 'summary'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
      ],
    },
    {
      name: '08. Payments Ledger',
      item: [
        {
          name: 'GET Payments List',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/payments?page=1&limit=20', host: ['{{baseUrl}}'], path: ['payments'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'POST Razorpay Verify',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/payments/razorpay/verify', host: ['{{baseUrl}}'], path: ['payments', 'razorpay', 'verify'] },
            header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }, { key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: JSON.stringify({ razorpayOrderId: 'order_test_123', razorpayPaymentId: 'pay_test_123', razorpaySignature: 'sig_test_123' }, null, 2) },
          },
        },
      ],
    },
    {
      name: '09. Leads & CRM',
      item: [
        {
          name: 'GET Leads List',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/leads', host: ['{{baseUrl}}'], path: ['leads'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'GET Follow-ups Due',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/leads/follow-ups', host: ['{{baseUrl}}'], path: ['leads', 'follow-ups'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
      ],
    },
    {
      name: '10. Reports & Analytics',
      item: [
        {
          name: 'GET Dashboard Analytics',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/reports/dashboard?range=month', host: ['{{baseUrl}}'], path: ['reports', 'dashboard'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'GET Revenue Report',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/reports/revenue?groupBy=day', host: ['{{baseUrl}}'], path: ['reports', 'revenue'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'GET Tax Report',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/reports/tax', host: ['{{baseUrl}}'], path: ['reports', 'tax'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'GET Payables Report',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/reports/payables', host: ['{{baseUrl}}'], path: ['reports', 'payables'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
        {
          name: 'GET Export CSV',
          request: { method: 'GET', url: { raw: '{{baseUrl}}/reports/export/revenue', host: ['{{baseUrl}}'], path: ['reports', 'export', 'revenue'] }, header: [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] },
        },
      ],
    },
    {
      name: '11. Internal Jobs',
      item: [
        {
          name: 'POST Trigger Background Job',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/internal/jobs/expireMemberships', host: ['{{baseUrl}}'], path: ['internal', 'jobs', 'expireMemberships'] },
            header: [{ key: 'x-job-secret', value: 'dev_job_secret' }],
          },
        },
      ],
    },
  ],
}

fs.writeFileSync(outputFile, JSON.stringify(collection, null, 2), 'utf8')
console.log(`✅ Postman Collection v2.1 generated successfully at: ${outputFile}`)
