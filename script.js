document.addEventListener("DOMContentLoaded", () => {
    const loadingOverlay = document.getElementById("loading-overlay");
    const romUpload = document.getElementById("rom-upload");
    const gameCards = document.querySelectorAll(".game-card");
    const statusBadge = document.getElementById("status-badge");

    // --- NOVO: Carregador Dinâmico da Engine ---
    function carregarEngine(callback) {
        if (window.MicroEmu) {
            callback();
            return;
        }

        const script = document.createElement("script");
        // Fonte alternativa ultra-estável (CDN do JSDelivr para emuladores)
        script.src = "https://cdn.jsdelivr.net/gh/revelation-6/larva@master/dist/larva.js"; 
        script.onload = () => {
            console.log("Motor carregado com sucesso!");
            callback();
        };
        script.onerror = () => {
            alert("Erro crítico: Não foi possível baixar o motor do emulador. Verifique sua conexão.");
        };
        document.head.appendChild(script);
    }

    function executarJogo(romUrlOrBlob) {
        loadingOverlay.classList.remove("hidden");
        
        // Antes de rodar, garantimos que o motor existe
        carregarEngine(() => {
            try {
                // Ajuste de compatibilidade para diferentes engines (Larva ou MicroEmu)
                const engine = window.MicroEmu || window.Larva;
                
                engine.start({
                    target: document.getElementById("emulator-target"),
                    rom: romUrlOrBlob,
                    onLoaded: () => loadingOverlay.classList.add("hidden")
                });
            } catch (e) {
                loadingOverlay.classList.add("hidden");
                alert("Erro ao iniciar: " + e.message);
            }
        });
    }

    romUpload.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const ramUrl = URL.createObjectURL(file);
            executarJogo(ramUrl);
        }
    });

    gameCards.forEach(card => {
        card.addEventListener("click", () => {
            const gameUrl = card.getAttribute("data-url");
            executarJogo(gameUrl);
        });
    });
});
