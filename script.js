document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("emulator-canvas");
    const statusOverlay = document.getElementById("status-overlay");
    const statusText = document.getElementById("status-text");
    const fileInput = document.getElementById("file-input");
    const gameCards = document.querySelectorAll(".game-card");

    function updateStatus(msg, showSpinner = true) {
        statusOverlay.style.display = "flex";
        statusText.innerText = msg;
        const spinner = statusOverlay.querySelector(".loader-spinner");
        if(spinner) spinner.style.display = showSpinner ? "block" : "none";
    }

    function hideStatus() {
        statusOverlay.style.display = "none";
    }

    function runEmulator(arrayBuffer) {
        updateStatus("Iniciando Core Java...");
        
        // Simulação da integração com a Lib de emulação MicroEmu
        if (window.MicroEmu) {
            window.MicroEmu.runJar(arrayBuffer, canvas);
            setTimeout(hideStatus, 1500); // Dá um tempo para o canvas renderizar
        } else {
            updateStatus("Erro: Core não carregado", false);
        }
    }

    // Carregar ROM Independente da Biblioteca
    gameCards.forEach(card => {
        card.addEventListener("click", () => {
            const romPath = card.getAttribute("data-rom");
            const gameName = card.querySelector("h3").innerText;

            updateStatus(`Baixando ${gameName}...`);

            fetch(romPath)
                .then(res => {
                    if(!res.ok) throw new Error();
                    return res.arrayBuffer();
                })
                .then(buffer => {
                    runEmulator(buffer);
                })
                .catch(() => updateStatus("Erro ao baixar ROM", false));
        });
    });

    // Carregar ROM local (Upload)
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if(!file) return;

        updateStatus("Lendo arquivo...");
        const reader = new FileReader();
        reader.onload = (ev) => runEmulator(ev.target.result);
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
