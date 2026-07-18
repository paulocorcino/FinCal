## Database schema (dbkit)

- Any schema work → read `docs/agents/database-schema.md` first, then the
  `README.md` of the folder where the work happens.
- The why behind a rule → `docs/agents/database-doctrine.md`.
- Golden rule: never finish a schema change with `python dbkit/tools/verify.py`
  failing (run from the repo root).
