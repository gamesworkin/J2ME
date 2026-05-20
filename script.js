const gamesContainer = document.getElementById("gamesContainer");

async function loadGames() {
    const response = await fetch("games.json");
    const games = await response.json();

    games.forEach(game => {
        const card = document.createElement("div");
        card.className = "game-card";

        card.innerHTML = `
            <img src="${game.thumb}">

            <div class="game-info">
                <h3>${game.name}</h3>

                <button class="play-btn"
                    onclick="startGame('${game.file}')">
                    Jogar
                </button>
            </div>
        `;

        gamesContainer.appendChild(card);
    });
}

loadGames();

function startGame(gameFile) {

    alert("Iniciando: " + gameFile);

    // Aqui você integrará o J2ME.js
    // carregando o .jar diretamente
    // no emulador.
}

function uploadROM() {
    const input = document.getElementById("romUpload");

    if (!input.files.length) {
        alert("Selecione uma ROM .jar");
        return;
    }

    const file = input.files[0];

    const reader = new FileReader();

    reader.onload = function(e) {

        const romData = e.target.result;

        console.log("ROM carregada na RAM", romData);

        // Enviar para o emulador
    };

    reader.readAsArrayBuffer(file);
}