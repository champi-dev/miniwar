/**
 * UsernameService - Handles username persistence based on IP address
 * This allows users to have their username remembered across sessions
 */
export class UsernameService {
  private ipToUsername: Map<string, string> = new Map();

  /**
   * Save a username for a specific IP address
   */
  saveUsername(ipAddress: string, username: string): void {
    this.ipToUsername.set(ipAddress, username);
  }

  /**
   * Get the saved username for an IP address
   * Returns null if no username is saved
   */
  getUsername(ipAddress: string): string | null {
    return this.ipToUsername.get(ipAddress) || null;
  }

  /**
   * Remove a username for an IP address
   */
  removeUsername(ipAddress: string): void {
    this.ipToUsername.delete(ipAddress);
  }

  /**
   * Get all stored usernames (for debugging)
   */
  getAllUsernames(): Map<string, string> {
    return new Map(this.ipToUsername);
  }

  /**
   * Clear all stored usernames
   */
  clear(): void {
    this.ipToUsername.clear();
  }
}

// Singleton instance
export const usernameService = new UsernameService();
