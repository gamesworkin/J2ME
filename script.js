// Aguarda o DOM carregar completamente
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("emulator-canvas");
    const loadingOverlay = document.getElementById("loading-overlay");
    const romUpload = document.getElementById("rom-upload");
    const gameCards = document.querySelectorAll(".game-card");

    // Configuração inicial do Emulador (MojoLoader Engine)
    // Nota: O MojoLoader expõe globalmente uma classe ou função de inicialização.
    let emulatorInstance = null;

    function initEmulator(romSource, isBuffer = false) {
        // Exibe o overlay de carregamento na RAM
        loadingOverlay.classList.remove("hidden");

        // Se já houver uma instância rodando, nós limpamos antes de começar outra
        if (emulatorInstance) {
            try { emulatorInstance.stop(); } catch(e) {}
        }

        // Configuração fictícia base do padrão MojoLoader / MicroEmulator JS bridges
        setTimeout(() => {
            // Aqui fazemos o "Mock" do carregamento na memória RAM via Blob/ArrayBuffer
            console.log("Alocando espaço na memória RAM do navegador...");
            
            // Exemplo de chamada real de API de emulador Web:
            // MojoLoader.start({ canvas: canvas, rom: romSource });

            // Simulação visual de sucesso (remover na integração com o script do emulador real)
            loadingOverlay.classList.add("hidden");
            alert("Jogo carregado diretamente na sua RAM! Pronto para jogar.");
        }, 1500);
    }

    // Método 1: Usuário faz upload do próprio arquivo local (.jar)
    romUpload.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
                // Transforma o arquivo local em dados na RAM e envia para o motor
                initEmulator(arrayBuffer, true);
            };
            
            reader.readAsArrayBuffer(file);
        }
    });

    // Método 2: Usuário clica em um jogo da lista (Baixa na RAM via Fetch)
    gameCards.forEach(card => {
        card.addEventListener("click", () => {
            const gameUrl = card.getAttribute("data-url");
            
            // Baixa o arquivo binário direto para a RAM do navegador via Fetch API
            fetch(gameUrl)
                .then(response => {
                    if (!response.ok) throw new Error("Erro ao baixar a ROM.");
                    return response.arrayBuffer();
                })
                .then(buffer => {
                    // Executa o jogo direto do buffer da RAM
                    initEmulator(buffer, true);
                })
                .catch(err => {
                    alert("Erro ao buscar jogo no servidor estável: " + err.message);
                    loadingOverlay.classList.add("hidden");
                });
        });
    });
});
// --- SISTEMA DE DETECÇÃO DE GAMEPAD (JOYSTICKS) ---

window.addEventListener("gamepadconnected", (event) => {
    const gamepad = event.gamepad;
    console.log(`Controle conectado: ${gamepad.id}`);
    
    // Atualiza o status na barra superior para um visual mais profissional
    const statusBadge = document.querySelector(".status-badge");
    if (statusBadge) {
        statusBadge.textContent = `🎮 ${gamepad.id.split(" (")[0]} Pronto`;
        statusBadge.style.borderColor = "#00f3ff";
        statusBadge.style.color = "#00f3ff";
    }
});

window.addEventListener("gamepaddisconnected", (event) => {
    console.log("Controle desconectado.");
    
    const statusBadge = document.querySelector(".status-badge");
    if (statusBadge) {
        statusBadge.textContent = "WebAssembly Engine Active";
        statusBadge.style.borderColor = "var(--neon-cyan)";
        statusBadge.style.color = "var(--neon-cyan)";
    }
});

// Loop para ler os botões (Polling) caso o emulador base precise de mapeamento manual
function pollGamepad() {
    const gamepads = navigator.getGamepads();
    if (gamepads[0]) {
        const gp = gamepads[0];
        
        // Exemplo de leitura rápida:
        // gp.buttons[0].pressed -> Botão A (Xbox) / X (PS)
        // gp.axes[0] -> Eixo analógico horizontal
        
        // A maioria dos emuladores Web (como o MojoLoader ou RetroArch Web) 
        // já faz esse mapeamento interno automaticamente se a API estiver ativa.
    }
    requestAnimationFrame(pollGamepad);
}

// Inicia a checagem contínua dos botões
statusBadge ? pollGamepad() : null;
