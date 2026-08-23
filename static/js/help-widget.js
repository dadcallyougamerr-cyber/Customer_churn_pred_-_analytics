/* ============================================================
   NEED HELP WIDGET — button-driven guided assistant
   No external AI API required: the viewer picks from a list of
   questions, the bot replies, and offers the next set of related
   questions. Content is grounded in this project's real model
   stats (see train_model.py output).
============================================================ */

(function () {

    // --------------------------------------------------------
    // CONVERSATION TREE
    // Each node: { message: string, options: [ {label, next} ] }
    // An option can instead carry { label, url } to navigate.
    // --------------------------------------------------------

    const HELP_TREE = {

        root: {
            message: "Hi, I'm your Churn Assistant. I can explain how this site works — what would you like to know?",
            options: [
                { label: "How does the churn prediction work?", next: "prediction" },
                { label: "What does the probability score mean?", next: "probability" },
                { label: "How accurate is the model?", next: "accuracy" },
                { label: "What can I do on the Dashboard?", next: "dashboard" },
                { label: "What data was this trained on?", next: "data" },
                { label: "What tech powers this site?", next: "tech" },
                { label: "I'm not sure where to start", next: "stuck" }
            ]
        },

        prediction: {
            message: "On the Prediction page, you fill in a customer's details — contract type, tenure, monthly charges, services subscribed, etc. That data is passed to a trained Random Forest pipeline, which encodes the categorical fields and outputs a churn probability instantly.",
            options: [
                { label: "Which factors matter most?", next: "factors" },
                { label: "⬅ Back to main menu", next: "root" }
            ]
        },

        factors: {
            message: "For telecom churn, contract type, tenure, monthly charges, and whether the customer has tech support / online security tend to be the strongest signals. A full feature-importance / SHAP breakdown per prediction is planned as an upcoming addition.",
            options: [
                { label: "⬅ Back to main menu", next: "root" }
            ]
        },

        probability: {
            message: "The score (0–100%) is the model's confidence that a customer will churn. Above 50% is generally flagged as 'likely to churn' — the higher the number, the more confident the model is.",
            options: [
                { label: "What counts as high risk?", next: "risk_levels" },
                { label: "⬅ Back to main menu", next: "root" }
            ]
        },

        risk_levels: {
            message: "As a rough guide: 0–30% is low risk, 30–60% is medium (worth monitoring), and 60%+ is high risk and worth a retention action. These bands aren't hardcoded in the model — they're just a sensible way to read the number.",
            options: [
                { label: "⬅ Back to main menu", next: "root" }
            ]
        },

        accuracy: {
            message: "This site compares 4 models (Logistic Regression, Random Forest, Gradient Boosting, Hist Gradient Boosting) via 5-fold cross-validation, then tunes the winner. The best model — Gradient Boosting — hits 80.5% accuracy and 0.85 ROC-AUC on unseen test data, catching 53% of churners at high precision (67%).",
            options: [
                { label: "Why compare multiple models?", next: "why_accuracy" },
                { label: "⬅ Back to main menu", next: "root" }
            ]
        },

        why_accuracy: {
            message: "No single algorithm wins on every dataset. Testing several with the same cross-validation split — then tuning only the best one — avoids picking a model that just got lucky on one split, and gives an honest, reproducible comparison. You can see the full model leaderboard on the Dashboard.",
            options: [
                { label: "⬅ Back to main menu", next: "root" }
            ]
        },

        dashboard: {
            message: "The Dashboard shows KPIs (total customers, churned, retained, churn rate) plus interactive charts you can slice by Contract type, Internet Service, Gender, and Senior Citizen status.",
            options: [
                { label: "What filters can I use?", next: "filters" },
                { label: "⬅ Back to main menu", next: "root" }
            ]
        },

        filters: {
            message: "You can filter the whole dashboard by Contract (month-to-month, one year, two year), Internet Service type, Gender, and Senior Citizen status — the KPIs and charts update live based on your selection.",
            options: [
                { label: "⬅ Back to main menu", next: "root" }
            ]
        },

        data: {
            message: "The model is trained on 7,043 customer records — demographics, account details (tenure, contract, billing), and subscribed services (phone, internet, streaming, security, tech support) — modeled on a telecom company's customer base.",
            options: [
                { label: "⬅ Back to main menu", next: "root" }
            ]
        },

        tech: {
            message: "Backend: Flask (Python) serving a scikit-learn Random Forest pipeline. Frontend: HTML/CSS/JS, with Three.js powering the animated backgrounds and Chart.js driving the dashboard visuals.",
            options: [
                { label: "⬅ Back to main menu", next: "root" }
            ]
        },

        stuck: {
            message: "No problem — here's the quickest path: try the Prediction page to test a single customer, or the Dashboard to see overall churn trends. Want me to take you there?",
            options: [
                { label: "Go to Prediction page", url: "/predict-page" },
                { label: "Go to Dashboard", url: "/dashboard" },
                { label: "⬅ Back to main menu", next: "root" }
            ]
        }
    };

    // --------------------------------------------------------
    // DOM refs
    // --------------------------------------------------------

    const rootEl = document.getElementById("help-widget-root");
    if (!rootEl) return;

    const fabBtn = rootEl.querySelector(".help-fab");
    const closeBtn = rootEl.querySelector(".help-close-btn");
    const restartBtn = rootEl.querySelector(".help-restart-btn");
    const messagesEl = rootEl.querySelector(".help-messages");
    const optionsEl = rootEl.querySelector(".help-options");

    // --------------------------------------------------------
    // Rendering helpers
    // --------------------------------------------------------

    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addUserBubble(text) {
        const wrap = document.createElement("div");
        wrap.className = "help-msg user";
        wrap.innerHTML =
            '<div class="mini-avatar">🙂</div>' +
            '<div class="help-bubble"></div>';
        wrap.querySelector(".help-bubble").textContent = text;
        messagesEl.appendChild(wrap);
        scrollToBottom();
    }

    function addBotBubble(text) {
        const wrap = document.createElement("div");
        wrap.className = "help-msg bot";
        wrap.innerHTML =
            '<div class="mini-avatar">🤖</div>' +
            '<div class="help-bubble"></div>';
        wrap.querySelector(".help-bubble").textContent = text;
        messagesEl.appendChild(wrap);
        scrollToBottom();
    }

    function showTyping(callback) {
        const wrap = document.createElement("div");
        wrap.className = "help-msg bot help-typing-wrap";
        wrap.innerHTML =
            '<div class="mini-avatar">🤖</div>' +
            '<div class="help-bubble help-typing"><span></span><span></span><span></span></div>';
        messagesEl.appendChild(wrap);
        scrollToBottom();

        setTimeout(function () {
            wrap.remove();
            callback();
        }, 450);
    }

    function renderOptions(node) {
        optionsEl.innerHTML = "";
        node.options.forEach(function (opt) {
            const btn = document.createElement("button");
            btn.className = "help-option-btn";
            btn.type = "button";
            btn.textContent = opt.label;
            btn.addEventListener("click", function () {
                handleChoice(opt);
            });
            optionsEl.appendChild(btn);
        });
    }

    function goToNode(nodeKey, skipUserBubble) {
        const node = HELP_TREE[nodeKey];
        if (!node) return;

        showTyping(function () {
            addBotBubble(node.message);
            renderOptions(node);
        });
    }

    function handleChoice(opt) {
        // Disable buttons while we respond
        Array.prototype.forEach.call(
            optionsEl.querySelectorAll(".help-option-btn"),
            function (b) { b.disabled = true; }
        );

        addUserBubble(opt.label);

        if (opt.url) {
            showTyping(function () {
                addBotBubble("Taking you there now...");
                setTimeout(function () {
                    window.location.href = opt.url;
                }, 500);
            });
            return;
        }

        goToNode(opt.next);
    }

    function resetConversation() {
        messagesEl.innerHTML = "";
        optionsEl.innerHTML = "";
        const node = HELP_TREE.root;
        addBotBubble(node.message);
        renderOptions(node);
    }

    // --------------------------------------------------------
    // Open / close
    // --------------------------------------------------------

    fabBtn.addEventListener("click", function () {
        rootEl.classList.add("open");
        if (!messagesEl.children.length) {
            resetConversation();
        }
    });

    closeBtn.addEventListener("click", function () {
        rootEl.classList.remove("open");
    });

    restartBtn.addEventListener("click", resetConversation);

})();
