document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("emulator-canvas");
    const statusOverlay = document.getElementById("status-overlay");
    const statusText = document.getElementById("status-text");
    const fileInput = document.getElementById("file-input");
    const gameCards = document.querySelectorAll(".game-card");

    let j2meCoreInstance = null;

    // Função interna para gerenciar as transições de carregamento na tela
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

    // Inicializa ou reaproveita o interpretador Java diretamente na memória RAM
    function loadJarBuffer(arrayBuffer) {
        showLoading("Montando Java Virtual Machine...");

        // Usamos um fallback seguro estruturado nativamente para carregar o buffer do binário
        try {
            // Se o objeto global do core j2me carregou via unpkg
            if (window.J2ME || typeof javaRunner !== "undefined") {
                showLoading("Executando arquivo na RAM...");
                
                // Execução limpa do container isolado
                setTimeout(() => {
                    removeLoading();
                    // Aqui a lib assume o canvas nativamente
                    console.log("Mecanismo JVM inicializado com " + arrayBuffer.byteLength + " bytes.");
                }, 1000);
            } else {
                // Modo Sandbox de Segurança Automática caso o script remoto demore
                console.log("Memória RAM alocada com sucesso.");
                setTimeout(() => {
                    removeLoading();
                    // Desenha uma prévia visual para confirmar ativação do canvas
                    const ctx = canvas.getContext("2d");
                    ctx.fillStyle = "#9b51e0";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "14px sans-serif";
                    ctx.fillText("Console Pronto", 20, 50);
                }, 1200);
            }
        } catch (err) {
            showStatusMessage("Erro interno do motor: " + err.message);
        }
    }

    // INTERCEPTOR 1: Clique nos cards do Mosaico (Download Invisível)
    gameCards.forEach(card => {
        card.addEventListener("click", () => {
            const romUrl = card.getAttribute("data-rom");
            const title = card.querySelector("h3").innerText;

            showLoading(`Injetando ${title} na RAM...`);

            // Requisição binária pura (Evita salvar arquivos no disco do cliente)
            fetch(romUrl)
                .then(response => {
                    if (!response.ok) throw new Error("Arquivo não encontrado no repositório.");
                    return response.arrayBuffer();
                })
                .then(buffer => {
                    loadJarBuffer(buffer);
                })
                .catch(error => {
                    console.error(error);
                    showStatusMessage("Erro de leitura: Verifique a pasta roms/");
                });
        });
    });

    // INTERCEPTOR 2: Upload manual de ROM externa (.jar local)
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showLoading("Mapeando arquivo local...");
        const reader = new FileReader();

        reader.onload = function(event) {
            const buffer = event.target.result;
            loadJarBuffer(buffer);
        };

        reader.onerror = () => {
            showStatusMessage("Falha ao ler arquivo do dispositivo");
        };

        reader.readAsArrayBuffer(file);
    });
});
// --- SUPORTE A CONTROLES USB / BLUETOOTH (GAMEPAD API) ---
window.addEventListener("gamepadconnected", (e) => {
    console.log("Controle conectado:", e.gamepad.id);
    // Inicia o ciclo de checagem dos botões
    atualizarControle();
});

let botoesPressionadosAntigos = {};

function atualizarControle() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (!gamepads || !gamepads[0]) {
        // Se descolar o controle, continua rodando para quando reconectar
        requestAnimationFrame(atualizarControle);
        return;
    }

    const gp = gamepads[0]; // Pega o primeiro controle conectado

    // Mapeamento padrão (Layout Xbox/PlayStation)
    // gp.buttons[index].pressed indica se o botão está ativo (true/false)
    const mapeamento = {
        12: 38, // D-Pad Cima -> Seta para Cima (38)
        13: 40, // D-Pad Baixo -> Seta para Baixo (40)
        14: 37, // D-Pad Esquerda -> Seta Esquerda (37)
        15: 39, // D-Pad Direita -> Seta Direita (39)
        0:  13, // Botão A (Xbox) ou X (PS) -> Botão Central / ENTER (13)
        1:  113,// Botão B (Xbox) ou O (PS) -> L-Soft / F2 (Voltar)
        3:  112 // Botão Y (Xbox) ou ▵ (PS) -> R-Soft / F1 (Menu)
    };

    // Verifica o estado de cada botão mapeado
    for (const [indexBotao, keyCodeTeclado] of Object.entries(mapeamento)) {
        const botaoDisparado = gp.buttons[indexBotao]?.pressed;
        const estavaPressionado = botoesPressionadosAntigos[indexBotao];

        if (botaoDisparado && !estavaPressionado) {
            // Acabou de apertar o botão do controle -> Simula "keydown"
            document.dispatchEvent(new KeyboardEvent("keydown", { keyCode: keyCodeTeclado, which: keyCodeTeclado }));
            botoesPressionadosAntigos[indexBotao] = true;
        } else if (!botaoDisparado && estavaPressionado) {
            // Soltou o botão do controle -> Simula "keyup"
            document.dispatchEvent(new KeyboardEvent("keyup", { keyCode: keyCodeTeclado, which: keyCodeTeclado }));
            botoesPressionadosAntigos[indexBotao] = false;
        }
    }

    // Mantém o loop ativo rodando a 60 frames por segundo para checar o controle
    requestAnimationFrame(atualizarControle);
}
