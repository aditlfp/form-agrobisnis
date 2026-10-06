import { useState } from "react";
import QRCode from "qrcode";

const empty = { nama: "", whatsapp: "", kehadiran: "" };
const phonePattern = /^(08\d{8,13}|62\d{9,14})$/;

export default function App() {
  const [form, setForm] = useState(empty);
  const [result, setResult] = useState(null);
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!phonePattern.test(form.whatsapp))
      return setError("Gunakan format 08xxxxxxxxxx atau 62xxxxxxxxxx.");
    setBusy(true);
    try {
      const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
      const response = await fetch(`${base}/submit.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Data gagal disimpan.");
      setResult(body.data);
      setQr(await QRCode.toDataURL(body.data.id, { width: 256, margin: 2 }));
    } catch (err) {
      setError(err.message || "Tidak dapat menghubungi server.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setForm(empty);
    setResult(null);
    setQr("");
    setError("");
  }

  return (
    <main className="shell">
      <header>
        {!result && <div className="eyebrow">KONFIRMASI KEHADIRAN</div>}

        <h2>{result ? "Sampai jumpa." : "Isi data untuk mendapatkan"}</h2>

        <h1 className="highlight">
          {result
            ? "Terima kasih telah mengonfirmasi kehadiran."
            : "Voucher 10%"}
        </h1>

        <p className="intro">
          {result
            ? "Simpan QR ini sebagai bukti registrasi."
            : "Konfirmasi kehadiran Anda dan dapatkan voucher spesial."}
        </p>
      </header>

      {result ? (
        <section className="result" aria-live="polite">
          <div className="success-badge">✓ Registrasi berhasil</div>

          <img className="qr" src={qr} alt={`QR registrasi ${result.id}`} />

          <h2>{result.nama}</h2>

          <p className="phone">{result.whatsapp}</p>

          <p className="attendance">
            {result.kehadiran === "hadir" ? "✓ Hadir" : "Tidak hadir"}
          </p>

          <p className="id">ID · {result.id}</p>

          <div className="actions">
            <button className="primary" onClick={() => window.print()}>
              Cetak QR
            </button>

            <button className="secondary" onClick={reset}>
              Kembali
            </button>
          </div>
        </section>
      ) : (
        <form onSubmit={submit}>
          {/* Voucher */}
          <div className="voucher-card">
            <div className="voucher-icon">%</div>

            <div className="voucher-content">
              <span className="voucher-label">SPECIAL VOUCHER</span>

              <strong>DISKON 10%</strong>

              <span>Khusus untuk tamu yang melakukan konfirmasi</span>
            </div>

            <div className="voucher-notch top" />
            <div className="voucher-notch bottom" />
          </div>

          {/* Nama */}
          <div className="field">
            <label htmlFor="nama">Nama</label>

            <input
              id="nama"
              required
              maxLength="120"
              autoComplete="name"
              placeholder="Masukkan nama lengkap"
              value={form.nama}
              onChange={(e) =>
                setForm({
                  ...form,
                  nama: e.target.value,
                })
              }
            />
          </div>

          {/* WhatsApp */}
          <div className="field">
            <label htmlFor="whatsapp">No. WhatsApp</label>

            <input
              id="whatsapp"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              pattern="(08[0-9]{8,13}|62[0-9]{9,14})"
              title="Gunakan format 08xxxxxxxxxx atau 62xxxxxxxxxx"
              placeholder="081234567890"
              value={form.whatsapp}
              onChange={(e) =>
                setForm({
                  ...form,
                  whatsapp: e.target.value,
                })
              }
            />
          </div>

          {/* Kehadiran */}
          <fieldset>
            <legend>Konfirmasi kehadiran</legend>

            <div className="attendance-options">
              <label
                className={`attendance-card ${
                  form.kehadiran === "hadir" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="kehadiran"
                  value="hadir"
                  required
                  checked={form.kehadiran === "hadir"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      kehadiran: e.target.value,
                    })
                  }
                />

                <span className="radio-custom">✓</span>

                <span>
                  <strong>Hadir</strong>
                  <small>Saya akan hadir</small>
                </span>
              </label>

              <label
                className={`attendance-card ${
                  form.kehadiran === "tidak hadir" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="kehadiran"
                  value="tidak hadir"
                  checked={form.kehadiran === "tidak hadir"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      kehadiran: e.target.value,
                    })
                  }
                />

                <span className="radio-custom">✓</span>

                <span>
                  <strong>Tidak hadir</strong>
                  <small>Maaf, saya berhalangan</small>
                </span>
              </label>
            </div>
          </fieldset>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button className="primary submit" disabled={busy}>
            {busy ? "Menyimpan…" : "✓  Kirim Konfirmasi"}
          </button>
        </form>
      )}

      <footer>
        🔒 Data Anda aman dan hanya digunakan untuk keperluan acara.
      </footer>
    </main>
  );
}
