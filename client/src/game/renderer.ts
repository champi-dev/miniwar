import { Player, Bullet, TerrainObject } from '../types/game.types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private camera = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
  }

  setCamera(x: number, y: number) {
    // Center camera on player
    this.camera.x = x - this.canvas.width / 2;
    this.camera.y = y - this.canvas.height / 2;
  }

  clear() {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderTerrain(terrain: TerrainObject[]) {
    terrain.forEach((obj) => {
      const screenX = obj.x - this.camera.x;
      const screenY = obj.y - this.camera.y;

      this.ctx.save();

      switch (obj.type) {
        case 'wall':
          this.ctx.fillStyle = '#4a4a4a';
          this.ctx.strokeStyle = '#2a2a2a';
          this.ctx.lineWidth = 2;
          this.ctx.fillRect(screenX, screenY, obj.width, obj.height);
          this.ctx.strokeRect(screenX, screenY, obj.width, obj.height);
          break;

        case 'crate':
          this.ctx.fillStyle = '#8b6f47';
          this.ctx.strokeStyle = '#6b4f27';
          this.ctx.lineWidth = 2;
          this.ctx.fillRect(screenX, screenY, obj.width, obj.height);
          this.ctx.strokeRect(screenX, screenY, obj.width, obj.height);
          // Draw X pattern on crate
          this.ctx.strokeStyle = '#6b4f27';
          this.ctx.beginPath();
          this.ctx.moveTo(screenX, screenY);
          this.ctx.lineTo(screenX + obj.width, screenY + obj.height);
          this.ctx.moveTo(screenX + obj.width, screenY);
          this.ctx.lineTo(screenX, screenY + obj.height);
          this.ctx.stroke();
          break;

        case 'bush':
          this.ctx.fillStyle = 'rgba(34, 139, 34, 0.6)';
          this.ctx.fillRect(screenX, screenY, obj.width, obj.height);
          break;
      }

      this.ctx.restore();
    });
  }

  renderPlayers(players: Player[], currentPlayerId: string | null) {
    players.forEach((player) => {
      if (!player.isAlive) return;

      const screenX = player.x - this.camera.x;
      const screenY = player.y - this.camera.y;
      const radius = 16;

      this.ctx.save();

      // Draw player body
      this.ctx.fillStyle = player.color;
      this.ctx.strokeStyle = player.id === currentPlayerId ? '#ffffff' : '#000000';
      this.ctx.lineWidth = player.id === currentPlayerId ? 3 : 2;

      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Draw weapon (line pointing in aim direction)
      const weaponLength = 20;
      const weaponX = screenX + Math.cos(player.angle) * weaponLength;
      const weaponY = screenY + Math.sin(player.angle) * weaponLength;

      this.ctx.strokeStyle = '#333333';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, screenY);
      this.ctx.lineTo(weaponX, weaponY);
      this.ctx.stroke();

      // Draw username
      this.ctx.fillStyle = '#ffffff';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 3;
      this.ctx.font = '14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      this.ctx.strokeText(player.username, screenX, screenY - radius - 10);
      this.ctx.fillText(player.username, screenX, screenY - radius - 10);

      // Draw health bar
      const healthBarWidth = radius * 2;
      const healthBarHeight = 4;
      const healthPercentage = player.health / player.maxHealth;

      this.ctx.fillStyle = '#333333';
      this.ctx.fillRect(
        screenX - healthBarWidth / 2,
        screenY - radius - 5,
        healthBarWidth,
        healthBarHeight
      );

      this.ctx.fillStyle = healthPercentage > 0.3 ? '#00ff00' : '#ff0000';
      this.ctx.fillRect(
        screenX - healthBarWidth / 2,
        screenY - radius - 5,
        healthBarWidth * healthPercentage,
        healthBarHeight
      );

      this.ctx.restore();
    });
  }

  renderBullets(bullets: Bullet[]) {
    bullets.forEach((bullet) => {
      const screenX = bullet.x - this.camera.x;
      const screenY = bullet.y - this.camera.y;

      this.ctx.save();

      // Draw bullet
      this.ctx.fillStyle = '#ffff00';
      this.ctx.strokeStyle = '#ff8800';
      this.ctx.lineWidth = 1;

      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Draw bullet trail
      const trailLength = 10;
      const trailX = screenX - Math.cos(bullet.angle) * trailLength;
      const trailY = screenY - Math.sin(bullet.angle) * trailLength;

      const gradient = this.ctx.createLinearGradient(screenX, screenY, trailX, trailY);
      gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');

      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, screenY);
      this.ctx.lineTo(trailX, trailY);
      this.ctx.stroke();

      this.ctx.restore();
    });
  }

  renderMinimap(
    players: Player[],
    currentPlayerId: string | null,
    worldSize: { width: number; height: number }
  ) {
    const minimapSize = 150;
    const minimapX = this.canvas.width - minimapSize - 20;
    const minimapY = 20;
    const scale = minimapSize / Math.max(worldSize.width, worldSize.height);

    this.ctx.save();

    // Draw minimap background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
    this.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

    // Draw players on minimap
    players.forEach((player) => {
      if (!player.isAlive) return;

      const mapX = minimapX + player.x * scale;
      const mapY = minimapY + player.y * scale;
      const dotSize = player.id === currentPlayerId ? 4 : 2;

      this.ctx.fillStyle = player.id === currentPlayerId ? '#ffffff' : player.color;
      this.ctx.beginPath();
      this.ctx.arc(mapX, mapY, dotSize, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  render(
    players: Player[],
    bullets: Bullet[],
    terrain: TerrainObject[],
    currentPlayerId: string | null,
    worldSize: { width: number; height: number }
  ) {
    // Update camera position
    const currentPlayer = players.find((p) => p.id === currentPlayerId);
    if (currentPlayer) {
      this.setCamera(currentPlayer.x, currentPlayer.y);
    }

    // Render everything
    this.clear();
    this.renderTerrain(terrain);
    this.renderBullets(bullets);
    this.renderPlayers(players, currentPlayerId);
    this.renderMinimap(players, currentPlayerId, worldSize);
  }
}
