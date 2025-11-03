(() => {
  const DATE_RE  = /\b\d{2}\/\d{2}\/\d{4}\b/;
  const RANGE_RE = /([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([01]\d|2[0-3]):([0-5]\d)/;

  // --- Utilidades ---
  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const minutesToHHMM = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  const keyDate = (d) => {
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };
  const decodeHtml = (htmlEscaped) => {
    const div = document.createElement("div");
    div.innerHTML = htmlEscaped || "";
    div.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
    return div.textContent.trim();
  };
  const findNearestDate = (startEl) => {
    let el = startEl;
    for (let i = 0; el && i < 8; i++, el = el.parentElement) {
      const t = (el.innerText || "")
        .replace(/\s+/g, " ")
        .replace(/Solicitar modificación/gi, "")
        .trim();
      const m = t.match(DATE_RE);
      if (m) return m[0];
      let sib = el.previousElementSibling;
      for (let j = 0; sib && j < 6; j++, sib = sib.previousElementSibling) {
        const s = (sib.innerText || "")
          .replace(/\s+/g, " ")
          .replace(/Solicitar modificación/gi, "")
          .trim();
        const sm = s.match(DATE_RE);
        if (sm) return sm[0];
      }
    }
    return "";
  };

  // --- UI (botón + panel flotante) ---
  const ID_ROOT = "fichajes-extractor-root";
  if (document.getElementById(ID_ROOT)) return;

  const root = document.createElement("div");
  root.id = ID_ROOT;
  root.style.all = "initial";
  const shadow = root.attachShadow({ mode: "open" });
  document.documentElement.appendChild(root);

  const style = document.createElement("style");
  style.textContent = `
    .fx-btn {
      position: fixed; z-index: 999999;
      right: 16px; bottom: 16px;
      padding: 10px 14px; border-radius: 10px;
      background: #111; color: #fff; font: 500 13px system-ui, sans-serif;
      box-shadow: 0 4px 16px rgba(0,0,0,.25);
      border: 1px solid #333; cursor: pointer;
    }
    .fx-btn:hover { filter: brightness(1.15); }
    .fx-panel {
      position: fixed; z-index: 999998;
      right: 16px; bottom: 64px;
      width: min(700px, 90vw);
      max-height: min(80vh, 720px);
      background: #0b0b0b; color: #eaeaea;
      border: 1px solid #333; border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,.35);
      display: none; overflow: hidden;
      font: 13px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    .fx-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 12px; background: #141414; border-bottom: 1px solid #333;
    }
    .fx-title { font-weight: 600; }
    .fx-actions button {
      margin-left: 8px; padding: 6px 10px; border-radius: 8px;
      background: #222; color: #eee; border: 1px solid #444; cursor: pointer;
    }
    .fx-actions button:hover { filter: brightness(1.1); }
    .fx-body { padding: 8px 12px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      padding: 6px 8px; border-bottom: 1px solid #2a2a2a;
      text-align: left; white-space: nowrap;
    }
    th { position: sticky; top: 0; background: #101010; }
    tr.total-row { font-weight: bold; background: #121212; }
  `;
  shadow.appendChild(style);

  const btn = document.createElement("button");
  btn.className = "fx-btn";
  btn.textContent = "Fichajes ▶︎";
  shadow.appendChild(btn);

  const panel = document.createElement("div");
  panel.className = "fx-panel";
  panel.innerHTML = `
    <div class="fx-header">
      <div class="fx-title">Resumen de fichajes</div>
      <div class="fx-actions">
        <button id="fx-extract">Actualizar</button>
        <button id="fx-copy">Copiar CSV</button>
        <button id="fx-download">Descargar CSV</button>
        <button id="fx-close">Cerrar</button>
      </div>
    </div>
    <div class="fx-body">
      <div id="fx-table"></div>
    </div>
  `;
  shadow.appendChild(panel);

  const $ = (sel) => shadow.querySelector(sel);
  const showPanel = () => (panel.style.display = "block");
  const hidePanel = () => (panel.style.display = "none");

  // --- Extracción y render ---
  let lastCsv = "";

  function extractAndRender() {
    const bars = document.querySelectorAll(".progress-bar.time-checkin");
    const pairSeen = new Set();
    const dayTotals = new Map();
    const ensureDay = (d) => {
      if (!dayTotals.has(d)) dayTotals.set(d, { total: 0, pres: 0, tele: 0 });
      return dayTotals.get(d);
    };

    for (const bar of bars) {
      const raw = bar.getAttribute("data-original-title");
      if (!raw) continue;
      const tip = decodeHtml(raw);
      const m = tip.match(/([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)/);
      if (!m) continue;

      const inTime = `${m[1]}:${m[2]}`;
      const outTime = `${m[3]}:${m[4]}`;
      const date = findNearestDate(bar);
      if (!date) continue;

      const mode = /teletrabajo/i.test(tip) ? "Teletrabajo" : "Presencial";
      const key = `${date}|${inTime}|${outTime}|${mode}`;
      if (pairSeen.has(key)) continue;
      pairSeen.add(key);

      let start = toMinutes(inTime);
      let end = toMinutes(outTime);
      if (end < start) end += 24 * 60;
      const dur = Math.max(0, end - start);
      const acc = ensureDay(date);
      acc.total += dur;
      if (mode === "Teletrabajo") acc.tele += dur;
      else acc.pres += dur;
    }

    const daily = Array.from(dayTotals.entries())
      .map(([date, mins]) => ({
        date,
        totalMin: mins.total,
        presMin: mins.pres,
        teleMin: mins.tele,
      }))
      .sort((a, b) => keyDate(a.date).localeCompare(keyDate(b.date)));

    const grand = daily.reduce(
      (g, d) => {
        g.total += d.totalMin;
        g.pres += d.presMin;
        g.tele += d.teleMin;
        return g;
      },
      { total: 0, pres: 0, tele: 0 }
    );

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Total (HH:MM)</th>
          <th>Presencial (HH:MM)</th>
          <th>Teletrabajo (HH:MM)</th>
        </tr>
      </thead>
      <tbody>
        ${daily
          .map(
            (d) => `
          <tr>
            <td>${d.date}</td>
            <td>${minutesToHHMM(d.totalMin)}</td>
            <td>${minutesToHHMM(d.presMin)}</td>
            <td>${minutesToHHMM(d.teleMin)}</td>
          </tr>`
          )
          .join("")}
        <tr class="total-row">
          <td>GRAN TOTAL</td>
          <td>${minutesToHHMM(grand.total)}</td>
          <td>${minutesToHHMM(grand.pres)}</td>
          <td>${minutesToHHMM(grand.tele)}</td>
        </tr>
      </tbody>
    `;
    $("#fx-table").innerHTML = "";
    $("#fx-table").appendChild(table);

    lastCsv = [
      "date,total_hhmm,presencial_hhmm,teletrabajo_hhmm",
      ...daily.map(
        (d) =>
          `"${d.date}","${minutesToHHMM(d.totalMin)}","${minutesToHHMM(
            d.presMin
          )}","${minutesToHHMM(d.teleMin)}"`
      ),
      `"GRAN TOTAL","${minutesToHHMM(grand.total)}","${minutesToHHMM(
        grand.pres
      )}","${minutesToHHMM(grand.tele)}"`,
    ].join("\n");
  }

  // --- Eventos ---
  btn.addEventListener("click", () => {
    showPanel();
    extractAndRender();
  });
  $("#fx-close").addEventListener("click", hidePanel);
  $("#fx-extract").addEventListener("click", extractAndRender);
  $("#fx-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(lastCsv);
      alert("CSV copiado al portapapeles");
    } catch {
      alert("No se pudo copiar el CSV.");
    }
  });
  $("#fx-download").addEventListener("click", () => {
    const blob = new Blob([lastCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `fichajes-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
})();
