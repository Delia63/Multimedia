
// variabila globala pentru stocarea datelor incarcate
let dateEurostat = [];

// variabila pentru datele structurate => [codTara][indicator][an]
let dateStructurate = {};

const tarileCod = ['BE', 'BG', 'CZ', 'DK', 'DE', 'EE', 'IE', 'EL', 'ES', 'FR',
    'HR', 'IT', 'CY', 'LV', 'LT', 'LU', 'HU', 'MT', 'NL', 'AT',
    'PL', 'PT', 'RO', 'SI', 'SK', 'FI', 'SE'];

//dictionar pt tari cu numele + cod
const tariNume = {
    'BE': 'Belgia', 'BG': 'Bulgaria', 'CZ': 'Cehia', 'DK': 'Danemarca',
    'DE': 'Germania', 'EE': 'Estonia', 'IE': 'Irlanda', 'EL': 'Grecia',
    'ES': 'Spania', 'FR': 'Franta', 'HR': 'Croatia', 'IT': 'Italia',
    'CY': 'Cipru', 'LV': 'Letonia', 'LT': 'Lituania', 'LU': 'Luxemburg',
    'HU': 'Ungaria', 'MT': 'Malta', 'NL': 'Olanda', 'AT': 'Austria',
    'PL': 'Polonia', 'PT': 'Portugalia', 'RO': 'Romania', 'SI': 'Slovenia',
    'SK': 'Slovacia', 'FI': 'Finlanda', 'SE': 'Suedia'
};

const indicatori = ['PIB', 'SV', 'POP'];

const ani = [];
for (let a = 2000; a <= 2018; a++) {
    ani.push(a);
}

function structureazaDate(dateJSON) {
    let structura = {};

    // initializare structura pentru fiecare tara
    tarileCod.forEach(function (tara) {
        structura[tara] = {
            PIB: {},
            SV: {},
            POP: {}
        };
    });

    // parcurgerea datelor si le adaugarea in structura
    dateJSON.forEach(function (item) {
        if (structura[item.tara] && structura[item.tara][item.indicator]) {
            structura[item.tara][item.indicator][item.an] = item.valoare;
        }
    });

    return structura;
}

// incarcarea datelor din json prin fetch
function incarcaDate() {
    fetch('media/eurostat.json')
        .then(function (raspuns) {

            // verificam daca raspunsul este OK
            if (!raspuns.ok) {
                throw new Error('Eroare la incarcarea fisierului JSON');
            }

            // convertim raspunsul in JSON
            return raspuns.json();
        })
        .then(function (date) {
            dateEurostat = date;
            console.log('Date incarcate:', dateEurostat.length, 'inregistrari');

            // structurarea datelor  pentru acces rapid
            dateStructurate = structureazaDate(dateEurostat);
            console.log('Date structurate! Exemplu RO-PIB-2018:', dateStructurate['RO']['PIB']['2018']);

            // populare dropdown-uri
            populeazaSelectoare();
            // adaugare event listeners
            adaugaEventListeners();

            // desenare grafic
            deseneazaGrafic();

            // desenare bubble chart
            deseneazaBubbleChart('2018');

            // generare tabel
            genereazaTabel('2018');
        })
        .catch(function (eroare) {
            console.error('Eroare:', eroare.message);
        });
}

function populeazaSelectoare() {
    let selectTara = document.getElementById('selectTara');
    let selectAn = document.getElementById('selectAn');

    //populare selector de tara
    tarileCod.forEach(function (cod) {
        let optiune = document.createElement('option');
        optiune.value = cod;
        optiune.textContent = tariNume[cod] + ' (' + cod + ')';
        selectTara.appendChild(optiune);
    });

    // valoare implicita
    selectTara.value = 'RO';

    // populare selector de ani
    for (let an = 2000; an <= 2018; an++) {
        let optiune = document.createElement('option');
        optiune.value = an;
        optiune.textContent = an;
        selectAn.appendChild(optiune);
    }

    // valoare implicita
    selectAn.value = '2018';

    console.log('Selectoarele au fost populate!');
}

