document.addEventListener("DOMContentLoaded", () => {
    const loadingOverlay = document.getElementById("loading-overlay");
    const romUpload = document.getElementById("rom-upload");
    const gameCards = document.querySelectorAll(".game-card");
    const statusBadge = document.getElementById("status-badge");

    // Função que ativa o emulador real usando os dados da RAM
    function executarJogo(romUrlOrBlob) {
        loadingOverlay.classList.remove("hidden");
        statusBadge.textContent = "🎮 Executando Jogo";

        try {
            // Inicializa o MicroEmu injetando-o diretamente na nossa div
            MicroEmu.start({
                target: document.getElementById("emulator-target"),
                rom: romUrlOrBlob,
                scaledWidth: 240,
                scaledHeight: 320,
                onLoaded: () => {
                    loadingOverlay.classList.add("hidden");
                    console.log("Emulação iniciada com sucesso.");
                },
                onError: (err) => {
                    loadingOverlay.classList.add("hidden");
                    statusBadge.textContent = "Erro na Engine";
                    alert("Erro ao processar a ROM: " + err);
                }
            });
        } catch (e) {
            loadingOverlay.classList.add("hidden");
            alert("Erro no motor JavaScript: " + e.message);
        }
    }

    // Método 1: Upload de arquivo local (Injeta via Objeto de RAM de curto prazo)
    romUpload.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            // Cria uma URL temporária apontando direto para a memória RAM do navegador
            const ramUrl = URL.createObjectURL(file);
            executarJogo(ramUrl);
        }
    });

    // Método 2: Biblioteca do site
    gameCards.forEach(card => {
        card.addEventListener("click", () => {
            const gameUrl = card.getAttribute("data-url");
            executarJogo(gameUrl);
        });
    });
});

// --- MAPEAMENTO AUTOMÁTICO DE GAMEPAD (JOYSTICK) ---
window.addEventListener("gamepadconnected", (event) => {
    const badge = document.getElementById("status-badge");
    if (badge) {
        badge.textContent = `🎮 ${event.gamepad.id.split(" (")[0]} Ativo`;
    }
});
