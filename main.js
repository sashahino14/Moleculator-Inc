// main.js - Module principal alliant calcul, rendu 2D/3D, quiz, tutoriel

// ----------------- Module model/molecule.js -----------------
// Gestion avancée des formules chimiques (parsing, calcul masse)

class Molecule {
  constructor(formula) {
    this.formula = formula;
    this.atoms = this.parseFormula(formula);
  }

  // Parsing avancé avec prise en compte parenthèses, indices, charges simples
  // Exemple: Fe(NO3)3, Al2(SO4)3
  parseFormula(formula) {
    try {
      // Supprime espaces inutiles et majuscules/minuscules correctes
      formula = formula.replace(/\s+/g, '');
      // Fonction récursive pour parser la formule (parenthèses imbriquées)
      const parseGroup = (str) => {
        const atoms = {};
        let i = 0;
        
        while (i < str.length) {
          if (str[i] === '(') {
            // Trouver la position de fermeture ')'
            let depth = 1;
            let j = i + 1;
            while (j < str.length && depth > 0) {
              if (str[j] === '(') depth++;
              else if (str[j] === ')') depth--;
              j++;
            }
            if (depth !== 0) throw new Error("Parenthèse non fermée");
            
            const groupFormula = str.slice(i + 1, j -1);
            let countMatch = str.slice(j).match(/^(\d+)/);
            let count = countMatch ? parseInt(countMatch[1]) : 1;
            let nextIndex = j + (countMatch ? countMatch[1].length : 0);
            
            const groupAtoms = parseGroup(groupFormula);
            // Ajouter groupe avec multiplication
            for (const [el, c] of Object.entries(groupAtoms)) {
              atoms[el] = (atoms[el] || 0) + c * count;
            }
            
            i = nextIndex;
          } else {
            // Parser élément individuel
            let elementMatch = str.slice(i).match(/^([A-Z][a-z]?)/);
            if (!elementMatch) throw new Error("Élément chimique invalide");
            const el = elementMatch[1];
            i += el.length;
            let countMatch = str.slice(i).match(/^(\d+)/);
            let count = countMatch ? parseInt(countMatch[1]) : 1;
            i += countMatch ? countMatch[1].length : 0;
            atoms[el] = (atoms[el] || 0) + count;
          }
        }
        return atoms;
      };
      
      const atoms = parseGroup(formula);
      if (Object.keys(atoms).length === 0) throw new Error("Formule vide");
      return atoms;
    } catch (err) {
      throw new Error(`Erreur parsing formule: ${err.message}`);
    }
  }

  // Table des masses atomiques étendue (valeurs standards, u)
  // Source : IUPAC standard atomic weights (simplifié)
  static atomicMasses = {
    H: 1.00784, He: 4.002602, Li: 6.938, Be: 9.0121831, B: 10.806,
    C: 12.0096, N: 14.00643, O: 15.99903, F: 18.9984032, Ne: 20.1797,
    Na: 22.989769, Mg: 24.304, Al: 26.9815385, Si: 28.084, P: 30.973761998,
    S: 32.059, Cl: 35.446, Ar: 39.948, K: 39.0983, Ca: 40.078,
    Fe: 55.845, Cu: 63.546, Zn: 65.38, Ag: 107.8682, Au: 196.96657,
    // Ajouter plus si besoin
  };

  getAtomicMass(element) {
    return Molecule.atomicMasses[element] || 0;
  }

  getMolecularMass() {
    let mass = 0;
    for (const el in this.atoms) {
      mass += this.getAtomicMass(el) * this.atoms[el];
    }
    return mass.toFixed(5);
  }
}

// ----------------- Module view/svgRenderer.js -----------------
// Rendu moléculaire SVG 2D simple (texte + cercles)

function renderMoleculeSVG(atoms, svgElement) {
  svgElement.innerHTML = ''; // Reset
  
  const ns = "http://www.w3.org/2000/svg";
  // Variables pour positionnement simple
  let x = 20, y = 150;
  
  // Calculer nombre d’atomes pour espacement
  const entries = Object.entries(atoms);
  const stepX = 60;
  
  entries.forEach(([el, count], idx) => {
    // Cercle représentant l'atome
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', x + idx * stepX);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', 20);
    circle.setAttribute('fill', '#007bff');
    circle.setAttribute('opacity', 0.7);
    svgElement.appendChild(circle);
    
    // Texte pour symbole élément
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', x + idx * stepX);
    text.setAttribute('y', y + 8);
    text.setAttribute('font-size', '22');
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('user-select', 'none');
    text.textContent = el;
    svgElement.appendChild(text);
    
    // Texte pour nombre d'atomes (indice)
    if (count > 1) {
      const number = document.createElementNS(ns, 'text');
      number.setAttribute('x', x + idx * stepX + 15);
      number.setAttribute('y', y + 25);
      number.setAttribute('font-size', '16');
      number.setAttribute('fill', '#007bff');
      number.setAttribute('font-weight', 'bold');
      number.textContent = count;
      svgElement.appendChild(number);
    }
  });
}