// parsare si transformare date
function getDateTaraIndicator(codTara, indicator) {
    // filtrare date dupa tara si indicator
    let dateFiltrate = dateEurostat.filter(function (item) {
        return item.tara === codTara && item.indicator === indicator;
    });

    // transformare in format simplu (an, valoare) si sortare dupa an
    let dateTransformate = dateFiltrate.map(function (item) {
        return {
            an: parseInt(item.an),
            valoare: item.valoare
        };
    });

    // sortare crescator dupa an 
    dateTransformate.sort(function (a, b) {
        return a.an - b.an;
    });

    return dateTransformate;
}


function getDateAnComplet(an) {
    let anString = an.toString();
    let rezultat = {};

    // initializare obiect pentru fiecare tara
    tarileCod.forEach(function (cod) {
        rezultat[cod] = {
            tara: cod,
            nume: tariNume[cod],
            PIB: null,
            SV: null,
            POP: null
        };
    });

    // parcurgere date si completare valori
    dateEurostat.forEach(function (item) {
        if (item.an === anString && rezultat[item.tara]) {
            rezultat[item.tara][item.indicator] = item.valoare;
        }
    });

    return rezultat;
}

function calculeazaMedieUE(an, indicator) {
    let anString = an.toString();
    let suma = 0;
    let count = 0;

    dateEurostat.forEach(function (item) {
        if (item.an === anString && item.indicator === indicator) {
            suma += item.valoare;
            count++;
        }
    });

    // returnare medie sau 0 daca nu exista date
    return count > 0 ? suma / count : 0;
}

// obtinere valorile minime si maxime pentru un indicator si o tara pentru scalare
function getMinMax(indicator, tara) {
    let valori;

    if (tara) {
        // scalare pe tara selectata
        valori = dateEurostat
            .filter(function (item) {
                return item.indicator === indicator && item.tara === tara;
            })
            .map(function (item) { return item.valoare; });
    } else {
        // scalare globala
        valori = dateEurostat
            .filter(function (item) { return item.indicator === indicator; })
            .map(function (item) { return item.valoare; });
    }

    return {
        min: Math.min.apply(null, valori),
        max: Math.max.apply(null, valori)
    };
}

// grafic SVG
const svgWidth = 800;
const svgHeight = 400;
const margin = { top: 40, right: 40, bottom: 60, left: 80 };
const chartWidth = svgWidth - margin.left - margin.right;
const chartHeight = svgHeight - margin.top - margin.bottom;

function deseneazaAxe(indicator, tara) {
    let svg = document.getElementById('graficSVG');

    // golire SVG inainte de redesenare
    svg.innerHTML = '';

    // obtinere min/max pentru indicatorul si tara selectata
    let limite = getMinMax(indicator, tara);

    // creare grup pentru axe (pentru organizare)
    let grupaAxe = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grupaAxe.setAttribute('class', 'axe');

    // axa Y (verticala - valori)
    let axaY = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axaY.setAttribute('x1', margin.left);
    axaY.setAttribute('y1', margin.top);
    axaY.setAttribute('x2', margin.left);
    axaY.setAttribute('y2', svgHeight - margin.bottom);
    axaY.setAttribute('stroke', '#333');
    axaY.setAttribute('stroke-width', '2');
    grupaAxe.appendChild(axaY);

    // axa X (orizontala - ani)
    let axaX = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axaX.setAttribute('x1', margin.left);
    axaX.setAttribute('y1', svgHeight - margin.bottom);
    axaX.setAttribute('x2', svgWidth - margin.right);
    axaX.setAttribute('y2', svgHeight - margin.bottom);
    axaX.setAttribute('stroke', '#333');
    axaX.setAttribute('stroke-width', '2');
    grupaAxe.appendChild(axaX);

    // etichete axa X (anii)
    let nrAni = ani.length;
    let pasX = chartWidth / (nrAni - 1);

    ani.forEach(function (an, index) {
        let x = margin.left + index * pasX;
        let y = svgHeight - margin.bottom + 20;

        let eticheta = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        eticheta.setAttribute('x', x);
        eticheta.setAttribute('y', y);
        eticheta.setAttribute('text-anchor', 'middle');
        eticheta.setAttribute('font-size', '10');
        eticheta.setAttribute('fill', '#666');
        eticheta.textContent = an;
        grupaAxe.appendChild(eticheta);
    });

    // etichete axa Y (valorile)
    let nrDiviziuni = 5;
    let pasValoare = (limite.max - limite.min) / nrDiviziuni;
    let pasY = chartHeight / nrDiviziuni;

    for (let i = 0; i <= nrDiviziuni; i++) {
        let valoare = limite.min + i * pasValoare;
        let y = svgHeight - margin.bottom - i * pasY;
        let x = margin.left - 10;

        // eticheta valoare
        let eticheta = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        eticheta.setAttribute('x', x);
        eticheta.setAttribute('y', y + 4);
        eticheta.setAttribute('text-anchor', 'end');
        eticheta.setAttribute('font-size', '11');
        eticheta.setAttribute('fill', '#666');
        eticheta.textContent = Math.round(valoare).toLocaleString();
        grupaAxe.appendChild(eticheta);

        // linie orizontala 
        if (i > 0) {
            let linieGrida = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            linieGrida.setAttribute('x1', margin.left);
            linieGrida.setAttribute('y1', y);
            linieGrida.setAttribute('x2', svgWidth - margin.right);
            linieGrida.setAttribute('y2', y);
            linieGrida.setAttribute('stroke', '#eee');
            linieGrida.setAttribute('stroke-width', '1');
            grupaAxe.appendChild(linieGrida);
        }
    }

    // adaugare grup de axe la SVG
    svg.appendChild(grupaAxe);

    console.log('Axe desenate pentru indicatorul:', indicator);

    // returnare limitele pentru a fi folosite la desenarea liniei
    return limite;
}

