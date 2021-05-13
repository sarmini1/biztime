'use strict'

const express = require("express");
const db = require("../db");
const { NotFoundError } = require("../expressError");
const router = express.Router();

/** GET /companies
Returns list of companies, like {companies: [{code, name}, ...]}
 */

router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name, description
         FROM companies 
         ORDER BY code`);
  const companies = results.rows;

  return res.json({ companies });
});

/** GET /companies/code
/** Return obj of company: {company: {code, name, description}}  

If the company given cannot be found, this should return a 404 status response. */

router.get("/:code",
  async function (req, res, next) {
    const code = req.params.code;

    const results = await db.query(
      `SELECT code, name, description
               FROM companies
               WHERE code = $1`, [code]);
    const company = results.rows[0];


    if (company === undefined) {
      throw new NotFoundError("Company not found");
    }

    return res.json({ company });
  });


/** POST / Adds a company.

Needs to be given JSON like: {code, name, description}

Returns obj of new company: {company: {code, name, description}}
*/

router.post("/", async function (req, res, next) {
  const { code, name, description } = req.body;
  const results = await db.query(
    `INSERT INTO companies (code, name, description)
         VALUES ($1, $2, $3)
         RETURNING code, name, description`,
    [code, name, description]);
  const company = results.rows[0];

  return res.status(201).json({ company });
});


/** PUT /companies [code]Edit existing company.

Should return 404 if company cannot be found.

Needs to be given JSON like: {name, description}

Returns update company object: {company: {code, name, description}} */

router.put("/:code", async function (req, res, next) {
  if ("code" in req.body) throw new BadRequestError("Not allowed");

  const code = req.params.code;
  const { name, description } = req.body;
  const results = await db.query(
    `UPDATE companies
         SET name=$1,
         description=$2
         WHERE code = $3
         RETURNING code, name, description`,
    [name, description, code]);
  const company = results.rows[0];

  if (company === undefined) {
    throw new NotFoundError(`No matching company: ${code}`);
  }

  return res.json({ company });
});


/** DELETE /[id] - Deletes company.

Should return 404 if company cannot be found.

Returns {status: "deleted"} */

router.delete("/:code", async function (req, res, next) {

  const code = req.params.code;
  const results = await db.query(
    `DELETE FROM companies 
    WHERE code = $1 
    RETURNING code`, [code]);
  const company = results.rows[0];

  if (company === undefined) {
    throw new NotFoundError(`No matching comapny: ${code}`);
  }

  return res.json({ Status: "deleted" });
});

module.exports = router;