// ----------------- Module view/threeRenderer.js -----------------
// Visualisation moléculaire 3D simple avec Three.js

class Molecule3D {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.width/this.height, 0.1, 1000);
    this.camera.position.set(0, 0, 100);

    this.renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    this.atomColors = {
      H: 0xffffff, C: 0x444444, O: 0xff0000, N: 0x0000ff,
      S: 0xffff00, Fe: 0xffa500, // etc.
    };

    this.atomsMeshes = [];
    this.animate = this.animate.bind(this);
    this.animate();
  }

  clearScene() {
    for(let mesh of this.atomsMeshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.atomsMeshes = [];
  }

  addAtom(element, position) {
    const radius = (element === 'H') ? 1 : 2;
    const color = this.atomColors[element] || 0x888888;

    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshPhongMaterial({color});
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    this.scene.add(sphere);
    this.atomsMeshes.push(sphere);
  }

  buildMolecule(atoms) {
    this.clearScene();

    // Positionner les atomes en cercle simple pour démo
    const entries = Object.entries(atoms);
    const N = entries.length;
    const radius = 15;
    entries.forEach(([el, count], i) => {
      // Placer un atome approx. par élément (ignorer counts multiples pour simplicité ici)
      let angle = (2 * Math.PI / N) * i;
      let x = radius * Math.cos(angle);
      let y = radius * Math.sin(angle);
      let z = 0;

      this.addAtom(el, new THREE.Vector3(x,y,z));
    });

    // Lumières
    const light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(20,20,20);
    this.scene.add(light1);
    const ambient = new THREE.AmbientLight(0x404040);
    this.scene.add(ambient);
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// ----------------- Module controller/appController.js -----------------

// Sélection DOM
const formulaInput = document.getElementById('formula-input');
const calcBtn = document.getElementById('calc-mass-btn');
const massResult = document.getElementById('mass-result');
const molSVG = document.getElementById('mol-svg');

const quizQ = document.getElementById('quiz-question');
const quizA = document.getElementById('quiz-answer');
const quizBtn = document.getElementById('submit-quiz-answer');
const quizFdbk = document.getElementById('quiz-feedback');

const mol3dContainer = document.getElementById('mol-3d-container');
const molecule3d = new Molecule3D(mol3dContainer);

// Fonction calculer et afficher masse + visualisations
function calculateAndRender() {
  const formula = formulaInput.value.trim();
  if (!formula) {
    massResult.textContent = 'Veuillez entrer une formule chimique valide.';
    molSVG.innerHTML = '';
    molecule3d.clearScene();
    return;
  }
  try {
    const molecule = new Molecule(formula);
    const mass = molecule.getMolecularMass();
    massResult.textContent = `Masse moléculaire : ${mass} u`;

    renderMoleculeSVG(molecule.atoms, molSVG);
    molecule3d.buildMolecule(molecule.atoms);
  } catch (e) {
    massResult.textContent = `Erreur: ${e.message}`;
    molSVG.innerHTML = '';
    molecule3d.clearScene();
  }
}

calcBtn.addEventListener('click', calculateAndRender);

// ----------------- Module quiz -----------------

const quizData = [
  {question:"Quelle est la masse atomique approximative de C ?", answer:"12.0096"},
  {question:"Combien d'atomes d'oxygène dans H2O ?", answer:"1"},
  {question:"Quelle est la formule chimique du sulfate d’aluminium ?", answer:"Al2(SO4)3"},
  {question:"Combien d’atomes de fer y a-t-il dans Fe(NO3)3 ?", answer:"1"},
  {question:"Quelle est la masse moléculaire approximative de H2O ?", answer:"18.01528"},
];

let currentQ = 0;

function loadQuiz() {
  const q = quizData[currentQ];
  quizQ.textContent = q.question;
  quizA.value = '';
  quizFdbk.textContent = '';
  quizA.focus();
}

quizBtn.addEventListener('click', () => {
  const q = quizData[currentQ];
  const response = quizA.value.trim();
  if (!response) {
    quizFdbk.textContent = 'Veuillez entrer une réponse.';
    return;
  }
  if (response.toLowerCase() === q.answer.toLowerCase()) {
    quizFdbk.textContent = 'Correct ! 🎉';
    quizFdbk.style.color = 'green';
  } else {
    quizFdbk.textContent = `Faux, réponse correcte : ${q.answer}`;
    quizFdbk.style.color = 'red';
  }
  currentQ = (currentQ + 1) % quizData.length;
  setTimeout(loadQuiz, 3000);
});

loadQuiz();

// ----------------- Thème sombre toggle -----------------

const themeToggle = document.createElement('div');
themeToggle.textContent = '🌙 Mode sombre';
themeToggle.className = 'theme-toggle';
document.body.appendChild(themeToggle);

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  if (document.body.classList.contains('dark-theme')) {
    themeToggle.textContent = '☀️ Mode clair';
  } else {
    themeToggle.textContent = '🌙 Mode sombre';
  }
});
        