// functii de scalare
function scaleazaX(an) {
    let index = an - 2000;
    let pasX = chartWidth / (ani.length - 1);
    return margin.left + index * pasX;
}

function scaleazaY(valoare, minVal, maxVal) {
    let procent = (valoare - minVal) / (maxVal - minVal);

    //inversare pentru ca y e sus
    return svgHeight - margin.bottom - procent * chartHeight;
}

//desenare grafic
function deseneazaGrafic() {

    let tara = document.getElementById('selectTara').value;
    let indicator = document.getElementById('selectIndicator').value;

    let limite = deseneazaAxe(indicator, tara);

    let date = getDateTaraIndicator(tara, indicator);

    if (date.length === 0) {
        console.log('Nu exista date pentru', tara, indicator);
        return;
    }

    let svg = document.getElementById('graficSVG');

    let grupaLinie = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grupaLinie.setAttribute('class', 'linie-grafic');

    // construirea path-ului
    let pathData = '';
    date.forEach(function (punct, index) {
        let x = scaleazaX(punct.an);
        let y = scaleazaY(punct.valoare, limite.min, limite.max);

        if (index === 0) {
            pathData += 'M ' + x + ' ' + y;  // move to primul punct
        } else {
            pathData += ' L ' + x + ' ' + y;  // line to urmatorul punct
        }
    });

    // creare element path
    let linie = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    linie.setAttribute('d', pathData);
    linie.setAttribute('fill', 'none');
    linie.setAttribute('stroke', '#3498db');
    linie.setAttribute('stroke-width', '3');
    grupaLinie.appendChild(linie);

    // adaugare puncte pe grafic
    date.forEach(function (punct) {
        let x = scaleazaX(punct.an);
        let y = scaleazaY(punct.valoare, limite.min, limite.max);

        let cerc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        cerc.setAttribute('cx', x);
        cerc.setAttribute('cy', y);
        cerc.setAttribute('r', '5');
        cerc.setAttribute('fill', '#2980b9');
        grupaLinie.appendChild(cerc);
    });

    svg.appendChild(grupaLinie);

    // creare tooltip
    creeazaTooltip(svg);

    console.log('Grafic desenat pentru', tara, indicator);
}

//tooltip
let tooltipGrup = null;

