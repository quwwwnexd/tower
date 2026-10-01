"use strict";

const menu = document.getElementById("menu");
const game = document.getElementById("game");

const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

const archer = document.getElementById("archer");
const forest = document.querySelector(".forest");

const waveValue = document.getElementById("wave-value");
const wallValue = document.getElementById("wall-value");
const wallBar = document.getElementById("wall-bar");
const goldValue = document.getElementById("gold-value");
const enemiesValue = document.getElementById("enemies-value");

const toastElement = document.getElementById("toast");
const waveInfoElement = document.getElementById("wave-info");

const gameOver = document.getElementById("game-over");
const gameOverTitle = document.getElementById("game-over-title");
const gameOverText = document.getElementById("game-over-text");

const keys = {};

const enemyTypes = {
    normal: {
        name: "Обычные орки",
        health: 55,
        speed: 22,
        reward: 12,
        icon: "👹"
    },

    fast: {
        name: "Быстрые орки",
        health: 30,
        speed: 38,
        reward: 15,
        icon: "👺"
    },

    heavy: {
        name: "Тяжёлые орки",
        health: 150,
        speed: 12,
        reward: 30,
        icon: "👿"
    },

    shield: {
        name: "Щитоносцы",
        health: 100,
        speed: 17,
        reward: 25,
        icon: "🛡️"
    }
};

let running = false;
let animationFrame = 0;
let lastFrameTime = 0;
let lastShotTime = 0;

let archerX = 0.5;

let wallHealth = 100;
let maxWallHealth = 100;

let gold = 0;
let wave = 0;

let arrowDamage = 25;
let shootingCooldown = 430;
let fireArrows = false;

let totalEnemiesInWave = 0;
let spawnedEnemies = 0;

const enemies = [];
const projectiles = [];

function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.remove("hidden");

    setTimeout(() => {
        toastElement.classList.add("hidden");
    }, 1800);
}

function resetGame() {
    running = true;

    archerX = 0.5;

    wallHealth = 100;
    maxWallHealth = 100;

    gold = 0;
    wave = 0;

    arrowDamage = 25;
    shootingCooldown = 430;
    fireArrows = false;

    spawnedEnemies = 0;
    totalEnemiesInWave = 0;

    enemies.forEach(enemy => {
        enemy.element.remove();
    });

    projectiles.forEach(projectile => {
        projectile.remove();
    });

    enemies.length = 0;
    projectiles.length = 0;

    const fireButton =
        document.querySelector('[data-upgrade="fire"]');

    fireButton.disabled = false;

    updateInterface();
}

function startGame() {
    menu.classList.add("hidden");
    game.classList.remove("hidden");
    gameOver.classList.add("hidden");

    resetGame();
    startNextWave();

    cancelAnimationFrame(animationFrame);

    lastFrameTime = performance.now();
    animationFrame = requestAnimationFrame(gameLoop);
}

function restartGame() {
    gameOver.classList.add("hidden");

    resetGame();
    startNextWave();

    cancelAnimationFrame(animationFrame);

    lastFrameTime = performance.now();
    animationFrame = requestAnimationFrame(gameLoop);
}

function startNextWave() {
    wave++;

    spawnedEnemies = 0;
    totalEnemiesInWave = 7 + wave * 3;

    const types = ["Обычные орки"];

    if (wave >= 2) {
        types.push("Быстрые орки");
    }

    if (wave >= 3) {
        types.push("Тяжёлые орки");
    }

    if (wave >= 4) {
        types.push("Щитоносцы");
    }

    waveInfoElement.innerHTML =
        `Следующая волна: ${totalEnemiesInWave}<br>` +
        types.join(" · ");

    showToast(
        `WAVE ${wave} — ${totalEnemiesInWave} врагов`
    );

    setTimeout(spawnEnemy, 900);
}

function chooseEnemyType() {
    const random = Math.random();

    if (wave >= 4 && random < 0.16) {
        return "shield";
    }

    if (wave >= 3 && random < 0.35) {
        return "heavy";
    }

    if (wave >= 2 && random < 0.55) {
        return "fast";
    }

    return "normal";
}

