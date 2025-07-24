// IIFE pour ne pas polluer le scope global
(() => {
  // --- Données atomiques utiles ---
  const atomicMasses = {
    H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81, C: 12.011,
    N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
    Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.086, P: 30.974, S: 32.06,
    Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078,
    // Tu peux étendre cette liste
  };

  const validElements = Object.keys(atomicMasses);

  // --- Sélections DOM ---
  const formulaInput = document.getElementById('formula-input');
  const errorDiv = document.getElementById('formula-error');
  const calcBtn = document.getElementById('calc-mass-btn');
  const massResult = document.getElementById('mass-result');
  const moleculeSvg = document.getElementById('molecule-svg');
  const container = document.getElementById('molecule-visualization');
  const exportPdfBtn = document.getElementById('export-pdf');

  // Tooltip élément
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  container.appendChild(tooltip);

  // --- Parsing de formule chimique ---
  function parseFormula(formula) {
    /*
      Parse la formule chimique simple (ex: C6H12O6)
      Retourne un tableau d'atomes {symbol, count}
    */
    const regex = /([A-Z][a-z]?)(\d*)/g;
    let atoms = [];
    let match;
    while((match = regex.exec(formula)) !== null){
      const symbol = match[1];
      const count = Number(match[2]) || 1;
      atoms.push({symbol, count});
    }
    return atoms;
  }

  // --- Validation formule chimique ---
  function validateFormula(formula) {
    if(!formula.trim()) return {valid:false, message:'La formule ne peut pas être vide.'};

    const regex = /([A-Z][a-z]?)(\d*)/g;
    let pos = 0;
    let match;
    while((match = regex.exec(formula)) !== null){
      if(match.index !== pos){
        return {valid:false, message:`Erreur à la position ${pos + 1}. Élément incorrect ou syntaxe invalide.`};
      }
      const elem = match[1];
      if(!validElements.includes(elem)){
        return {valid:false, message:`Élément "${elem}" non reconnu.`};
      }
      const countStr = match[2];
      if(countStr && !/^\d+$/.test(countStr)){
        return {valid:false, message:`Nombre d'atomes incorrect pour "${elem}".`};
      }
      if(parseInt(countStr) === 0){
        return {valid:false, message:`Le nombre d'atomes pour "${elem}" doit être supérieur à zéro.`};
      }
      pos = regex.lastIndex;
    }
    if(pos !== formula.length){
      return {valid:false, message:`Erreur syntaxique à la position ${pos + 1}.`};
    }
    return {valid:true};
  }

  // --- Dessine la molécule ---
  let scale = 1;
  function clearSvg() {
    while(moleculeSvg.firstChild) moleculeSvg.removeChild(moleculeSvg.firstChild);
  }

  function drawMolecule(formula) {
    clearSvg();
    const atoms = parseFormula(formula);

    const svgWidth = moleculeSvg.clientWidth || 300;
    const svgHeight = moleculeSvg.clientHeight || 150;

    // Positionnement simple linéaire horizontal
    let cx = 30;
    const cy = svgHeight / 2;

    atoms.forEach(({symbol, count}) => {
      for(let i=0; i<count; i++){
        // Cercle
        const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', 18);
        circle.setAttribute('fill', '#4a90e2');
        circle.setAttribute('tabindex', '0');
        circle.setAttribute('role', 'img');
        circle.setAttribute('aria-label', `Atome ${symbol}, masse atomique ${atomicMasses[symbol] ?? 'inconnue'}`);

        moleculeSvg.appendChild(circle);

        // Texte
        const text = document.createElementNS('http://www.w3.org/2000/svg','text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy + 6);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '16');
        text.setAttribute('fill', 'white');
        text.textContent = symbol;
        moleculeSvg.appendChild(text);

        // Tooltip events
        circle.addEventListener('mouseenter', e => showTooltip(e, symbol));
        circle.addEventListener('mousemove', positionTooltip);
        circle.addEventListener('mouseleave', hideTooltip);
        circle.addEventListener('focus', e => showTooltip(e, symbol));
        circle.addEventListener('blur', hideTooltip);

        cx += 45;
      }
    });
    moleculeSvg.style.transformOrigin = 'center center';
    moleculeSvg.style.transform = `scale(${scale})`;
  }

  function showTooltip(event, symbol) {
    tooltip.textContent = `Atome : ${symbol}, Masse atomique : ${atomicMasses[symbol] ?? 'Inconnue'}`;
    tooltip.style.opacity = '1';
    positionTooltip(event);
  }

  function positionTooltip(event) {
    const rect = container.getBoundingClientRect();
    const left = Math.min(event.clientX - rect.left + 15, rect.width - tooltip.offsetWidth - 5);
    const top = Math.min(event.clientY - rect.top + 15, rect.height - tooltip.offsetHeight - 5);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.style.opacity = '0';
  }

  // Zoom molette
  container.addEventListener('wheel', e => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    scale = Math.min(Math.max(0.5, scale * zoomFactor), 4);
    moleculeSvg.style.transform = `scale(${scale})`;
  });

  // --- Calcul masse molaire ---
  function calculateMolarMass(formula) {
    const atoms = parseFormula(formula);
    let sum = 0;
    atoms.forEach(({symbol, count}) => {
      const mass = atomicMasses[symbol];
      if (mass) sum += mass * count;
    });
    return sum;
  }

  // --- Stockage Local ---
  function saveCalculation(formula, result) {
    const history = JSON.parse(localStorage.getItem('molec_history') || '[]');
    history.unshift({formula, result, date: new Date().toLocaleString()});
    if(history.length > 10) history.pop(); // Limite à 10 entrées
    localStorage.setItem('molec_history', JSON.stringify(history));
  }

  function loadHistory() {
    const history = JSON.parse(localStorage.getItem('molec_history') || '[]');
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    if(history.length === 0) {
      list.textContent = 'Aucun calcul récent.';
      return;
    }
    history.forEach(entry => {
      const li = document.createElement('li');
      li.textContent = `${entry.date} : ${entry.formula} → ${entry.result.toFixed(3)} g/mol`;
      list.appendChild(li);
    });
  }

  // --- Export PDF ---
  async function exportPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const formula = formulaInput.value.trim() || 'N/A';
    const mass = calculateMolarMass(formula).toFixed(3);

    doc.setFontSize(18);
    doc.text('Moleculator Inc - Résultat de calcul moléculaire', 15, 20);

    doc.setFontSize(14);
    doc.text(`Formule chimique : ${formula}`, 15, 40);
    doc.text(`Masse moléculaire calculée : ${mass} g/mol`, 15, 52);

    doc.text('Détails du calcul :', 15, 68);

    // Détail calcul atomes
    const atoms = parseFormula(formula);
    let y = 78;
    atoms.forEach(({symbol, count}) => {
      const m = atomicMasses[symbol]?.toFixed(3) || '?';
      doc.text(`- ${symbol} x${count} = ${m} g/mol`, 20, y);
      y += 10;
    });

    // Exporter SVG comme image PNG dans PDF
    const svgData = new XMLSerializer().serializeToString(moleculeSvg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const scaleFactor = 180 / image.width;
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);

      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 15, y + 5, 180, image.height * scaleFactor);
      doc.save('moleculator-result.pdf');
    };
    image.onerror = () => {
      doc.save('moleculator-result.pdf');
    };
    image.src = url;
  }

  // --- VALIDATION EN TEMPS RÉEL ---
  formulaInput.addEventListener('input', () => {
    const val = formulaInput.value.trim();
    if(val === '') {
      errorDiv.textContent = '';
      massResult.textContent = '';
      clearSvg();
      return;
    }
    const validation = validateFormula(val);
    if(!validation.valid) {
      errorDiv.textContent = validation.message;
      massResult.textContent = '';
      clearSvg();
    } else {
      errorDiv.textContent = '';
      drawMolecule(val);
    }
  });

  // --- BOUTON CALCUL MASSE ---
  calcBtn.addEventListener('click', () => {
    const formula = formulaInput.value.trim();
    const validation = validateFormula(formula);
    if(!validation.valid) {
      errorDiv.textContent = validation.message;
      massResult.textContent = '';
      clearSvg();
      return;
    }
    errorDiv.textContent = '';
    const mass = calculateMolarMass(formula);
    massResult.textContent = `Masse moléculaire : ${mass.toFixed(3)} g/mol`;
    drawMolecule(formula);

    saveCalculation(formula, mass);
    loadHistory();
  });

  // --- BOUTON EXPORT PDF ---
  exportPdfBtn.addEventListener('click', () => {
    const formula = formulaInput.value.trim();
    if(!validateFormula(formula).valid) {
      alert('Veuillez entrer une formule chimique valide avant d’exporter.');
      return;
    }
    exportPdf();
  });

  // --- MODE QUIZ PEDAGOGIQUE ---
  const quizData = [
    {formula: 'H2O', explanation: 'H x2 = 2.016 + O x1 = 15.999 = 18.015 g/mol', answer: 18.015},
    {formula: 'CO2', explanation: 'C x1 = 12.011 + O x2 = 31.998 = 44.009 g/mol', answer: 44.009},
    {formula: 'C6H12O6', explanation: 'C x6 = 72.066 + H x12 = 12.096 + O x6 = 95.994 = 180.156 g/mol', answer: 180.156}
  ];

  let quizCurrent = 0;
  let quizCorrect = 0;

  const quizQuestion = document.getElementById('quiz-question');
  const quizAnswer = document.getElementById('quiz-answer');
  const quizFeedback = document.getElementById('quiz-feedback');
  const quizProgress = document.getElementById('quiz-progress');
  const quizSubmit = document.getElementById('quiz-submit');
  const quizReset = document.getElementById('quiz-reset');

  function saveQuizProgress() {
    localStorage.setItem('molec_quiz', JSON.stringify({ quizCurrent, quizCorrect }));
  }

  function loadQuizProgress() {
    const data = localStorage.getItem('molec_quiz');
    if(data) {
      try {
        const obj = JSON.parse(data);
        if(typeof obj.quizCurrent === 'number') quizCurrent = obj.quizCurrent;
        if(typeof obj.quizCorrect === 'number') quizCorrect = obj.quizCorrect;
      } catch(e) {}
    }
  }

  function updateQuizUI() {
    if(quizCurrent >= quizData.length) {
      quizQuestion.textContent = `Quiz terminé ! Résultat : ${quizCorrect} bonnes réponses sur ${quizData.length}.`;
      quizAnswer.style.display = 'none';
      quizSubmit.style.display = 'none';
      quizFeedback.textContent = '';
      quizProgress.textContent = '';
      return;
    }
    const q = quizData[quizCurrent];
    quizQuestion.textContent = `Calcule la masse molaire de : ${q.formula}`;
    quizAnswer.style.display = '';
    quizSubmit.style.display = '';
    quizAnswer.value = '';
    quizAnswer.focus();
    quizFeedback.textContent = '';
    quizProgress.textContent = `Question ${quizCurrent +1} / ${quizData.length} | Correctes : ${quizCorrect}`;
  }

  function checkQuizAnswer() {
    const q = quizData[quizCurrent];
    const userVal = parseFloat(quizAnswer.value.replace(',', '.'));
    if(isNaN(userVal)) {
      quizFeedback.textContent = 'Veuillez entrer un nombre valide.';
      return;
    }
    if(Math.abs(userVal - q.answer) <= 0.05) {
      quizFeedback.textContent = `Bonne réponse ! ${q.explanation}`;
      quizCorrect++;
    } else {
      quizFeedback.textContent = `Mauvaise réponse. ${q.explanation}`;
    }
    quizCurrent++;
    saveQuizProgress();
    setTimeout(updateQuizUI, 2500);
  }

  quizSubmit.addEventListener('click', checkQuizAnswer);
  quizAnswer.addEventListener('keypress', e => {
    if(e.key === 'Enter') checkQuizAnswer();
  });

  quizReset.addEventListener('click', () => {
    quizCurrent = 0;
    quizCorrect = 0;
    saveQuizProgress();
    updateQuizUI();
  });

  // --- Initialisation ---
  loadHistory();
  loadQuizProgress();
  updateQuizUI();
})();
 