//creare react + text
function creeazaTooltip(svg) {

    tooltipGrup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tooltipGrup.setAttribute('class', 'tooltip');
    tooltipGrup.setAttribute('visibility', 'hidden');

    // fundal tooltip
    let fundal = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    fundal.setAttribute('fill', '#333');
    fundal.setAttribute('rx', '5');
    fundal.setAttribute('ry', '5');
    fundal.setAttribute('width', '120');
    fundal.setAttribute('height', '50');
    tooltipGrup.appendChild(fundal);

    // text an
    let textAn = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textAn.setAttribute('class', 'tooltip-an');
    textAn.setAttribute('x', '10');
    textAn.setAttribute('y', '20');
    textAn.setAttribute('fill', 'white');
    textAn.setAttribute('font-size', '12');
    textAn.setAttribute('font-weight', 'bold');
    tooltipGrup.appendChild(textAn);

    // text valoare
    let textValoare = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textValoare.setAttribute('class', 'tooltip-valoare');
    textValoare.setAttribute('x', '10');
    textValoare.setAttribute('y', '40');
    textValoare.setAttribute('fill', '#3498db');
    textValoare.setAttribute('font-size', '14');
    textValoare.setAttribute('font-weight', 'bold');
    tooltipGrup.appendChild(textValoare);

    svg.appendChild(tooltipGrup);
}

//gasirea anului cel mai apropiat fata de pozitia mouse-ului
function gasesteAnApropiat(mouseX) {
    let pasX = chartWidth / (ani.length - 1);
    let indexFloat = (mouseX - margin.left) / pasX;
    let index = Math.round(indexFloat);

    // limitare index la range-ul valid
    if (index < 0) index = 0;
    if (index >= ani.length) index = ani.length - 1;

    return ani[index];
}

//handler pentru mouse
function handleMouseMove(event) {
    let svg = document.getElementById('graficSVG');
    let rect = svg.getBoundingClientRect();

    // calculare pozitie mouse
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;

    // verificare daca mouse-ul e in zona graficului
    if (mouseX < margin.left || mouseX > svgWidth - margin.right ||
        mouseY < margin.top || mouseY > svgHeight - margin.bottom) {
        if (tooltipGrup) {
            tooltipGrup.setAttribute('visibility', 'hidden');
        }
        return;
    }

    // gasirea anului cel mai apropiat
    let an = gasesteAnApropiat(mouseX);

    // obtinere date
    let tara = document.getElementById('selectTara').value;
    let indicator = document.getElementById('selectIndicator').value;
    let date = getDateTaraIndicator(tara, indicator);

    // gasirea valoarii pentru anul respectiv
    let punct = date.find(function (d) { return d.an === an; });

    if (punct && tooltipGrup) {
        // calculare pozitie punct
        let limite = getMinMax(indicator, tara);
        let x = scaleazaX(punct.an);
        let y = scaleazaY(punct.valoare, limite.min, limite.max);

        // actualizare continut tooltip
        let textAn = tooltipGrup.querySelector('.tooltip-an');
        let textValoare = tooltipGrup.querySelector('.tooltip-valoare');

        textAn.textContent = 'An: ' + punct.an;
        textValoare.textContent = punct.valoare.toLocaleString();

        // pozitionare tooltip 
        let tooltipX = x + 10;
        let tooltipY = y - 55;

        // asigurare ca tooltip-ul ramane in grafic
        if (tooltipX + 120 > svgWidth) tooltipX = x - 130;
        if (tooltipY < 0) tooltipY = y + 10;

        tooltipGrup.setAttribute('transform', 'translate(' + tooltipX + ',' + tooltipY + ')');
        tooltipGrup.setAttribute('visibility', 'visible');
    }
}

//handler mouseout
function handleMouseOut() {
    if (tooltipGrup) {
        tooltipGrup.setAttribute('visibility', 'hidden');
    }
}

//event listeners pentru update dinamic
function adaugaEventListeners() {

    document.getElementById('selectTara').addEventListener('change', function () {
        deseneazaGrafic();
    });

    document.getElementById('selectIndicator').addEventListener('change', function () {
        deseneazaGrafic();
    });

    // tooltip
    let svg = document.getElementById('graficSVG');
    svg.addEventListener('mousemove', handleMouseMove);
    svg.addEventListener('mouseout', handleMouseOut);

    // schimbare an
    document.getElementById('selectAn').addEventListener('change', function () {
        let an = document.getElementById('selectAn').value;
        deseneazaBubbleChart(an);
        genereazaTabel(an);
    });

    // buton de animatie
    document.getElementById('btnAnimatie').addEventListener('click', toggleAnimatie);

    console.log('Event listeners adaugati!');
}

