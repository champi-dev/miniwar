export interface InputState {
  keys: Set<string>;
  mouse: {
    x: number;
    y: number;
    isDown: boolean;
  };
}

export class InputManager {
  private inputState: InputState = {
    keys: new Set(),
    mouse: { x: 0, y: 0, isDown: false }
  };

  initialize(canvas: HTMLCanvasElement): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.inputState.keys.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.inputState.keys.delete(e.key.toLowerCase());
    });

    // Mouse events
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.inputState.mouse.x = e.clientX - rect.left;
      this.inputState.mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.inputState.mouse.isDown = true;
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.inputState.mouse.isDown = false;
      }
    });

    // Prevent context menu
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  getInputState(): InputState {
    return this.inputState;
  }

  isKeyDown(key: string): boolean {
    return this.inputState.keys.has(key.toLowerCase());
  }

  getMovementVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.isKeyDown('w')) y -= 1;
    if (this.isKeyDown('s')) y += 1;
    if (this.isKeyDown('a')) x -= 1;
    if (this.isKeyDown('d')) x += 1;

    return { x, y };
  }

  getMousePosition(): { x: number; y: number } {
    return { x: this.inputState.mouse.x, y: this.inputState.mouse.y };
  }

  isMouseDown(): boolean {
    return this.inputState.mouse.isDown;
  }

  reset(): void {
    this.inputState.keys.clear();
    this.inputState.mouse.isDown = false;
  }
}

export const inputManager = new InputManager();
