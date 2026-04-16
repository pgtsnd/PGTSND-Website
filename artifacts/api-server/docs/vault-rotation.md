# Rotating the Vault Master Key

Integration credentials (Stripe, DocuSign, Slack, Google Drive) stored in
`integration_settings.config` are encrypted at rest using AES-256-GCM with a key
derived from `VAULT_MASTER_KEY`. If that master key leaks, or you simply want to
rotate periodically, you can re-encrypt every row under a new key without
manually re-entering any secret.

The rotation runs in a single database transaction, so a failure mid-rotation
leaves the table untouched — there is no risk of a half-rotated, unreadable
state.

## Prerequisites

- You must be signed in as an `owner`.
- The currently-running server still holds the **old** `VAULT_MASTER_KEY` in
  its environment. Do not rotate the env var until after the API call below
  succeeds.
- Generate a strong new key, e.g.:

  ```bash
  openssl rand -base64 48
  ```

## Steps

1. **Trigger the rotation.** Send the old and new keys to the owner-only
   endpoint:

   ```bash
   curl -X POST https://your-host/api/integrations/vault/rotate \
     -H "Content-Type: application/json" \
     -H "Cookie: <your owner session cookie>" \
     -d '{
       "oldKey": "<current VAULT_MASTER_KEY>",
       "newKey": "<new VAULT_MASTER_KEY>"
     }'
   ```

   The server validates that `oldKey` matches the active master key, then opens
   a single transaction, decrypts every encrypted value with `oldKey`, and
   re-encrypts it with `newKey`. The transaction commits only after every row
   has been processed successfully.

   A successful response looks like:

   ```json
   {
     "message": "Rotation complete. Update VAULT_MASTER_KEY to the new value and restart the server.",
     "rowsRotated": 3,
     "valuesRotated": 7,
     "valuesSkipped": 0
   }
   ```

   `valuesSkipped` counts values that were not in the encrypted format (for
   example, plaintext rows that pre-date encryption). Run
   `POST /api/integrations/vault/encrypt-existing` first if you want everything
   encrypted before rotating.

2. **Update the environment variable.** Replace `VAULT_MASTER_KEY` in your
   deployment's secret store with the new value.

3. **Restart the API server.** The server must reload so its in-memory key
   matches what is now stored in the database.

## Failure handling

- If `oldKey` cannot decrypt an existing row (wrong key, corrupt value, etc.)
  the transaction is rolled back and the response is `500` with
  `"Failed to decrypt existing values with oldKey; rotation aborted"`. No rows
  are modified.
- If the database connection drops mid-rotation, Postgres rolls back the
  transaction automatically.
- If the request itself fails after the transaction commits but before you
  update the env var, simply update the env var and restart — the database is
  already consistent under the new key.

## Recovery: rotating back

If you need to revert, run the same endpoint with the keys swapped (the new
key as `oldKey`, the original as `newKey`) before changing the env var back.

## Notes

- The endpoint never logs the keys themselves, only counts of rotated rows.
- Plaintext (unencrypted) values are left as-is so a partially-encrypted table
  is still recoverable. Use `GET /api/integrations/vault` to see the current
  encrypted/unencrypted counts.
