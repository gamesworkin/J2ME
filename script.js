document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("emulator-canvas");
    const statusOverlay = document.getElementById("status-overlay");
    const statusText = document.getElementById("status-text");
    const fileInput = document.getElementById("file-input");
    const gameCards = document.querySelectorAll(".game-card");

    function showLoading(message) {
        statusOverlay.classList.add("status-active");
        statusText.innerText = message.toUpperCase();
        const spinner = statusOverlay.querySelector(".neon-spinner");
        if (spinner) spinner.style.display = "block";
    }

    function removeLoading() {
        statusOverlay.classList.remove("status-active");
    }

    function showStatusMessage(message) {
        statusOverlay.classList.add("status-active");
        statusText.innerText = message.toUpperCase();
        const spinner = statusOverlay.querySelector(".neon-spinner");
        if (spinner) spinner.style.display = "none";
    }

    // INICIALIZADOR DO MOTOR FREEJ2ME
    function carregarNoEmuladorReal(arrayBuffer, gameName) {
        showLoading("Montando Java Virtual Machine...");

        try {
            // Cria um ponteiro Blob seguro na memória RAM para alimentar a engine
            const blob = new Blob([arrayBuffer], { type: "application/java-archive" });
            const blobUrl = URL.createObjectURL(blob);

            // Verifica se a biblioteca acoplou a instância global FreeJ2ME
            if (window.FreeJ2ME || window.initFreeJ2ME) {
                showLoading("Executando jogo na RAM...");
                
                const startEngine = window.FreeJ2ME || window.initFreeJ2ME;
                
                // Inicializa passando o Canvas do layout e a URL interna da RAM
                startEngine({
                    canvas: canvas,
                    jarUrl: blobUrl,
                    onSuccess: () => {
                        console.log(`${gameName} carregado com sucesso.`);
                        removeLoading();
                    },
                    onFailure: (err) => {
                        showStatusMessage("Falha gráfica: " + err);
                    }
                });
            } else {
                // Caso a CDN demore a responder, executa um escopo alternativo direto
                if (typeof canvas.getContext === "function") {
                    showLoading("Iniciando modo de compatibilidade estendido...");
                    setTimeout(() => {
                        removeLoading();
                        // Força a ativação do interpretador nativo se disponível
                        if (window.startJ2ME) window.startJ2ME(canvas, blobUrl);
                    }, 1000);
                } else {
                    showStatusMessage("Erro: Motor FreeJ2ME não carregado.", false);
                }
            }
        } catch (error) {
            console.error(error);
            showStatusMessage("Erro na JVM: " + error.message, false);
        }
    }

    // Evento: Clique nos cards do Mosaico (Download Invisível)
    gameCards.forEach(card => {
        card.addEventListener("click", () => {
            const romUrl = card.getAttribute("data-rom");
            const title = card.querySelector("h3").innerText;

            showLoading(`Injetando ${title} na RAM...`);

            fetch(romUrl)
                .then(response => {
                    if (!response.ok) throw new Error("Arquivo .jar ausente no diretório roms/");
                    return response.arrayBuffer();
                })
                .then(buffer => {
                    carregarNoEmuladorReal(buffer, title);
                })
                .catch(error => {
                    console.error(error);
                    showStatusMessage("Erro: Verifique a pasta roms/ no seu repositório");
                });
        });
    });

    // Evento: Upload manual de ROM externa (.jar do dispositivo)
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showLoading("Mapeando arquivo local...");
        const reader = new FileReader();

        reader.onload = function(event) {
            const buffer = event.target.result;
            carregarNoEmuladorReal(buffer, file.name);
        };

        reader.readAsArrayBuffer(file);
    });
});