// bubble chart
const canvasWidth = 800;
const canvasHeight = 500;
const canvasMargin = { top: 50, right: 50, bottom: 60, left: 80 };
const bubbleChartWidth = canvasWidth - canvasMargin.left - canvasMargin.right;
const bubbleChartHeight = canvasHeight - canvasMargin.top - canvasMargin.bottom;

const culoriBubble = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b',
    '#2980b9', '#27ae60', '#d35400', '#8e44ad', '#f1c40f',
    '#00bcd4', '#ff5722', '#607d8b', '#795548', '#4caf50',
    '#673ab7', '#03a9f4', '#ff9800', '#9c27b0', '#cddc39',
    '#009688', '#ffeb3b'
];

//scalare valoare PIB => axa X
function scaleazaBubbleX(valoare, minPIB, maxPIB) {
    let procent = (valoare - minPIB) / (maxPIB - minPIB);
    return canvasMargin.left + procent * bubbleChartWidth;
}

//scalare valoare SV => axa Y
function scaleazaBubbleY(valoare, minSV, maxSV) {
    let procent = (valoare - minSV) / (maxSV - minSV);
    // Inversam pentru ca y=0 e sus
    return canvasHeight - canvasMargin.bottom - procent * bubbleChartHeight;
}

//scalare valoare POP => raza cercului
function scaleazaRaza(valoare, minPop, maxPop) {
    let procent = (valoare - minPop) / (maxPop - minPop);
    return 5 + procent * 30;
}

function deseneazaBubbleChart(an) {
    let canvas = document.getElementById('bubbleCanvas');
    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    let dateAn = getDateAnComplet(an);
    let limitePIB = getMinMax('PIB');
    let limiteSV = getMinMax('SV');
    let limitePOP = getMinMax('POP');

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(canvasMargin.left, canvasMargin.top);
    ctx.lineTo(canvasMargin.left, canvasHeight - canvasMargin.bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvasMargin.left, canvasHeight - canvasMargin.bottom);
    ctx.lineTo(canvasWidth - canvasMargin.right, canvasHeight - canvasMargin.bottom);
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PIB pe cap de locuitor (EUR)', canvasWidth / 2, canvasHeight - 15);

    ctx.save();
    ctx.translate(20, canvasHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Speranța de Viață (ani)', 0, 0);
    ctx.restore();

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'center';
    ctx.fillText('Anul: ' + an, canvasWidth / 2, 25);

    let index = 0;
    tarileCod.forEach(function (cod) {
        let dataTara = dateAn[cod];
        if (dataTara.PIB && dataTara.SV && dataTara.POP) {
            let x = scaleazaBubbleX(dataTara.PIB, limitePIB.min, limitePIB.max);
            let y = scaleazaBubbleY(dataTara.SV, limiteSV.min, limiteSV.max);
            let raza = scaleazaRaza(dataTara.POP, limitePOP.min, limitePOP.max);

            ctx.beginPath();
            ctx.arc(x, y, raza, 0, 2 * Math.PI);
            ctx.fillStyle = culoriBubble[index % culoriBubble.length];
            ctx.globalAlpha = 0.7;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();

            if (raza > 10) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(cod, x, y);
            }
        }
        index++;
    });

    console.log('Bubble chart desenat pentru anul', an);
}

//animatie bubble chart
let animatieActiva = false;
let animatieIndex = 0;
let ultimulFrame = 0;
const INTERVAL_ANIMATIE = 800;

function toggleAnimatie() {
    let btn = document.getElementById('btnAnimatie');

    if (animatieActiva) {
        animatieActiva = false;
        btn.textContent = '▶ Start Animație';
        btn.style.backgroundColor = '#27ae60';
    } else {
        animatieActiva = true;
        animatieIndex = 0;
        btn.textContent = '⏹ Stop Animație';
        btn.style.backgroundColor = '#e74c3c';

        //incepere bucla de animatie
        ultimulFrame = performance.now();
        requestAnimationFrame(pasAnimatie);
    }
}

