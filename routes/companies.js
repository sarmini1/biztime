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


module.exports = router;