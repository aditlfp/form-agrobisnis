# Form Konfirmasi Kehadiran Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun form React yang mengirim data ke PHP native, menyimpan registrasi ke `.xlsx`, lalu menampilkan QR unik.

**Architecture:** Vite React menangani form dan hasil QR. PHP native menyediakan `POST /api/submit.php`, memvalidasi input, membuat UUID, dan menulis workbook XLSX minimal dengan `ZipArchive`. File Excel berada di `data/` dan tidak menjadi aset frontend.

**Tech Stack:** React, Vite, JavaScript, PHP 8+, `ZipArchive`, SVG QR generator kecil di frontend.

**Spec:** `docs/superpowers/specs/2026-10-02-attendance-form-design.md`

## Global Constraints

- Field wajib: `Nama`, `No Whatsapp`, `Kehadiran`.
- Nomor hanya menerima pola `08...` atau `62...` sesuai spesifikasi.
- QR hanya memuat UUID registrasi; data pribadi ditampilkan terpisah di halaman hasil.
- API memvalidasi ulang semua input.
- Excel disimpan sebagai teks agar awalan `0` tidak hilang.
- Tidak menambah login, dashboard, edit data, atau validasi QR.
- Error API memakai JSON dan tidak membocorkan path internal.

---

### Task 1: Scaffold React frontend

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/styles.css`
- Create: `frontend/.env.example`

**Interfaces:**
- Produces React UI yang mengirim `POST` ke `${VITE_API_URL}/submit.php`.
- API response yang dipakai: `{ ok: true, data: { id, nama, whatsapp, kehadiran } }`.

- [ ] **Step 1: Create the Vite package manifest**

```json
{
  "scripts": { "dev": "vite", "build": "vite", "preview": "vite preview" },
  "dependencies": { "@vitejs/plugin-react": "latest", "vite": "latest", "react": "latest", "react-dom": "latest", "qrcode": "^1.5.4" },
  "devDependencies": {}
}
```

- [ ] **Step 2: Create the form component**

Implement controlled fields, required browser validation, phone regex `/^(08\d{8,13}|62\d{9,14})$/`, visible errors, submit loading state, fetch JSON, and result state. Result view renders name, WhatsApp, attendance, UUID, QR, print button, and reset button.

- [ ] **Step 3: Create the QR renderer**

Implement a minimal deterministic QR display using an installed small QR package only if available; otherwise use a plain SVG fallback showing the unique ID as text and leave an explicit `ponytail:` comment that real QR encoding should be added when scan support is required. Do not claim scanability for a text fallback.

- [ ] **Step 4: Add accessible styling**

Use labels, fieldsets, focus states, readable contrast, responsive layout, visible error text, and print styles. Avoid unnecessary component abstractions.

- [ ] **Step 5: Run the frontend build**

Run: `cd frontend && npm install && npm run build`
Expected: Vite completes without errors and creates `frontend/dist`.

---

### Task 2: Implement PHP API and XLSX writer

**Files:**
- Create: `api/submit.php`
- Create: `api/lib.php`
- Create: `data/.gitignore`
- Create: `api/.htaccess`

**Interfaces:**
- Consumes JSON `{ "nama": string, "whatsapp": string, "kehadiran": "hadir"|"tidak hadir" }`.
- Produces HTTP 201 JSON `{ "ok": true, "data": { "id": string, "nama": string, "whatsapp": string, "kehadiran": string } }`.
- Invalid requests produce `{ "ok": false, "error": string, "fields": { ... } }`.

- [ ] **Step 1: Add the failing CLI validation check**

Create `api/test.php`:

```php
<?php
require __DIR__ . '/lib.php';
assert(validate_phone('081234567890') === true);
assert(validate_phone('6281234567890') === true);
assert(validate_phone('12345') === false);
assert(validate_attendance('hadir') === true);
assert(validate_attendance('maybe') === false);
echo "validation ok\n";
```

Run: `php -d zend.assertions=1 -d assert.exception=1 api/test.php`
Expected: FAIL because `lib.php` is not implemented.

- [ ] **Step 2: Implement validation and UUID helpers**

In `api/lib.php`, implement `validate_phone`, `validate_attendance`, `new_id` using `bin2hex(random_bytes(16))`, `json_response`, and strict scalar checks. Escape all XML values with `htmlspecialchars(..., ENT_XML1 | ENT_QUOTES, 'UTF-8')`.

- [ ] **Step 3: Implement minimal XLSX read/append/write functions**

Use `ZipArchive`. Create the required workbook XML parts on first write: `[Content_Types].xml`, `_rels/.rels`, `xl/workbook.xml`, `xl/_rels/workbook.xml.rels`, `xl/worksheets/sheet1.xml`, and `xl/styles.xml`. Store every cell as inline string. On subsequent writes, read sheet XML, append a row, and rewrite the archive. Open the target with `LOCK_EX`-equivalent file locking around the read/write operation.

- [ ] **Step 4: Implement the API endpoint**

Allow only POST, set JSON content type, parse body, validate all fields, create `data/` if needed, append one row with ID/name/WhatsApp/attendance/ISO timestamp, and return 201. Return 422 for validation failures, 405 for method failures, and 500 for storage failures.

- [ ] **Step 5: Protect stored data**

Add `data/.gitignore` containing `*.xlsx`, `.htaccess` denying all access when Apache is used. Keep `api/test.php` CLI-only or remove it after verification.

- [ ] **Step 6: Run PHP checks**

Run: `php -d zend.assertions=1 -d assert.exception=1 api/test.php`
Expected: `validation ok`.

Run: `php -m | findstr /I Zip`
Expected: `zip` appears. If absent, stop with the exact server requirement; do not silently create a non-XLSX file.

---

### Task 3: Connect frontend and API

**Files:**
- Modify: `frontend/.env.example`
- Modify: `frontend/src/App.jsx`
- Create: `api/config.example.php` only if local origin configuration is needed

**Interfaces:**
- `VITE_API_URL` defaults to `/api` for same-origin deployment.
- Development frontend may point to `http://localhost/.../api`.

