# FURS Davčna Blagajna — Setup Guide

Slovenian fiscal cash register integration. Implements ZOI generation,
EOR submission, and QR code printing per the ZDavPR (Zakon o davčnem
potrjevanju računov).

## Architecture

```
+----------------+        +-------------------+        +----------+
|  Frontend POS  |  HTTP  |  FURS Mini-service|  SOAP  |   FURS   |
|  (Vite React)  | ------>|  (port 3004, Bun) | ------>|  Server  |
+----------------+        +-------------------+        +----------+
        |                          |
        |  REST (Cockpit CMS)      |  crypto (MD5, RSA-SHA1)
        v                          v
+----------------+        +-------------------+
|  Cockpit CMS   |        |  Generated RSA    |
|  (port 3030)   |        |  keypair (demo)   |
+----------------+        +-------------------+
```

## Mini-service

Location: `/home/z/my-project/mini-services/furs-service/`

```bash
cd /home/z/my-project/mini-services/furs-service
bun install         # one-time
bun run dev         # hot-reload dev mode
# OR
bun run start       # production mode
```

The service listens on **port 3004** and exposes:

| Endpoint                          | Method | Purpose                          |
|-----------------------------------|--------|----------------------------------|
| `/api/furs/health`                | GET    | Service status + mode            |
| `/api/furs/generate-zoi`          | POST   | Compute ZOI + QR code            |
| `/api/furs/submit-invoice`        | POST   | Submit invoice to FURS, get EOR  |

The frontend calls via `?XTransformPort=3004` so Caddy routes correctly.

## Test mode (default)

In test mode (no env vars set), the service:
- ✅ Generates real ZOI values (correct algorithm, MD5 → base32)
- ✅ Generates real QR codes (FURS format)
- ✅ Returns mock EORs (deterministic 36-char UUIDs derived from ZOI)
- ❌ Does NOT contact FURS — invoices are not legally valid

Use test mode for development and demos.

## Production mode

To enable real FURS submission:

```bash
export FURS_MODE=production
export FURS_CERT_PATH=/path/to/furs-cert.pem
export FURS_KEY_PATH=/path/to/furs-key.pem
# Optional: override the FURS endpoint
# export FURS_API_URL=https://blagajne.fu.gov.si:9002/v1/cash_registers/
```

