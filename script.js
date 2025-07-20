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
    const starsCount = 300;
    
    for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        
        // Random size
        const size = Math.random() * 4 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Random animation duration
        const duration = Math.random() * 8 + 3;
        star.style.setProperty('--duration', `${duration}s`);
        
        // Random delay
        const delay = Math.random() * 5;
        star.style.animationDelay = `${delay}s`;
        
        starsContainer.appendChild(star);
    }
}

// Create floating hearts
function createHearts() {
    const heartsCount = 20;
    
    for (let i = 0; i < heartsCount; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.innerHTML = '♥';
        
        // Random position
        const x = Math.random() * 100;
        heart.style.left = `${x}%`;
        
        // Random delay
        const delay = Math.random() * 20;
        heart.style.animationDelay = `${delay}s`;
        
        // Random size
        const size = Math.random() * 1.5 + 1;
        heart.style.fontSize = `${size}rem`;
        
        // Random color
        const colors = ['#ff7eb3', '#ff758c', '#ffcc00', '#a18cd1', '#fbc2eb'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        heart.style.color = color;
        
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
        drawBackground(ctx, canvas);
    });
    
    // Keyboard interaction
    document.addEventListener('keydown', (e) => {
        createFallingStar(ctx, canvas, e.key);
    });
    
    // Mouse interaction
    canvas.addEventListener('mousemove', (e) => {
        if (e.buttons === 1) { // Only when mouse button is pressed
            createConstellation(e, ctx, canvas, constellations);
        }
    });
    
    canvas.addEventListener('click', (e) => {
        createConstellation(e, ctx, canvas, constellations);
    });
    
    // Touch interaction for mobile
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            buttons: 1
        });
        canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });
    
    // Draw initial background
    drawBackground(ctx, canvas);
    
    // Animation loop
    function animate() {
        // Clear canvas with a fading effect
        ctx.fillStyle = 'rgba(10, 5, 30, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw stars
        drawStars(ctx, stars);
        
        // Draw constellations
        drawConstellations(ctx, constellations);
        
        // Update and draw falling stars
        updateFallingStars(ctx, stars);
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// Draw background
function drawBackground(ctx, canvas) {
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a043c');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw some static stars
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 0.5;
        const opacity = Math.random() * 0.8 + 0.2;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
    }
}

// Create a falling star
function createFallingStar(ctx, canvas, char) {
    const x = Math.random() * canvas.width;
    const y = 0;
    const size = Math.random() * 30 + 20;
    const speed = Math.random() * 8 + 4;
    const color = getRandomColor();
    
    const star = {
        x, y, size, speed, char, color,
        alpha: 1,
        trail: []
    };
    
    // Animation
    function animateStar() {
        // Update position
        star.y += star.speed;
        star.alpha -= 0.01;
        
        // Add to trail
        star.trail.push({x: star.x, y: star.y, size: star.size * 0.7});
        if (star.trail.length > 15) star.trail.shift();
        
        // Continue animation
        if (star.y < canvas.height && star.alpha > 0) {
            requestAnimationFrame(animateStar);
        }
    }
    
    animateStar();
}

// Create constellation
function createConstellation(e, ctx, canvas, constellations) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create a new constellation point
    const point = { 
        x, 
        y, 
        size: Math.random() * 8 + 5,
        color: getRandomColor()
    };
    
    // Add point to constellations
    constellations.push(point);
    
    // Keep only the last 100 points
    if (constellations.length > 100) {
        constellations.shift();
    }
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
    
    // Draw connections between points
    for (let i = 1; i < constellations.length; i++) {
        const prev = constellations[i - 1];
        const current = constellations[i];
        
        // Calculate distance
        const dx = current.x - prev.x;
        const dy = current.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only draw if points are close enough
        if (distance < 200) {
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(current.x, current.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * (i/constellations.length)})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
    
    // Draw points
    for (const point of constellations) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fillStyle = point.color;
        ctx.fill();
        
        // Add glow effect
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size * 2, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, point.size * 2
        );
        gradient.addColorStop(0, `${point.color}80`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

// Update and draw falling stars
function updateFallingStars(ctx, stars) {
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        
        // Update position
        star.y += star.speed;
        star.alpha -= 0.01;
        
        // Remove if invisible
        if (star.alpha <= 0) {
            stars.splice(i, 1);
            continue;
        }
        
        // Draw trail
        for (let j = 0; j < star.trail.length; j++) {
            const point = star.trail[j];
            const trailAlpha = star.alpha * (j / star.trail.length);
            
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
    
    for (let i = 0; i < 25; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.innerHTML = '♥';
        heart.style.position = 'fixed';
        heart.style.left = `${centerX}px`;
        heart.style.top = `${centerY}px`;
        heart.style.color = i % 2 === 0 ? '#ff7eb3' : '#ffcc00';
        heart.style.fontSize = `${Math.random() * 2 + 1.5}rem`;
        heart.style.animation = `floatHeart ${Math.random() * 3 + 1}s linear forwards`;
        heart.style.zIndex = '1000';
        
        document.body.appendChild(heart);
        
        // Remove heart after animation
        setTimeout(() => {
            heart.remove();
        }, 1500);
    }
}

// Create extra floating hearts
function createExtraHearts() {
    for (let i = 0; i < 15; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.innerHTML = '♥';
        heart.style.color = i % 2 === 0 ? '#ff7eb3' : '#ffcc00';
        heart.style.fontSize = `${Math.random() * 2 + 1.5}rem`;
        heart.style.animationDelay = `${i * 0.3}s`;
        
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
