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
         FROM companies`);
  const companies = results.rows;
  return res.json({ companies });
});

router.get("/:code",
  async function (req, res, next) {
    const code = req.params.code;

    const results = await db.query(
      `SELECT code, name, description
               FROM companies
               WHERE code = $1`, [code]);
    const company = results.rows;

    //console.log("results are", results);

    if (company.length === 0) {
      throw new NotFoundError("Company not found");
    }
    return res.json({ company });
  });


/** POST / Adds a company.

Needs to be given JSON like: {code, name, description}

Returns obj of new company: {company: {code, name, description}}
*/

router.post("/", async function (req, res, next) {
  const {code, name, description} = req.body;
  // console.log('reqbody ====>>', req.body)
  const results = await db.query(
    `INSERT INTO companies (code, name, description)
         VALUES ($1, $2, $3)
         RETURNING code, name, description`, 
        [code, name, description]);
  // console.log('results ====>>', results) 
  const company = results.rows[0];

  return res.status(201).json({ company });
});


/** PUT /companies [code]Edit existing company.

Should return 404 if company cannot be found.

Needs to be given JSON like: {name, description}

Returns update company object: {company: {code, name, description}} */

router.put("/:id", async function (req, res, next) {
  if ("id" in req.body) throw new BadRequestError("Not allowed");

  const id = req.params.id;
  const results = await db.query(
    `UPDATE cats
         SET name=$1
         WHERE id = $2
         RETURNING id, name`,
    [req.body.name, id]);
  const cat = results.rows[0];

  if (!cat) throw new NotFoundError(`No matching cat: ${id}`);
  return res.json({ cat });
});


/** DELETE /[id] - Deletes company.

Should return 404 if company cannot be found.

Returns {status: "deleted"} */

router.delete("/:id", async function (req, res, next) {
  const id = req.params.id;
  const results = await db.query(
    "DELETE FROM cats WHERE id = $1 RETURNING id", [id]);
  const cat = results.rows[0];

  if (!cat) throw new NotFoundError(`No matching cat: ${id}`);
  return res.json({ message: "Cat deleted" });
});

module.exports = router;