function spawnEnemy() {
    if (!running) {
        return;
    }

    if (spawnedEnemies >= totalEnemiesInWave) {
        return;
    }

    const typeName = chooseEnemyType();
    const type = enemyTypes[typeName];

    const enemy = {
        typeName,
        x: 0.2 + Math.random() * 0.6,
        y: 1.03,
        health: type.health,
        maxHealth: type.health,
        attackTimer: 0,
        element: document.createElement("div")
    };

    enemy.element.className = "enemy";

    enemy.element.innerHTML = `
        ${type.icon}
        <div class="enemy-health">
            <span class="enemy-health-fill"></span>
        </div>
    `;

    forest.appendChild(enemy.element);
    enemies.push(enemy);

    spawnedEnemies++;

    setTimeout(
        spawnEnemy,
        Math.max(260, 900 - wave * 45)
    );
}

function shoot() {
    if (!running) {
        return;
    }

    const currentTime = performance.now();

    if (
        currentTime - lastShotTime < shootingCooldown
    ) {
        return;
    }

    lastShotTime = currentTime;

    const target = enemies
        .filter(enemy => enemy.y < 0.98)
        .sort((a, b) => b.y - a.y)[0];

    if (!target) {
        return;
    }

    const projectile = document.createElement("div");

    projectile.className = "projectile";

    const startX = archer.offsetLeft + 30;
    const startY = archer.offsetTop + 30;

    const targetX = target.x * window.innerWidth;

    const targetY =
        target.y * forest.clientHeight +
        forest.offsetTop;

    projectile.style.left = `${startX}px`;
    projectile.style.top = `${startY}px`;

    projectile.dataset.velocityX =
        (targetX - startX) / 420;

    projectile.dataset.velocityY =
        (targetY - startY) / 420;

    projectile.dataset.damage = arrowDamage;

    game.appendChild(projectile);
    projectiles.push(projectile);
}

function updateArcher(deltaTime) {
    if (keys.ArrowLeft) {
        archerX -= 0.00035 * deltaTime;
    }

    if (keys.ArrowRight) {
        archerX += 0.00035 * deltaTime;
    }

    archerX = Math.max(0.08, Math.min(0.92, archerX));

    archer.style.left = `${archerX * 100}%`;
}

function updateProjectiles(deltaTime) {
    for (
        let index = projectiles.length - 1;
        index >= 0;
        index--
    ) {
        const projectile = projectiles[index];

        const velocityX =
            Number(projectile.dataset.velocityX);

        const velocityY =
            Number(projectile.dataset.velocityY);

        const x =
            parseFloat(projectile.style.left) +
            velocityX * deltaTime;

        const y =
            parseFloat(projectile.style.top) +
            velocityY * deltaTime;

        projectile.style.left = `${x}px`;
        projectile.style.top = `${y}px`;

        const angle = Math.atan2(
            velocityY,
            velocityX
        );

        projectile.style.transform =
            `rotate(${angle}rad)`;

        const hitEnemy = enemies.find(enemy => {
            const enemyX = enemy.x * window.innerWidth;

            const enemyY =
                enemy.y * forest.clientHeight +
                forest.offsetTop;

            const distance = Math.hypot(
                enemyX - x,
                enemyY - y
            );

            return distance < 30;
        });

        if (hitEnemy) {
            let damage =
                Number(projectile.dataset.damage);

            if (hitEnemy.typeName === "shield") {
                damage *= 0.45;
            }

            hitEnemy.health -= damage;

            if (fireArrows) {
                hitEnemy.health -= 12;
            }

            projectile.remove();
            projectiles.splice(index, 1);

            if (hitEnemy.health <= 0) {
                gold += enemyTypes[
                    hitEnemy.typeName
                ].reward;

                hitEnemy.element.remove();

                enemies.splice(
                    enemies.indexOf(hitEnemy),
                    1
                );
            }

            continue;
        }

        if (
            x < -50 ||
            x > window.innerWidth + 50 ||
            y < 0 ||
            y > window.innerHeight
        ) {
            projectile.remove();
            projectiles.splice(index, 1);
        }
    }
}

