// Configuration initiale
const config = {
    name: "Mon Trésor",
    specialDate: "15 septembre 2023",
    specialMessage: "Le jour où nos vies se sont entrelacées pour toujours",
    loveQuote: "Je t'aimerai jusqu'à ce que les étoiles s'éteignent et au-delà..."
};

// DOM Elements
const nameDisplay = document.getElementById('nameDisplay');
const currentDate = document.getElementById('currentDate');
const starCanvas = document.getElementById('starCanvas');
const heartButton = document.getElementById('heartButton');
const hiddenMessage = document.getElementById('hiddenMessage');
const starsContainer = document.getElementById('stars');
const heartsContainer = document.getElementById('hearts');

// Set personalized content
document.addEventListener('DOMContentLoaded', () => {
    // Set name
    nameDisplay.textContent = config.name;
    
    // Set current date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDate.textContent = now.toLocaleDateString('fr-FR', options);
    
    // Initialize star background
    createStars();
    
    // Initialize floating hearts
    createHearts();
    
    // Initialize canvas
    initCanvas();
});

// Create star background
function createStars() {
    const starsCount = 200;
    
    for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        
        // Random size
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Random animation duration
        const duration = Math.random() * 5 + 3;
        star.style.setProperty('--duration', `${duration}s`);
        
        starsContainer.appendChild(star);
    }
}

// Create floating hearts
function createHearts() {
    const heartsCount = 15;
    
    for (let i = 0; i < heartsCount; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.innerHTML = '<i class="fas fa-heart"></i>';
        
        // Random position
        const x = Math.random() * 100;
        heart.style.left = `${x}%`;
        
        // Random delay
        const delay = Math.random() * 15;
        heart.style.animationDelay = `${delay}s`;
        
        heartsContainer.appendChild(heart);
    }
}

// Canvas initialization
function initCanvas() {
    const canvas = starCanvas;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Stars array
    const stars = [];
    const constellations = [];
    
    // Resize handling
    window.addEventListener('resize', () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    });
    
    // Keyboard interaction
    document.addEventListener('keydown', (e) => {
        createFallingStar(ctx, canvas, e.key);
    });
    
    // Mouse interaction
    canvas.addEventListener('click', (e) => {
        createConstellation(e, ctx, canvas);
    });
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw stars
        drawStars(ctx, stars);
        
        // Draw constellations
        drawConstellations(ctx, constellations);
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// Create a falling star
function createFallingStar(ctx, canvas, char) {
    const x = Math.random() * canvas.width;
    const y = 0;
    const size = Math.random() * 24 + 16;
    const speed = Math.random() * 5 + 3;
    const color = getRandomColor();
    
    const star = {
        x, y, size, speed, char, color,
        alpha: 1,
        trail: []
    };
    
    // Animation
    function animateStar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update position
        star.y += star.speed;
        star.alpha -= 0.01;
        
        // Add to trail
        star.trail.push({x: star.x, y: star.y, size: star.size * 0.7});
        if (star.trail.length > 10) star.trail.shift();
        
        // Draw trail
        for (let i = 0; i < star.trail.length; i++) {
            const point = star.trail[i];
            const trailAlpha = star.alpha * (i / star.trail.length);
            
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${hexToRgb(star.color)}, ${trailAlpha})`;
            ctx.fill();
        }
        
        // Draw star
        ctx.font = `${star.size}px Arial`;
        ctx.fillStyle = `rgba(${hexToRgb(star.color)}, ${star.alpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(star.char, star.x, star.y);
        
        // Continue animation
        if (star.y < canvas.height && star.alpha > 0) {
            requestAnimationFrame(animateStar);
        }
    }
    
    animateStar();
}

// Create constellation
function createConstellation(e, ctx, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create a new constellation point
    const point = { x, y, size: Math.random() * 6 + 4 };
    
    // If there are previous points, connect them
    if (constellations.length > 0) {
        const lastPoint = constellations[constellations.length - 1];
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // Add point to constellations
    constellations.push(point);
    
    // Draw the point
    ctx.beginPath();
    ctx.arc(x, y, point.size, 0, Math.PI * 2);
    ctx.fillStyle = '#ffcc00';
    ctx.fill();
}

// Draw stars
function drawStars(ctx, stars) {
    for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();
    }
}

// Draw constellations
function drawConstellations(ctx, constellations) {
    if (constellations.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(constellations[0].x, constellations[0].y);
    
    for (let i = 1; i < constellations.length; i++) {
        ctx.lineTo(constellations[i].x, constellations[i].y);
    }
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw points
    for (const point of constellations) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcc00';
        ctx.fill();
    }
}

// Heart button interaction
heartButton.addEventListener('click', () => {
    // Animate button
    heartButton.style.animation = 'pulse 1s';
    
    // Remove animation after it completes
    setTimeout(() => {
        heartButton.style.animation = '';
    }, 1000);
    
    // Create floating hearts effect
    createExplodingHearts();
    
    // Show special message
    setTimeout(() => {
        hiddenMessage.textContent = config.loveQuote;
        hiddenMessage.classList.add('show');
        
        // Create additional floating hearts
        createExtraHearts();
    }, 1000);
});

// Create exploding hearts effect
function createExplodingHearts() {
    const buttonRect = heartButton.getBoundingClientRect();
    const centerX = buttonRect.left + buttonRect.width / 2;
    const centerY = buttonRect.top + buttonRect.height / 2;
    
    for (let i = 0; i < 20; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.innerHTML = '<i class="fas fa-heart"></i>';
        heart.style.position = 'fixed';
        heart.style.left = `${centerX}px`;
        heart.style.top = `${centerY}px`;
        heart.style.color = i % 2 === 0 ? '#ff7eb3' : '#ffcc00';
        heart.style.fontSize = `${Math.random() * 2 + 1}rem`;
        heart.style.animation = `floatHeart ${Math.random() * 2 + 1}s linear forwards`;
        
        document.body.appendChild(heart);
        
        // Remove heart after animation
        setTimeout(() => {
            heart.remove();
        }, 1000);
    }
}

// Create extra floating hearts
function createExtraHearts() {
    for (let i = 0; i < 10; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.innerHTML = '<i class="fas fa-heart"></i>';
        heart.style.color = i % 2 === 0 ? '#ff7eb3' : '#ffcc00';
        heart.style.fontSize = `${Math.random() * 2 + 1.5}rem`;
        heart.style.animationDelay = `${i * 0.2}s`;
        
        heartsContainer.appendChild(heart);
    }
}

// Helper functions
function getRandomColor() {
    const colors = ['#ff7eb3', '#ff758c', '#ffcc00', '#a18cd1', '#fbc2eb', '#8ed1fc'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
         }
