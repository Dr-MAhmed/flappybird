document.addEventListener('DOMContentLoaded', () => {
    const bird = document.getElementById('bird');
    const gameContainer = document.getElementById('game-container');
    const scoreDisplay = document.getElementById('score');
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');
    const gameOverScreen = document.getElementById('game-over');
    const restartButton = document.getElementById('restart-button');
    const finalScoreDisplay = document.getElementById('final-score');
    const ground = document.getElementById('ground');
    const wing = document.querySelector('.wing');
    const helpButton = document.getElementById('help-button');
    const helpScreen = document.getElementById('help-screen');
    const continueButton = document.getElementById('continue-button');
    const highScoreDisplay = document.getElementById('high-score-display');
    const wooshSound = new Audio('woosh.mp3')
    
    let gameStarted = false;
    let gameOver = false;
    let gamePaused = false;
    let score = 0;
    let highScore = localStorage.getItem('flappyBirdHighScore') || 0;
    let gravity = 0.5;
    let velocity = 0;
    let pipesArray = [];
    let pipeGap = 200;
    let animationId;
    let pipeInterval;
    
    // Bird position and dimensions (get actual rendered values)
    let birdY;
    let birdX;
    let birdWidth;
    let birdHeight;
    
    // Game container dimensions
    const gameHeight = gameContainer.clientHeight;
    const gameWidth = gameContainer.clientWidth;
    const groundHeight = parseInt(window.getComputedStyle(ground).getPropertyValue('height'));
    
    // Update high score display
    highScoreDisplay.innerText = `High score: ${highScore}`;
    
    function startGame() {
        resetGame();
        gameStarted = true;
        gameOver = false;
        gamePaused = false;
        startScreen.style.display = 'none';
        wooshSound.play()
        
        // Get actual bird dimensions after the game has started
        birdY = parseInt(window.getComputedStyle(bird).getPropertyValue('top'));
        birdX = parseInt(window.getComputedStyle(bird).getPropertyValue('left'));
        birdWidth = parseInt(window.getComputedStyle(bird).getPropertyValue('width'));
        birdHeight = parseInt(window.getComputedStyle(bird).getPropertyValue('height'));
        
        // Create pipes at intervals
        pipeInterval = setInterval(createPipe, 1800); // Slightly slower pipe generation
        
        // Start the game loop
        gameLoop();
        
        // Add event listeners
        document.addEventListener('keydown', flap);
        gameContainer.addEventListener('click', handleClick);
    }
    
    function resetGame() {
        // Clear existing pipes
        pipesArray.forEach(pipe => {
            pipe.topPipe.remove();
            pipe.bottomPipe.remove();
        });
        pipesArray = [];
        
        // Reset position and score
        const initialY = gameHeight / 2 - 15; // Half of bird height
        bird.style.top = initialY + 'px';
        birdY = initialY;
        velocity = 0;
        score = 0;
        scoreDisplay.innerText = score;
        
        // Hide game over screen
        gameOverScreen.style.display = 'none';
    }
    
    function gameLoop() {
        if (gameOver || gamePaused) return;
        
        // Apply gravity
        velocity += gravity;
        birdY += velocity;
        bird.style.top = birdY + 'px';
        
        // Flap wing animation
        let wingRotation = Math.sin(Date.now() / 150) * 30;
        wing.style.transform = `rotate(${wingRotation}deg)`;
        
        // Check for collisions
        if (isCollision()) {
            endGame();
            return;
        }
        
        // Move pipes
        movePipes();
        
        // Request next animation frame
        animationId = requestAnimationFrame(gameLoop);
    }
    
    function handleClick(e) {
        // Prevent flapping when clicking on buttons
        if (
            e.target === helpButton || 
            e.target === startButton || 
            e.target === restartButton || 
            e.target === continueButton
        ) {
            return;
        }
        
        if (!gameOver && gameStarted && !gamePaused) {
            flap();
        }
    }
    
    function flap(e) {
        if (e && e.type === 'keydown' && e.code !== 'Space') return;
        if (gameOver || gamePaused) return;
        
        velocity = -8;
        wooshSound.play()
    }
    
    function createPipe() {
        if (gameOver || gamePaused) return;
        
        // Create pipe elements
        const topPipe = document.createElement('div');
        const bottomPipe = document.createElement('div');
        
        topPipe.classList.add('pipe', 'top');
        bottomPipe.classList.add('pipe', 'bottom');
        
        // Set random height for top pipe (ensuring gap is reasonable)
        const minTopHeight = 50;
        const maxTopHeight = gameHeight - groundHeight - pipeGap - 100;
        const topPipeHeight = Math.floor(Math.random() * (maxTopHeight - minTopHeight)) + minTopHeight;
        const bottomPipeHeight = gameHeight - topPipeHeight - pipeGap - groundHeight;
        
        topPipe.style.height = topPipeHeight + 'px';
        bottomPipe.style.height = bottomPipeHeight + 'px';
        
        // Set initial position (off screen to the right)
        topPipe.style.left = gameWidth + 'px';
        bottomPipe.style.left = gameWidth + 'px';
        
        // Add pipes to game container
        gameContainer.appendChild(topPipe);
        gameContainer.appendChild(bottomPipe);
        
        // Add to pipes array
        pipesArray.push({
            topPipe,
            bottomPipe,
            passed: false
        });
    }
    
    function movePipes() {
        for (let i = 0; i < pipesArray.length; i++) {
            const pipe = pipesArray[i];
            
            // Get current position
            let pipeX = parseInt(window.getComputedStyle(pipe.topPipe).getPropertyValue('left'));
            
            // Move pipe to the left
            pipeX -= 2;
            pipe.topPipe.style.left = pipeX + 'px';
            pipe.bottomPipe.style.left = pipeX + 'px';
            
            // Check if bird has passed the pipe
            if (!pipe.passed && pipeX + 60 < birdX) {
                pipe.passed = true;
                score++;
                scoreDisplay.innerText = score;
            }
            
            // Remove pipe if it's off screen
            if (pipeX < -60) {
                pipesArray.splice(i, 1);
                pipe.topPipe.remove();
                pipe.bottomPipe.remove();
                i--;
            }
        }
    }
    
    function isCollision() {
        // Check collision with ground
        if (birdY + birdHeight > gameHeight - groundHeight) {
            return true;
        }
        
        // Check collision with ceiling
        if (birdY < 0) {
            return true;
        }
        
        // Create a very forgiving hitbox for the bird (much smaller than visual)
        const hitboxMargin = 10;
        const birdHitboxX = birdX + hitboxMargin;
        const birdHitboxY = birdY + hitboxMargin;
        const birdHitboxWidth = birdWidth - (hitboxMargin * 2);
        const birdHitboxHeight = birdHeight - (hitboxMargin * 2);
        
        // Check collision with pipes
        for (let i = 0; i < pipesArray.length; i++) {
            const pipe = pipesArray[i];
            
            // Get pipe position and dimensions
            const pipeX = parseInt(window.getComputedStyle(pipe.topPipe).getPropertyValue('left'));
            const pipeWidth = parseInt(window.getComputedStyle(pipe.topPipe).getPropertyValue('width'));
            const topPipeHeight = parseInt(window.getComputedStyle(pipe.topPipe).getPropertyValue('height'));
            
            // Make sure bottom pipe height is calculated correctly
            const bottomPipeTop = topPipeHeight + pipeGap;
            
            // Only check collision if the hitboxes actually overlap horizontally
            if (birdHitboxX + birdHitboxWidth > pipeX && birdHitboxX < pipeX + pipeWidth) {
                // Add extra space around the gap to make it easier to pass
                const extraGapSpace = 50;
                if (birdHitboxY < topPipeHeight - extraGapSpace || 
                    birdHitboxY + birdHitboxHeight > bottomPipeTop + extraGapSpace) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    function endGame() {
        gameOver = true;
        gameStarted = false;
        
        // Stop animation and intervals
        cancelAnimationFrame(animationId);
        clearInterval(pipeInterval);
        
        // Remove event listeners
        document.removeEventListener('keydown', flap);
        
        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('flappyBirdHighScore', highScore);
            highScoreDisplay.innerText = `High score: ${highScore}`;
        }
        
        // Show game over screen
        finalScoreDisplay.innerText = score;
        gameOverScreen.style.display = 'flex';
    }
    
    function showHelp() {
        if (gameStarted && !gameOver) {
            gamePaused = true;
            cancelAnimationFrame(animationId);
        }
        helpScreen.style.display = 'flex';
    }
    
    function hideHelp() {
        helpScreen.style.display = 'none';
        if (gameStarted && !gameOver) {
            gamePaused = false;
            gameLoop();
        }
    }
    
    // Event listeners
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    helpButton.addEventListener('click', showHelp);
    continueButton.addEventListener('click', hideHelp);
});