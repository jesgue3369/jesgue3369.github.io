// js/gameLogic.js
import { Player } from './player.js';

export function initializeGame(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    canvas.width = 800;
    canvas.height = 600;

    // Instancia o jogador com vida e magia inicial
    const player = new Player(
        canvas.width / 2,
        canvas.height - 100, // Posição Y um pouco acima para a levitação
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
        // 1. Limpar o canvas a cada frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Atualizar a lógica do jogo

        // Mover o jogador com base nas teclas pressionadas
        if (keys['ArrowLeft']) {
            player.move('left', canvas.width);
        }
        if (keys['ArrowRight']) {
            player.move('right', canvas.width);
        }

        // Atualizar a animação de levitação do jogador
        player.updateLevitation();

        // 3. Desenhar os elementos na tela
        player.draw(ctx);

        // Opcional: Desenhar a pontuação principal na tela
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Pontuação: ${player.score}`, 10, 30);


        // 4. Chamar a próxima animação do frame
        requestAnimationFrame(gameLoop);
    }

    // --- Inicialização do Jogo ---
    gameLoop(); // Inicia o loop do jogo

    // Exemplo de uso das novas propriedades/métodos (para testar no console)
    console.log(`Vida inicial do Player: ${player.life}`);
    console.log(`Magia inicial do Player: ${player.magic}`);

    // Para testar: simular dano e uso de magia após 3 segundos
    setTimeout(() => {
        player.takeDamage(20);
        player.useMagic(10);
        player.addScore(50);
    }, 3000);
}