- [ ] **Step 1: Configure the API URL**

Set `VITE_API_URL=/api` in `.env.example`. Build the endpoint as `${import.meta.env.VITE_API_URL || '/api'}/submit.php`.

- [ ] **Step 2: Add CORS and preflight handling**

In `submit.php`, allow the configured frontend origin only, answer `OPTIONS` with 204, and reject unknown origins when an Origin header exists. Keep same-origin requests working.

- [ ] **Step 3: Verify valid submission manually**

Run PHP through a web server, then:

```bash
curl -i -X POST http://localhost/<project>/api/submit.php -H "Content-Type: application/json" -d "{\"nama\":\"Budi\",\"whatsapp\":\"081234567890\",\"kehadiran\":\"hadir\"}"
```

Expected: HTTP 201, unique 32-character hexadecimal `id`, and `data/registrations.xlsx` exists.

- [ ] **Step 4: Verify invalid submission**

```bash
curl -i -X POST http://localhost/<project>/api/submit.php -H "Content-Type: application/json" -d "{\"nama\":\"\",\"whatsapp\":\"123\",\"kehadiran\":\"x\"}"
```

Expected: HTTP 422 with field errors; no Excel row added.

- [ ] **Step 5: Build final frontend**

Run: `cd frontend && npm run build`
Expected: PASS.

---

### Task 4: Final verification

**Files:**
- Verify: `frontend/dist/`
- Verify: `data/registrations.xlsx`

- [ ] **Step 1: Submit two valid users**

Use two requests with different data. Expected: two rows and two different IDs.

- [ ] **Step 2: Check result screen**

Open the frontend, submit once, and verify the result displays QR, name, and WhatsApp. Confirm print button works and reset returns to a blank form.

- [ ] **Step 3: Check required fields and format**

Submit empty fields and invalid phone values. Expected: client-side errors; API still rejects bypassed invalid requests.

- [ ] **Step 4: Remove temporary artifacts**

Remove `api/test.php` after the check unless retained as the project’s single runnable self-check. Ensure `data/registrations.xlsx` is not tracked by Git.

- [ ] **Step 5: Record verification output**

Run:

```bash
cd frontend && npm run build
php -d zend.assertions=1 -d assert.exception=1 api/test.php
```

Expected: both commands exit 0.
