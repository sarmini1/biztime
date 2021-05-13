'use strict'

const express = require("express");
const db = require("../db");
const { NotFoundError } = require("../expressError");
const router = express.Router();

/** GET /invoices
Returns list of invoices, like {invoices: [{id, comp_code}, ...]}
 */
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT id, comp_code
         FROM invoices
         ORDER BY comp_code`);
  const invoices = results.rows;

  return res.json({ invoices });
});

/* GET /invoices/[id]
Returns obj on given invoice.

If invoice cannot be found, returns 404.

Returns {invoice: {id, amt, paid, add_date, paid_date, 
  company: {code, name, description}}
*/
router.get("/:id",
  async function (req, res, next) {
    const id = req.params.id;

    const invoiceResults = await db.query(
      `SELECT id, amt, paid, add_date, paid_date
               FROM invoices
               WHERE id = $1`, [id]);
    const invoice = invoiceResults.rows[0];

    if (invoice === undefined) {
      throw new NotFoundError("Invoice not found");
    }

    //console.log("desiredInvoice is", desiredInvoice);
    const compCodeResult = await db.query(
      `SELECT comp_code
              FROM invoices
              WHERE id = $1`, [id]);
    const desiredCompCode = compCodeResult.rows[0].comp_code;
    //console.log("desiredCompCode is", desiredCompCode);

    const invoiceCompanyResults = await db.query(
      `SELECT code, name, description
             FROM companies
             WHERE code = $1`, [desiredCompCode]);
    const invoiceCompany = invoiceCompanyResults.rows[0];
    //console.log("desiredCompCode is", desiredCompCode);
    //console.log("invoiceCompanyResults are", invoiceCompanyResults);

    invoice.company = invoiceCompany;

    return res.json({ invoice });
  });

/*
POST /invoices
Adds an invoice.

Needs to be passed in JSON body of: {comp_code, amt}

Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/

router.post("/", async function (req, res, next) {
  const { comp_code, amt } = req.body;

  //would be nice to add in a check that the information passed in
  // is all valid, aka amount is a number, this could be a middleware

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
           VALUES ($1, $2)
           RETURNING
                    id,
                    comp_code,
                    amt,
                    paid,
                    add_date,
                    paid_date`, [comp_code, amt]);
  const invoice = results.rows[0];

  return res.status(201).json({ invoice });
});

/**
 PUT /invoices/[id]
Updates an invoice.

If invoice cannot be found, returns a 404.

Needs to be passed in a JSON body of {amt}

Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.put("/:id", async function (req, res, next) {
  if ("id" in req.body) throw new BadRequestError("Not allowed");

  const id = req.params.id;
  const { amt } = req.body;
  const results = await db.query(
    `UPDATE invoices
         SET amt=$2
         WHERE id = $1
         RETURNING
                  id,
                  comp_code,
                  amt,
                  paid,
                  add_date,
                  paid_date`, [id, amt]);
  const invoice = results.rows[0];

  if (invoice === undefined) {
    throw new NotFoundError(`No matching invoice: ${id}`);
  }

  return res.json({ invoice });
});


module.exports = router;