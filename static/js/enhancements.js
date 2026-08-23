/* ============================================================
   VISUAL ENHANCEMENTS — shared JS
   1) Lightweight mouse-reactive particle background
   2) Ripple effect on buttons / option cards
   3) Count-up animation for KPI / stat numbers
   4) Circular gauge fill animation (prediction page)
============================================================ */

(function () {

    // --------------------------------------------------------
    // 1) Particle background canvas
    // --------------------------------------------------------

    function initParticles() {
        const canvas = document.createElement("canvas");
        canvas.id = "enh-particles";
        document.body.prepend(canvas);

        const ctx = canvas.getContext("2d");
        let w, h, particles;
        let mouse = { x: null, y: null };

        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener("resize", resize);

        const COUNT = Math.min(70, Math.floor((window.innerWidth * window.innerHeight) / 18000));

        particles = Array.from({ length: COUNT }, function () {
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 1.8 + 0.6,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                a: Math.random() * 0.5 + 0.15
            };
        });

        window.addEventListener("mousemove", function (e) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        window.addEventListener("mouseleave", function () {
            mouse.x = null;
            mouse.y = null;
        });

        function tick() {
            ctx.clearRect(0, 0, w, h);

            particles.forEach(function (p) {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;

                if (mouse.x !== null) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 130) {
                        const force = (130 - dist) / 130;
                        p.x += (dx / (dist || 1)) * force * 1.2;
                        p.y += (dy / (dist || 1)) * force * 1.2;
                    }
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(125, 211, 252, " + p.a + ")";
                ctx.fill();
            });

            // connective lines for nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 110) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = "rgba(96, 165, 250, " + (0.12 * (1 - dist / 110)) + ")";
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(tick);
        }
        tick();
    }

    // --------------------------------------------------------
    // 2) Ripple effect
    // --------------------------------------------------------

    function initRipples() {
        document.addEventListener("click", function (e) {
            const target = e.target.closest(".option-card, form button[type='submit'], .shine-btn");
            if (!target) return;

            const rect = target.getBoundingClientRect();
            const span = document.createElement("span");
            const size = Math.max(rect.width, rect.height);

            span.className = "ripple-span";
            span.style.width = span.style.height = size + "px";
            span.style.left = (e.clientX - rect.left - size / 2) + "px";
            span.style.top = (e.clientY - rect.top - size / 2) + "px";

            const prevPosition = getComputedStyle(target).position;
            if (prevPosition === "static") target.style.position = "relative";

            target.appendChild(span);
            setTimeout(function () { span.remove(); }, 650);
        });
    }

    // --------------------------------------------------------
    // 3) Count-up animation for elements with [data-count-target]
    // --------------------------------------------------------

    function animateCount(el) {
        const target = parseFloat(el.getAttribute("data-count-target"));
        const suffix = el.getAttribute("data-count-suffix") || "";
        const isFloat = target % 1 !== 0;
        const duration = 900;
        const start = performance.now();

        function step(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = target * eased;
            el.textContent = (isFloat ? value.toFixed(1) : Math.round(value).toLocaleString()) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function initCountUps() {
        const targets = document.querySelectorAll("[data-count-target]");
        if (!targets.length) return;

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        targets.forEach(function (el) { observer.observe(el); });
    }

    // --------------------------------------------------------
    // 4) Circular gauge fill (prediction result page)
    // --------------------------------------------------------

    function initGauge() {
        const gauge = document.querySelector(".gauge-fill");
        if (!gauge) return;

        const pct = parseFloat(gauge.getAttribute("data-pct")) || 0;
        const circumference = 502.4; // 2 * PI * r(80)
        const offset = circumference - (circumference * pct) / 100;

        // animate on next frame so the transition actually plays
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                gauge.style.strokeDashoffset = offset;
            });
        });
    }

    // --------------------------------------------------------
    // 5) Model comparison bars (dashboard)
    // --------------------------------------------------------

    function initModelBars() {
        const bars = document.querySelectorAll("[data-bar-target]");
        if (!bars.length) return;

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const pct = entry.target.getAttribute("data-bar-target");
                    requestAnimationFrame(function () {
                        entry.target.style.width = pct + "%";
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        bars.forEach(function (el) { observer.observe(el); });
    }

    // --------------------------------------------------------
    // Init
    // --------------------------------------------------------

    document.addEventListener("DOMContentLoaded", function () {
        try { initParticles(); } catch (e) { /* non-critical */ }
        initRipples();
        initCountUps();
        initGauge();
        initModelBars();
    });

})();
