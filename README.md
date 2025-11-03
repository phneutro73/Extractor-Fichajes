# 🕒 Extensión Chrome – **Extractor de Fichajes**

Esta extensión añade un botón flotante “**Fichajes ▶︎**” en la página de fichajes de tu empresa.
Al pulsarlo, extrae automáticamente los intervalos **Entrada–Salida** de cada día, calcula las **horas totales, presenciales y de teletrabajo**, y muestra una tabla con los resultados.
También permite **copiar o descargar el CSV** con el resumen diario y el **gran total**.

---

## 🚀 Instalación

1. **Descarga o clona** esta carpeta con los siguientes archivos:

   ```
   fichajes-ext/
   ├── manifest.json
   ├── content.js
   └── README.md
   ```

2. Abre Chrome y escribe en la barra de direcciones:

   ```
   chrome://extensions/
   ```

3. Activa el **Modo desarrollador** (arriba a la derecha).

4. Pulsa el botón **“Cargar descomprimida”**.

5. Selecciona la carpeta `fichajes-ext/`.

6. Asegúrate de que la extensión aparece activada ✅ en la lista.

---

## ⚙️ Configuración

1. Abre la página de fichajes de tu empresa (por ejemplo:
   `https://intranet.empresa.com/puntos_detalle_trabajador`).

2. Verás un botón flotante en la esquina inferior derecha:
   **🕒 Fichajes ▶︎**

3. Al hacer clic:

   * Se abrirá un panel con el **resumen diario** y el **gran total**.
   * Podrás:

     * 🔄 **Actualizar** los datos.
     * 📋 **Copiar CSV** al portapapeles.
     * 💾 **Descargar CSV** con nombre `fichajes-AAAA-MM-DD-HH-MM-SS.csv`.
     * ❌ **Cerrar** el panel.

---

## 🧩 Compatibilidad

* **Navegadores compatibles:** Google Chrome, Microsoft Edge (basado en Chromium), Brave, Opera.
* **Requiere:** Chrome versión 100 o superior.
* **Manifest Version:** 3 (compatible con extensiones modernas de Chrome).
* **URLs soportadas:**
  Puedes modificar el archivo `manifest.json` para ajustar las rutas:

  ```json
  "matches": [
    "https://*/puntos_detalle_trabajador*",
    "https://*/fichajes*",
    "https://*/presencia*"
  ]
  ```

---

## 🛠️ Personalización

Si tu sistema usa otra URL o estructura:

* Edita el campo `"matches"` del `manifest.json` con la dirección exacta.
* Ajusta los selectores en `content.js` si las clases HTML difieren.
  Por ejemplo, la extensión busca los intervalos en:

  ```html
  <div class="progress-bar time-checkin" data-original-title="08:05 - 14:03 ..."></div>
  ```

---

## 📤 Exportación

El CSV generado contiene las siguientes columnas:

| date           | total_hhmm | presencial_hhmm | teletrabajo_hhmm |
| -------------- | ---------- | --------------- | ---------------- |
| 01/11/2025     | 07:55      | 07:55           | 00:00            |
| 02/11/2025     | 08:15      | 00:00           | 08:15            |
| **GRAN TOTAL** | **16:10**  | **07:55**       | **08:15**        |

---

## 🧾 Notas

* Los datos se extraen **localmente** en tu navegador;
  la extensión **no envía información** a ningún servidor.
* No requiere permisos adicionales más allá de acceso a la página actual.
* Puedes **eliminarla en cualquier momento** desde `chrome://extensions/`.