function updateEnemies(deltaTime) {
    enemies.forEach(enemy => {
        const type = enemyTypes[enemy.typeName];

        enemy.y -=
            type.speed *
            deltaTime /
            100000;

        enemy.element.style.left =
            `${enemy.x * 100}%`;

        enemy.element.style.top =
            `${enemy.y * 100}%`;

        const healthFill =
            enemy.element.querySelector(
                ".enemy-health-fill"
            );

        healthFill.style.width =
            `${Math.max(
                0,
                enemy.health / enemy.maxHealth * 100
            )}%`;

        if (enemy.y < 0.04) {
            enemy.attackTimer += deltaTime;

            if (enemy.attackTimer > 850) {
                wallHealth -=
                    enemy.typeName === "heavy"
                        ? 5
                        : 2;

                enemy.attackTimer = 0;
            }
        }
    });
}

function updateInterface() {
    waveValue.textContent = wave;

    wallValue.textContent =
        `${Math.max(0, Math.ceil(wallHealth))}/${maxWallHealth}`;

    wallBar.style.width =
        `${Math.max(
            0,
            wallHealth / maxWallHealth * 100
        )}%`;

    goldValue.textContent = gold;

    enemiesValue.textContent =
        enemies.length +
        Math.max(
            0,
            totalEnemiesInWave - spawnedEnemies
        );
}

function showGameOver(playerWon) {
    running = false;

    gameOver.classList.remove("hidden");

    if (playerWon) {
        gameOverTitle.textContent =
            "КРЕПОСТЬ ВЫСТОЯЛА";

        gameOverText.textContent =
            "Орда рассеяна.";
    } else {
        gameOverTitle.textContent =
            "СТЕНА ПАЛА";

        gameOverText.textContent =
            "Последний факел погас.";
    }
}

function gameLoop(currentTime) {
    if (!running) {
        return;
    }

    const deltaTime =
        Math.min(
            40,
            currentTime - lastFrameTime || 16
        );

    lastFrameTime = currentTime;

    updateArcher(deltaTime);

    if (keys[" "]) {
        shoot();
    }

    updateProjectiles(deltaTime);
    updateEnemies(deltaTime);
    updateInterface();

    if (wallHealth <= 0) {
        showGameOver(false);
        return;
    }

    if (
        spawnedEnemies === totalEnemiesInWave &&
        enemies.length === 0
    ) {
        gold += 35 + wave * 8;
        startNextWave();
    }

    animationFrame =
        requestAnimationFrame(gameLoop);
}

function buyUpgrade(button) {
    const upgradeType =
        button.dataset.upgrade;

    const price =
        Number(button.querySelector("span").textContent);

    if (gold < price) {
        showToast("Недостаточно золота");
        return;
    }

    gold -= price;

    if (upgradeType === "damage") {
        arrowDamage += 12;
    }

    if (upgradeType === "speed") {
        shootingCooldown =
            Math.max(150, shootingCooldown - 55);
    }

    if (upgradeType === "wall") {
        maxWallHealth += 25;

        wallHealth = Math.min(
            maxWallHealth,
            wallHealth + 25
        );
    }

    if (upgradeType === "fire") {
        fireArrows = true;
        button.disabled = true;
    }

    showToast("Улучшение куплено");
    updateInterface();
}

document.addEventListener("keydown", event => {
    keys[event.key] = true;

    if (event.key === " ") {
        event.preventDefault();
    }
});

document.addEventListener("keyup", event => {
    keys[event.key] = false;
});

document.addEventListener("mousedown", event => {
    if (event.target.tagName !== "BUTTON") {
        shoot();
    }
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);

document
    .querySelectorAll("[data-upgrade]")
    .forEach(button => {
        button.addEventListener("click", () => {
            buyUpgrade(button);
        });
    });
