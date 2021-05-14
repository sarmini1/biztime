"use strict";

const request = require("supertest");

const app = require("./app");
const db = require("./db");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('sony', 'Sony', 'Audio company')
    RETURNING code, name, description`);
  testCompany = result.rows[0];
});

/** GET request routes for /companies */
describe("GET /companies", function () {
  test("Gets a list of 1 company", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({
      companies: [testCompany],
    });
  });
  test("Gets 1 company's information when passed into the url", async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);

    const invResults = await db.query(
      `SELECT id 
              FROM invoices
              WHERE comp_code=$1
              ORDER BY id`, [testCompany.code]);

    const invoices = invResults.rows;
    const invIds = invoices.map(inv => inv.id);
    testCompany.invoices = invIds;

    console.log("response body is", resp.body);
    console.log("testCompany is", {company: testCompany});

    expect(resp.body).toEqual({
      company: testCompany,
    });
  });
});

/** POST /companies - create company from data; 
 * return `{company: {code, name, description}}` */

describe("POST /companies", function () {
  test("Create new company", async function () {
    const resp = await request(app)
        .post(`/companies`)
        .send({ code: "apple",
                name: "Apple Computers",
                description: "Software"
      });
    console.log("resp.body is", resp.body);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: { 
                code: "apple",
                name: "Apple Computers",
                description: "Software" },
    });
  });
});