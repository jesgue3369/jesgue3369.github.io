// js/scene.js

export class Scene {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Propriedades do céu (gradiente)
        this.skyColor1 = '#87CEEB'; // Azul claro
        this.skyColor2 = '#6495ED'; // Azul mais escuro

        // Propriedades do chão
        this.groundHeight = 50; // Altura do chão na parte inferior
        this.groundColor = '#228B22'; // Verde floresta
    }

    draw(ctx) {
        // Desenha o céu (gradiente)
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight - this.groundHeight);
        skyGradient.addColorStop(0, this.skyColor1);
        skyGradient.addColorStop(1, this.skyColor2);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight - this.groundHeight);

        // Desenha o chão
        ctx.fillStyle = this.groundColor;
        ctx.fillRect(0, this.canvasHeight - this.groundHeight, this.canvasWidth, this.groundHeight);

        // Opcional: Adicionar elementos mais detalhados ao cenário aqui
        // Por exemplo, árvores, nuvens, montanhas simples
        this.drawClouds(ctx);
        this.drawSun(ctx);
    }

    // Método opcional para desenhar nuvens simples
    drawClouds(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Branco semi-transparente

        // Nuvem 1
        ctx.beginPath();
        ctx.arc(100, 80, 30, 0, Math.PI * 2);
        ctx.arc(130, 80, 25, 0, Math.PI * 2);
        ctx.arc(115, 60, 20, 0, Math.PI * 2);
        ctx.fill();

        // Nuvem 2
        ctx.beginPath();
        ctx.arc(400, 120, 40, 0, Math.PI * 2);
        ctx.arc(440, 120, 35, 0, Math.PI * 2);
        ctx.arc(420, 100, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    // Método opcional para desenhar um sol simples
    drawSun(ctx) {
        ctx.fillStyle = '#FFD700'; // Amarelo dourado
        ctx.beginPath();
        ctx.arc(this.canvasWidth - 80, 80, 50, 0, Math.PI * 2);
        ctx.fill();
    }
}
