document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar iconos de Lucide
    lucide.createIcons();

    // 2. Intersection Observer para Efectos Fade (Aparición de secciones)
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    
    document.querySelectorAll('.fade-section').forEach(el => fadeObserver.observe(el));

    // 3. Intersection Observer para Barras Animadas (Gráficas)
    const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Hacer visible el contenedor de la barra
                entry.target.classList.remove('opacity-0');
                entry.target.classList.add('opacity-100');

                // Expandir la barra a su porcentaje correspondiente
                const fillEl = entry.target.querySelector('.bar-fill');
                const percentage = entry.target.getAttribute('data-percentage');

                if (fillEl && percentage) {
                    fillEl.style.width = percentage + '%';
                }
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    
    document.querySelectorAll('.animated-bar').forEach(el => barObserver.observe(el));

    // 4. LÓGICA DEL CANVAS: Camino fluido, orgánico y sub-píxel
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const steps = 250;
    const pathX = new Float32Array(steps + 1);
    const pathY = new Float32Array(steps + 1);
    let isInitialized = false;
    let targetScrollY = window.scrollY;
    let currentScrollY = window.scrollY;
    let time = 0;

    const handleScroll = () => {
        targetScrollY = window.scrollY;
    };

    const drawPath = () => {
        // Suavizado extremo del scroll (con estabilizador para evitar temblores al final)
        if (Math.abs(targetScrollY - currentScrollY) < 0.5) {
            currentScrollY = targetScrollY;
        } else {
            currentScrollY += (targetScrollY - currentScrollY) * 0.04;
        }

        // Velocidad de ondulación del camino oscuro
        time += 0.006;

        // Calcular progreso exacto del scroll
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
        );
        
        const windowHeight = window.innerHeight;
        const maxScroll = Math.max(1, documentHeight - windowHeight);
        const scrollPercent = currentScrollY / maxScroll;
        const exactProgress = scrollPercent * steps;

        // Inicializar coordenadas si es el primer frame
        if (!isInitialized) {
            for(let i = 0; i <= steps; i++) {
                pathX[i] = width / 2;
            }
            isInitialized = true;
        }

        // Actualizar altura (en caso de resize)
        for(let i = 0; i <= steps; i++) {
            pathY[i] = (height * i) / steps;
        }

        // Físicas del camino aleatorio (Congelado vs Vivo)
        const progressIndex = Math.floor(exactProgress);
        for (let i = 0; i <= steps; i++) {
            // Congelamos el camino al menos un punto por delante de la luz (+1)
            // Esto evita que la punta iluminada se mueva o tiemble en lo absoluto
            if (i > exactProgress + 1) {
                // Movimiento libre y orgánico bajo la luz
                const randomWobble = Math.sin(i * 0.06 + time * 1.5) * (width * 0.28) + 
                                     Math.cos(i * 0.09 - time * 0.8) * (width * 0.18);
                const targetX = width / 2 + randomWobble;
                pathX[i] += (targetX - pathX[i]) * 0.03;
            }
        }

        // Suavizado en la unión (solo aplicamos a los puntos que NO están congelados)
        for (let iter = 0; iter < 4; iter++) {
            for (let i = Math.max(1, progressIndex + 2); i < steps; i++) {
                pathX[i] = (pathX[i - 1] + pathX[i] * 2 + pathX[i + 1]) / 4;
            }
        }

        ctx.clearRect(0, 0, width, height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // --- DIBUJO ---

        // A. Camino base (Tubo morado grueso de fondo)
        ctx.beginPath();
        ctx.moveTo(pathX[0], pathY[0]);
        for (let i = 1; i <= steps; i++) {
            ctx.lineTo(pathX[i], pathY[i]);
        }
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.015)';
        ctx.lineWidth = 45;
        ctx.stroke();

        // B. Luz de progreso
        if (exactProgress > 0) {
            const frac = exactProgress - progressIndex;

            let tipX = pathX[progressIndex];
            let tipY = pathY[progressIndex];
            if (progressIndex < steps) {
                tipX += (pathX[progressIndex + 1] - pathX[progressIndex]) * frac;
                tipY += (pathY[progressIndex + 1] - pathY[progressIndex]) * frac;
            }

            // B.1 Glow Exterior Morado
            ctx.beginPath();
            ctx.moveTo(pathX[0], pathY[0]);
            for (let i = 1; i <= progressIndex; i++) {
                ctx.lineTo(pathX[i], pathY[i]);
            }
            if (progressIndex < steps) ctx.lineTo(tipX, tipY);

            ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
            ctx.lineWidth = 14;
            ctx.shadowBlur = 30;
            ctx.shadowColor = 'rgba(168, 85, 247, 0.3)';
            ctx.stroke();

            // B.2 Núcleo Central
            ctx.beginPath();
            ctx.moveTo(pathX[0], pathY[0]);
            for (let i = 1; i <= progressIndex; i++) {
                ctx.lineTo(pathX[i], pathY[i]);
            }
            if (progressIndex < steps) ctx.lineTo(tipX, tipY);

            ctx.strokeStyle = 'rgba(233, 213, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.stroke();

            // B.3 Partícula Guía en la punta
            ctx.beginPath();
            ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.shadowBlur = 30;
            ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
            ctx.fill();

            ctx.shadowBlur = 0;
        }

        requestAnimationFrame(drawPath);
    };

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // Iniciar dibujo
    drawPath();
});