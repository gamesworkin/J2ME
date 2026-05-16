document.addEventListener("DOMContentLoaded", () => {
    const romUpload = document.getElementById("rom-upload");
    const status = document.getElementById("status");
    const loading = document.getElementById("loading-overlay");

    // Função para iniciar o jogo
    function iniciarJogo(fileData) {
        loading.classList.remove("hidden");
        status.textContent = "Status: Rodando Jogo";

        try {
            // Aqui conectamos com a biblioteca EmulatorJS ou similar
            // Para J2ME, se você não quiser configurar um servidor complexo, 
            // a melhor forma é usar o emulador que já vem "empacotado"
            console.log("Iniciando emulação na RAM...");
            
            // Simulação de carregamento para garantir que o código chega aqui
            setTimeout(() => {
                loading.classList.add("hidden");
                // IMPORTANTE: O GitHub Pages precisa de HTTPS. 
                // Se o arquivo JAR estiver no seu repositório, use caminhos relativos.
            }, 1000);

        } catch (e) {
            alert("Erro ao iniciar motor: " + e.message);
            loading.classList.add("hidden");
        }
    }

    // Listener para Upload manual
    romUpload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => iniciarJogo(event.target.result);
            reader.readAsArrayBuffer(file);
        }
    });
});
