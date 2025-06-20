// js/gameLogic.js
import { Player } from './player.js';
import { Scene } from './scene.js'; // Importa a classe Scene

export function initializeGame(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    canvas.width = 800;
    canvas.height = 600;

    // Instancia o cenário
    const scene = new Scene(canvas.width, canvas.height);

    // Instancia o jogador
    // Ajusta a posição Y inicial do jogador para que ele fique no chão
    const playerInitialY = canvas.height - scene.groundHeight - (40 / 2); // (40 é a altura do player)
    const player = new Player(
        canvas.width / 2,
        playerInitialY,
        40, 40, 'blue', 7, // x, y, largura, altura, cor, velocidade
        100, 50 // Vida inicial, Magia inicial
    );

    // Mapeia as teclas pressionadas
    const keys = {};
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // Função principal de atualização do jogo (game loop)
    function gameLoop() {
        // 1. Limpar o canvas a cada frame (Não é mais estritamente necessário se o fundo cobre tudo)
        // ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Desenhar o cenário PRIMEIRO
        scene.draw(ctx);

        // 3. Atualizar a lógica do jogo
        // Mover o jogador com base nas teclas pressionadas
        if (keys['ArrowLeft']) {
            player.move('left', canvas.width);
        }
        if (keys['ArrowRight']) {
            player.move('right', canvas.width);
        }

        // Atualizar a animação de levitação do jogador
        player.updateLevitation();

        // 4. Desenhar os elementos na tela
        player.draw(ctx);

        // Exibir pontuação e outras informações da UI
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Pontuação: ${player.score}`, 10, 30);
        ctx.fillText(`Vida: ${player.life}/${player.maxLife}`, 10, 60);
        ctx.fillText(`Magia: ${player.magic}/${player.maxMagic}`, 10, 90);


        // 5. Chamar a próxima animação do frame
        requestAnimationFrame(gameLoop);
    }

    // --- Inicialização do Jogo ---
    gameLoop(); // Inicia o loop do jogo

    // Exemplo de uso das novas propriedades/métodos (para testar no console)
    setTimeout(() => {
        player.takeDamage(20);
        player.useMagic(10);
        player.addScore(50);
    }, 3000);
}
