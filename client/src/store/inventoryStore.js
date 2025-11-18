import { create } from 'zustand';
import { BlockType } from '../engine/Block';

const useInventoryStore = create((set, get) => ({
  // Inventory counts for each block type
  inventory: {
    [BlockType.GRASS]: 0,
    [BlockType.DIRT]: 0,
    [BlockType.STONE]: 0,
    [BlockType.WOOD]: 0,
    [BlockType.LEAVES]: 0,
    [BlockType.SAND]: 0,
    [BlockType.SNOW]: 0,
  },

  // Hotbar setup (5 slots mapping to block types)
  hotbar: [
    BlockType.GRASS,
    BlockType.DIRT,
    BlockType.STONE,
    BlockType.WOOD,
    BlockType.SAND
  ],

  // Currently selected hotbar slot (0-4)
  selectedSlot: 0,

  // ===== INVENTORY ACTIONS =====

  /**
   * Add item to inventory
   */
  addItem: (blockType, count = 1) => set((state) => {
    if (blockType === BlockType.AIR) return state; // Can't collect air

    const newInventory = { ...state.inventory };
    newInventory[blockType] = (newInventory[blockType] || 0) + count;
    return { inventory: newInventory };
  }),

  /**
   * Remove item from inventory
   */
  removeItem: (blockType, count = 1) => set((state) => {
    const newInventory = { ...state.inventory };
    if (newInventory[blockType]) {
      newInventory[blockType] = Math.max(0, newInventory[blockType] - count);
    }
    return { inventory: newInventory };
  }),

  /**
   * Get count of a specific item
   */
  getItemCount: (blockType) => {
    return get().inventory[blockType] || 0;
  },

  // ===== HOTBAR ACTIONS =====

  /**
   * Select a hotbar slot (0-4)
   */
  selectSlot: (slotIndex) => set({ selectedSlot: Math.max(0, Math.min(4, slotIndex)) }),

  /**
   * Get the currently selected block type from hotbar
   */
  getSelectedBlockType: () => {
    const { hotbar, selectedSlot } = get();
    return hotbar[selectedSlot];
  },

  /**
   * Check if player has at least one of the selected block type
   */
  hasSelectedBlock: () => {
    const blockType = get().getSelectedBlockType();
    if (!blockType) return false;
    return (get().inventory[blockType] || 0) > 0;
  },

  /**
   * Set hotbar slot to a specific block type
   */
  setHotbarSlot: (slotIndex, blockType) => set((state) => {
    const newHotbar = [...state.hotbar];
    newHotbar[slotIndex] = blockType;
    return { hotbar: newHotbar };
  }),

  // ===== UTILITY ACTIONS =====

  /**
   * Reset inventory
   */
  reset: () => set({
    inventory: {
      [BlockType.GRASS]: 0,
      [BlockType.DIRT]: 0,
      [BlockType.STONE]: 0,
      [BlockType.WOOD]: 0,
      [BlockType.LEAVES]: 0,
      [BlockType.SAND]: 0,
      [BlockType.SNOW]: 0,
    },
    selectedSlot: 0
  }),

  /**
   * Give player some starter blocks for testing
   */
  giveStarterBlocks: () => set({
    inventory: {
      [BlockType.GRASS]: 64,
      [BlockType.DIRT]: 64,
      [BlockType.STONE]: 64,
      [BlockType.WOOD]: 32,
      [BlockType.SAND]: 32,
    }
  })
}));

export default useInventoryStore;
