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
    // console.log("response body is", resp.body);
    // console.log("testCompany is", { company: {...testCompany, invoices:[]}});
    expect(resp.body).toEqual({ company: {...testCompany, invoices:[]}});
  });
});

/** POST /companies - create company from data; 
 * return `{company: {code, name, description}}` */

describe("POST /companies", function () {
  test("Create new company", async function () {
    const resp = await request(app)
      .post(`/companies`)
      .send({
        code: "apple",
        name: "Apple Computers",
        description: "Software"
      });
    console.log("resp.body is", resp.body);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: {
        code: "apple",
        name: "Apple Computers",
        description: "Software"
      },
    });
  });
});


/** PUT /companies [code]Edit existing company.

Should return 404 if company cannot be found.

Needs to be given JSON like: {name, description}

Returns update company object: {company: {code, name, description}} */


describe("PUT /companies/:code", function () {
  test("PUT /companies/:code", async function () {
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({ name: "LG", description: "Electornics" });
    expect(resp.body).toEqual({
      company: {
        code: testCompany.code,
        name: "LG",
        description: "Electornics",
      },
    });
    const results = await db.query("SELECT COUNT(*) FROM companies");
    expect(results.rows[0].count).toEqual("1");
  });
});


/** DELETE /[id] - Deletes company.

Should return 404 if company cannot be found.

Returns {status: "deleted"} */

describe("DELETE /companies/:code", function () {
  test("DELETE /companies/:code", async function () {
    const resp = await request(app)
      .delete(`/companies/${testCompany.code}`);
    expect(resp.body).toEqual({ status: "deleted" });
    const results = await db.query("SELECT COUNT(*) FROM companies");
    expect(results.rows[0].count).toEqual("0");
  });
});