The TLS certificate must be issued by FURS via the eDavki portal
(https://edavki.durs.si). Both test and production certificates are
available — use the test cert with the test FURS endpoint first.

**Note**: Production SOAP submission is currently stubbed in the
mini-service (`submitToFursReal`). A production deployment must implement
the full SOAP envelope per the FURS WSDL and use an HTTP client with
mutual TLS (e.g. undici's Agent with `cert` and `key` options).

## Cockpit CMS collections

### 1. `fiscalconfig` (singleton)

One record per location. Stores the FURS identifiers and invoice counter.

| Field                | Type    | Required | Notes                                   |
|----------------------|---------|----------|-----------------------------------------|
| `taxNumber`          | text    | yes      | 8-digit Slovenian tax number            |
| `businessUnit`       | text    | yes      | FURS-issued premise ID (e.g. "PRE")     |
| `electronicDevice`   | text    | yes      | FURS-issued device ID (e.g. "PRE1")     |
| `lastInvoiceNumber`  | number  | yes      | Last issued invoice number (counter)    |
| `controlSeq`         | number  | no       | Always 1 (standard algorithm)           |
| `testMode`           | boolean | no       | True = mock EORs, False = real FURS     |
| `restaurantName`     | text    | no       | Printed on receipt header               |
| `restaurantAddress`  | text    | no       | Printed on receipt header               |
| `operatorTaxNumber`  | text    | no       | Operator's tax number (optional)        |

### 2. `fiscalinvoice` (audit log)

One record per issued invoice.

| Field               | Type            | Required | Notes                                    |
|---------------------|-----------------|----------|------------------------------------------|
| `order`             | contentItemLink | yes      | Link → `order`. `multiple: false`.       |
| `invoiceNumber`     | text            | yes      | Sequential per device                    |
| `businessUnit`      | text            | yes      | Snapshot                                 |
| `electronicDevice`  | text            | yes      | Snapshot                                 |
| `zoi`               | text            | yes      | 26-char base32 protective mark           |
| `eor`               | text            | no       | 36-char FURS-returned ID (when submitted)|
| `qrCode`            | text            | no       | PNG data URL                             |
| `issueDateTime`     | text            | yes      | YYYY-MM-DDTHH:MM:SS                      |
| `issuedAt`          | number          | yes      | Unix timestamp                           |
| `totalAmount`       | number          | yes      | Total including tax                      |
| `taxesByRate`       | json            | no       | Array of {rate, base, tax, total}        |
| `paymentMethod`     | select          | yes      | Options: `cash`, `card`, `other`         |
| `customerTaxNumber` | text            | no       | For B2B invoices                         |
| `status`            | select          | yes      | `pending`, `submitted`, `failed`         |
| `submittedAt`       | number          | no       | When successfully submitted              |
| `errorMessage`      | text            | no       | If submission failed                     |
| `attempts`          | number          | no       | Submission attempt count                 |

## ZOI algorithm reference

```
input = taxNumber + issueDateTime + invoiceNumber + businessUnit + electronicDevice + controlSeq
md5  = MD5(input)                                   # 16 bytes
zoi  = base32(md5)                                  # 26 chars (RFC 4648, no padding)
sig  = RSA-SHA1(md5, privateKey)                    # 256 bytes (sent to FURS for verification)
```

The ZOI printed on the receipt is `base32(md5)` — NOT the signature.
The signature is sent in the SOAP envelope so FURS can verify the ZOI
was generated by the legitimate issuer.

## EOR (returned by FURS)

After successful submission, FURS returns a 36-character unique invoice
ID (EOR — Enkratna Identifikacijska Oznaka Računa). This must be
printed on the receipt.

## QR code format

The QR code content is the concatenation of:
```
ZOI + issueDateTime + invoiceNumber + taxNumber + total
```

A scanned QR code lets FURS verify the receipt is genuine.

## FURS registration (one-time, manual)

Before going live:

1. Log into https://edavki.durs.si with the company's digital certificate
2. Register a business premise (poslovni prostor) — receive a premise ID
3. Register an electronic device (elektronska naprava) for each POS — receive a device ID
4. Generate a TLS certificate for the device — download `.pem` files
5. Set `FURS_CERT_PATH` and `FURS_KEY_PATH` env vars on the mini-service
6. Set `FURS_MODE=production`
7. Configure the Fiscal Settings page with tax number + IDs
8. Run a test invoice via FURS test environment first

## Offline mode (48-hour rule)

If FURS is unreachable at checkout time:

1. ZOI is still generated locally (works without FURS)
2. Invoice is stored with `status="pending"`
3. Receipt is printed with ZOI but no EOR
4. A background job (TODO) must retry submission within 48 hours
5. Once submitted, the EOR is back-filled on the invoice record

Per Slovenian law (ZDavPR), invoices not submitted within 48 hours are
considered invalid and may incur fines.

## Verification checklist

- [ ] FURS mini-service running on port 3004 (`curl /api/furs/health`)
- [ ] `fiscalconfig` collection created in Cockpit CMS
- [ ] `fiscalinvoice` collection created in Cockpit CMS
- [ ] Fiscal Settings page filled in (tax number, business unit, device)
- [ ] Test checkout — receipt shows ZOI + EOR + QR code
- [ ] FURS test environment credentials obtained from eDavki
- [ ] Real TLS cert configured on mini-service
- [ ] `FURS_MODE=production` set
- [ ] Test invoice submitted to FURS test environment
- [ ] FURS production environment credentials obtained
- [ ] Go-live checklist signed off

## References

- FURS official docs: https://www.fu.gov.si/seznam-vsebin/elektronske-blagajne/
- ZDavPR full text: https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2014-01-1254
- FURS test endpoint: https://blagajne-test.fu.gov.si:9002/v1/cash_registers/
- FURS production endpoint: https://blagajne.fu.gov.si:9002/v1/cash_registers/