function pasAnimatie(timestamp) {
    // verificare animatie activa
    if (!animatieActiva) return;
    let timpTrecut = timestamp - ultimulFrame;

    if (timpTrecut >= INTERVAL_ANIMATIE) {
        // actualizare anul
        let anCurent = ani[animatieIndex];

        deseneazaBubbleChart(anCurent);

        document.getElementById('selectAn').value = anCurent;

        genereazaTabel(anCurent);

        //trecere la urmatorul an
        animatieIndex++;

        if (animatieIndex >= ani.length) {
            animatieIndex = 0;
        }

        ultimulFrame = timestamp;
    }

    // continuare animatie
    requestAnimationFrame(pasAnimatie);
}

//tabel
function calculeazaCuloare(valoare, medie, min, max) {
    if (valoare === null || valoare === undefined) {
        return '#ccc';
    }

    let culoare;

    if (valoare < medie) {

        let distanta = (medie - valoare) / (medie - min);
        distanta = Math.min(1, Math.max(0, distanta));

        //sub medie nuante de rosu
        let r = Math.round(255 - distanta * 63);
        let g = Math.round(204 - distanta * 147);
        let b = Math.round(204 - distanta * 161);
        culoare = 'rgb(' + r + ',' + g + ',' + b + ')';
    } else {
        // peste medie nuante de verde
        let distanta = (valoare - medie) / (max - medie);
        distanta = Math.min(1, Math.max(0, distanta));

        let r = Math.round(204 - distanta * 165);
        let g = Math.round(255 - distanta * 81);
        let b = Math.round(204 - distanta * 108);
        culoare = 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    return culoare;
}

function genereazaTabel(an) {
    let tbody = document.querySelector('#tabelDate tbody');
    let spanAn = document.getElementById('anSelectatTabel');

    spanAn.textContent = an;

    tbody.innerHTML = '';

    let dateAn = getDateAnComplet(an);

    let mediePIB = calculeazaMedieUE(an, 'PIB');
    let medieSV = calculeazaMedieUE(an, 'SV');
    let mediePOP = calculeazaMedieUE(an, 'POP');

    let limitePIB = getMinMax('PIB');
    let limiteSV = getMinMax('SV');
    let limitePOP = getMinMax('POP');

    //generare randuri pentru fiecare tara
    tarileCod.forEach(function (cod) {
        let dataTara = dateAn[cod];

        let tr = document.createElement('tr');

        let tdTara = document.createElement('td');
        tdTara.textContent = tariNume[cod] + ' (' + cod + ')';

        tr.appendChild(tdTara);
        let tdPIB = document.createElement('td');
        if (dataTara.PIB) {
            tdPIB.textContent = dataTara.PIB.toLocaleString() + ' €';
            tdPIB.style.backgroundColor = calculeazaCuloare(dataTara.PIB, mediePIB, limitePIB.min, limitePIB.max);
        } else {
            tdPIB.textContent = '-';
            tdPIB.style.backgroundColor = '#ccc';
        }
        tr.appendChild(tdPIB);

        // coloana SV
        let tdSV = document.createElement('td');
        if (dataTara.SV) {
            tdSV.textContent = dataTara.SV.toFixed(1) + ' ani';
            tdSV.style.backgroundColor = calculeazaCuloare(dataTara.SV, medieSV, limiteSV.min, limiteSV.max);
        } else {
            tdSV.textContent = '-';
            tdSV.style.backgroundColor = '#ccc';
        }
        tr.appendChild(tdSV);

        // coloana POP
        let tdPOP = document.createElement('td');
        if (dataTara.POP) {
            tdPOP.textContent = dataTara.POP.toLocaleString();
            tdPOP.style.backgroundColor = calculeazaCuloare(dataTara.POP, mediePOP, limitePOP.min, limitePOP.max);
        } else {
            tdPOP.textContent = '-';
            tdPOP.style.backgroundColor = '#ccc';
        }
        tr.appendChild(tdPOP);

        tbody.appendChild(tr);
    });

    console.log('Tabel generat pentru anul', an);
}


document.addEventListener('DOMContentLoaded', function () {
    console.log('Pagina incarcata. Incep incarcarea datelor...');
    incarcaDate();
});
