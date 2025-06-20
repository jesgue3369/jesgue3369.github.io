// js/player.js

export class Player {
    constructor(x, y, width, height, color, speed, initialLife, initialMagic) {
        this.x = x;
        this.y = y;
        this.baseY = y; // Posição Y original para a levitação
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = speed;

        // Novas propriedades
        this.life = initialLife;
        this.maxLife = initialLife; // Para controle, caso haja cura
        this.magic = initialMagic;
        this.maxMagic = initialMagic; // Para controle, caso haja recuperação de magia
        this.score = 0;

        // Propriedades para a animação de levitação
        this.levitationAmplitude = 5; // Altura máxima do movimento
        this.levitationSpeed = 0.05; // Velocidade da animação (quanto maior, mais rápido)
        this.levitationOffset = 0; // Para controlar a fase da animação
    }

    // Método para mover o jogador horizontalmente
    move(direction, canvasWidth) {
        if (direction === 'left') {
            this.x -= this.speed;
        } else if (direction === 'right') {
            this.x += this.speed;
        }

        // Limita o jogador dentro das bordas do canvas
        if (this.x - this.width / 2 < 0) {
            this.x = this.width / 2;
        }
        if (this.x + this.width / 2 > canvasWidth) {
            this.x = canvasWidth - this.width / 2;
        }
    }

    // Método para atualizar a animação de levitação
    updateLevitation() {
        // Usa uma função seno para criar um movimento suave de cima para baixo
        this.levitationOffset += this.levitationSpeed;
        this.y = this.baseY + Math.sin(this.levitationOffset) * this.levitationAmplitude;
    }

    // Método para desenhar o jogador
    draw(ctx) {
        ctx.fillStyle = this.color;
        // Desenha o retângulo do jogador na posição atualizada (com levitação)
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Opcional: Desenhar informações do player (vida, magia) para depuração
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(`Vida: ${this.life}/${this.maxLife}`, this.x - 30, this.y + this.height / 2 + 15);
        ctx.fillText(`Magia: ${this.magic}/${this.maxMagic}`, this.x - 30, this.y + this.height / 2 + 30);
    }

    // Exemplo de método para receber dano
    takeDamage(amount) {
        this.life -= amount;
        if (this.life < 0) {
            this.life = 0;
            // Lógica para Game Over
            console.log("Game Over!");
        }
    }

    // Exemplo de método para usar magia
    useMagic(amount) {
        if (this.magic >= amount) {
            this.magic -= amount;
            console.log(`Magia usada. Restante: ${this.magic}`);
            return true; // Magia usada com sucesso
        } else {
            console.log("Magia insuficiente!");
            return false; // Magia insuficiente
        }
    }

    // Exemplo de método para adicionar pontuação
    addScore(amount) {
        this.score += amount;
        console.log(`Pontuação: ${this.score}`);
    }
}
