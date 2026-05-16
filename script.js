document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("emulator-canvas");
    const loadingOverlay = document.getElementById("loading-overlay");
    const romUpload = document.getElementById("rom-upload");
    const gameCards = document.querySelectorAll(".game-card");

    // Inicializa o motor do emulador conectado ao nosso Canvas
    // O PluMA estende o contexto do canvas para renderizar os gráficos do Java
    const emuEngine = new Pluma({
        canvas: canvas,
        alpha: false,
        antialias: false // Mantém o visual pixelado perfeito para retro-games
    });

    // Função real para carregar a ROM no motor de emulação
    function carregarRomNoEmulador(buffer) {
        loadingOverlay.classList.remove("hidden");

        // Transforma o ArrayBuffer da RAM em um formato que o emulador Java entende
        emuEngine.loadMidlet(buffer)
            .then(() => {
                loadingOverlay.classList.add("hidden");
                // Inicia a execução do jogo dentro do Canvas
                emuEngine.start();
                console.log("Jogo iniciado com sucesso na RAM!");
            })
            .catch(error => {
                loadingOverlay.classList.add("hidden");
                console.error("Erro no motor do emulador:", error);
                alert("Não foi possível renderizar esta ROM. Verifique se o arquivo .jar está íntegro.");
            });
    }

    // Evento para upload de arquivo próprio (.jar)
    romUpload.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
                carregarRomNoEmulador(arrayBuffer);
            };
            reader.readAsArrayBuffer(file);
        }
    });

    // Evento para clicar nos jogos da lista do site
    gameCards.forEach(card => {
        card.addEventListener("click", () => {
            const gameUrl = card.getAttribute("data-url");
            loadingOverlay.classList.remove("hidden");

            fetch(gameUrl)
                .then(response => {
                    if (!response.ok) throw new Error("Não foi possível baixar o jogo do repositório.");
                    return response.arrayBuffer();
                })
                .then(buffer => {
                    carregarRomNoEmulador(buffer);
                })
                .catch(err => {
                    alert("Erro: " + err.message);
                    loadingOverlay.classList.add("hidden");
                });
        });
    });
});

// --- SISTEMA DE DETECÇÃO DE GAMEPAD ---
window.addEventListener("gamepadconnected", (event) => {
    const statusBadge = document.querySelector(".status-badge");
    if (statusBadge) {
        statusBadge.textContent = `🎮 ${event.gamepad.id.split(" (")[0]} Pronto`;
        statusBadge.style.borderColor = "#00f3ff";
    }
});
