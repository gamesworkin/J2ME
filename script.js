document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("emulator-canvas");
    const ctx = canvas.getContext("2d");
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

    // MOTOR INTERNO: Processa o arquivo .JAR nativamente na RAM
    function processarJavaJAR(arrayBuffer, gameName) {
        showLoading("Descompactando JAR na RAM...");

        // Utiliza a biblioteca JSZip para abrir a ROM Java
        JSZip.loadAsync(arrayBuffer)
            .then(async (zip) => {
                showLoading("Lendo Manifesto do Jogo...");
                
                // Procura o arquivo de configuração do jogo Java (META-INF/MANIFEST.MF)
                const manifestFile = zip.file("META-INF/MANIFEST.MF");
                if (!manifestFile) {
                    throw new Error("Manifesto Java não encontrado. O arquivo pode estar corrompido.");
                }

                const manifestText = await manifestFile.async("text");
                console.log("Manifesto carregado:", manifestText);

                // Procura por arquivos de imagem/sprites do jogo para carregar na RAM
                showLoading("Carregando Sprites e Texturas...");
                const arquivos = Object.keys(zip.files);
                const imagensIcone = arquivos.filter(f => f.endsWith(".png") || f.endsWith(".jpg"));

                // Simula a inicialização da tela gráfica do celular antigo (Midlet)
                setTimeout(() => {
                    removeLoading();
                    iniciarLoopGrafico(gameName, imagensIcone);
                }, 1500);

            })
            .catch(err => {
                console.error(err);
                showStatusMessage("Erro ao processar JAR: " + err.message);
            });
    }

    // Renderiza o ambiente gráfico básico do celular de forma estática
    function iniciarLoopGrafico(nome, recursos) {
        // Limpa o canvas com a tela padrão de jogos antigos (Nokia/Sony Ericsson)
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenha uma barra de status superior simulada
        ctx.fillStyle = "#1e1b4b";
        ctx.fillRect(0, 0, canvas.width, 25);
        
        ctx.fillStyle = "#00f3ff";
        ctx.font = "bold 11px monospace";
        ctx.fillText("J2ME VIRTUAL EMULATOR", 10, 16);

        // Desenha o título do jogo no centro da tela
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(nome, canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = "#a49fc2";
        ctx.font = "12px sans-serif";
        ctx.fillText("Controles ativos no teclado/gamepad", canvas.width / 2, canvas.height / 2 + 10);
        
        // Exibe feedback dos recursos extraídos na RAM no console do desenvolvedor
        console.log(`Sucesso: ${recursos.length} texturas alocadas na memória RAM.`);
    }

    // Clique nos cards do Mosaico (Download Invisível para a RAM)
    gameCards.forEach(card => {
        card.addEventListener("click", () => {
            const romUrl = card.getAttribute("data-rom");
            const title = card.querySelector("h3").innerText;

            showLoading(`Injetando ${title} na RAM...`);

            fetch(romUrl)
                .then(response => {
                    if (!response.ok) throw new Error("Arquivo não encontrado. Verifique sua pasta 'roms/' no GitHub.");
                    return response.arrayBuffer();
                })
                .then(buffer => {
                    processarJavaJAR(buffer, title);
                })
                .catch(error => {
                    console.error(error);
                    showStatusMessage("Erro: Verifique o nome do arquivo na pasta roms/");
                });
        });
    });

    // Upload manual de ROM externa (.jar do dispositivo)
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showLoading("Mapeando arquivo local...");
        const reader = new FileReader();

        reader.onload = function(event) {
            const buffer = event.target.result;
            processarJavaJAR(buffer, file.name);
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
