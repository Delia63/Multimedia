# 📊 Vizualizare Date Eurostat — Țările UE (2000–2018)
 
Aplicație web client-side pentru vizualizarea interactivă a datelor statistice Eurostat privind **PIB-ul pe cap de locuitor**, **Speranța de Viață** și **Populația** pentru cele 27 de state membre ale Uniunii Europene, în perioada 2000–2018.

---

## 🗂️ Structura proiectului

```
Proiect multimedia/
├── 3_1095_STOICA_IOANA_DELIA.html   # Pagina principală
├── 3_1095_STOICA_IOANA_DELIA.css    # Stiluri
├── 3_1095_STOICA_IOANA_DELIA.js     # Logica aplicației (~800 linii)
└── media/
    └── eurostat.json                 # Sursă de date (~9200 înregistrări)
```

---

## ✨ Funcționalități

### 1. Grafic SVG — Evoluție Indicator
- Grafic liniar desenat nativ în SVG (fără librării externe)
- Selectați **țara** și **indicatorul** (PIB / Speranță Viață / Populație)
- Axe X (ani: 2000–2018) și Y (valori scalate dinamic) cu etichete
- **Tooltip interactiv** la hover — afișează anul și valoarea exactă

### 2. Bubble Chart — Comparație Țări (Canvas 2D)
- Desenat pe element `<canvas>` cu API-ul Canvas 2D
- **Axa X:** PIB pe cap de locuitor | **Axa Y:** Speranță de Viață
- **Dimensiunea bulei:** proporțională cu populația țării
- Fiecare țară are o culoare distinctă; codul ISO afișat pe bulele mari
- Selectare an din dropdown pentru actualizare instantă

### 3. Animație automată (2000 → 2018)
- Buton **▶ Start Animație** / **⏹ Stop Animație**
- Parcurge automat toți anii cu un interval de 800ms/cadru
- Sincronizează simultan bubble chart-ul, tabelul și selectorul de an
- Implementată cu `requestAnimationFrame` pentru performanță optimă

### 4. Tabel de date cu codare cromatică
- Afișează toate cele 27 de țări pentru anul selectat
- Culorile celulelor reflectă poziția față de **media UE**:
  - 🔴 Nuanțe de **roșu** — sub media UE
  - 🟢 Nuanțe de **verde** — peste media UE
- Se actualizează sincronizat cu animația și selectorul de an

---

## 📦 Date

Fișierul `media/eurostat.json` conține **~9.200 înregistrări** în formatul:

```json
{
  "tara": "RO",
  "an": "2018",
  "indicator": "PIB",
  "valoare": 9560
}
```

**Indicatori disponibili:**
| Cod | Descriere | Unitate |
|-----|-----------|---------|
| `PIB` | PIB pe cap de locuitor | EUR |
| `SV` | Speranța de Viață | ani |
| `POP` | Populație | persoane |

**Țări acoperite:** BE, BG, CZ, DK, DE, EE, IE, EL, ES, FR, HR, IT, CY, LV, LT, LU, HU, MT, NL, AT, PL, PT, RO, SI, SK, FI, SE

---

## 🚀 Rulare

Proiectul este **pur client-side** (HTML + CSS + JavaScript vanilla) și nu necesită instalare sau build.

> ⚠️ Fișierul JSON este încărcat via `fetch()`, deci este necesară servirea printr-un server HTTP (nu funcționează direct din sistemul de fișiere cu `file://`).

### Opțiuni de rulare:

**1. VS Code — Live Server** *(recomandat)*
- Instalează extensia *Live Server*
- Click dreapta pe `3_1095_STOICA_IOANA_DELIA.html` → *Open with Live Server*

**2. Python**
```bash
python -m http.server 8080
# Deschide: http://localhost:8080/3_1095_STOICA_IOANA_DELIA.html
```

**3. Node.js**
```bash
npx serve .
# Deschide adresa afișată în terminal
```

---

## 🛠️ Tehnologii

| Tehnologie | Utilizare |
|------------|-----------|
| HTML5 | Structura paginii, `<svg>`, `<canvas>` |
| CSS3 | Layout flexbox, design responsive |
| JavaScript ES5/ES6 | Logica completă, manipulare DOM |
| SVG (nativ) | Graficul liniar cu axe și tooltip |
| Canvas 2D API | Bubble chart interactiv |
| Fetch API | Încărcarea datelor JSON |
| `requestAnimationFrame` | Animația fluidă an cu an |

---

## 📐 Arhitectură JS

```
incarcaDate()           — Fetch JSON + inițializare
  ├── structureazaDate()    — Indexare rapidă [tara][indicator][an]
  ├── populeazaSelectoare() — Populare dropdown-uri
  ├── adaugaEventListeners()— Evenimente change/click/mousemove
  ├── deseneazaGrafic()     — SVG: axe + linie + tooltip
  ├── deseneazaBubbleChart()— Canvas: bule colorate per țară
  └── genereazaTabel()      — Tabel HTML cu culori relative la medie
```
