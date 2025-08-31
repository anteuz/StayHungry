import { Injectable } from '@angular/core';

export interface RecipeScrapingConfig {
  useStandalone: boolean;
  firebaseFunctionUrl?: string;
  corsProxyUrl?: string;
  timeoutMs: number;
  maxRetries: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeScrapingConfigService {
  private config: RecipeScrapingConfig = {
    useStandalone: true, // Default to standalone mode
    firebaseFunctionUrl: 'https://your-firebase-function-url.com/parseRecipe',
    corsProxyUrl: 'https://api.allorigins.win/raw?url=',
    timeoutMs: 30000, // 30 seconds
    maxRetries: 3
  };

  constructor() {
    this.loadConfig();
  }

  /**
   * Get current configuration
   */
  getConfig(): RecipeScrapingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RecipeScrapingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  /**
   * Check if standalone mode is enabled
   */
  isStandaloneMode(): boolean {
    return this.config.useStandalone;
  }

  /**
   * Enable standalone mode
   */
  enableStandaloneMode(): void {
    this.updateConfig({ useStandalone: true });
  }

  /**
   * Enable Firebase function mode
   */
  enableFirebaseMode(): void {
    this.updateConfig({ useStandalone: false });
  }

  /**
   * Get Firebase function URL
   */
  getFirebaseFunctionUrl(): string | undefined {
    return this.config.firebaseFunctionUrl;
  }

  /**
   * Get CORS proxy URL
   */
  getCorsProxyUrl(): string {
    return this.config.corsProxyUrl || 'https://api.allorigins.win/raw?url=';
  }

  /**
   * Get timeout in milliseconds
   */
  getTimeoutMs(): number {
    return this.config.timeoutMs;
  }

  /**
   * Get max retries
   */
  getMaxRetries(): number {
    return this.config.maxRetries;
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('recipeScrapingConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        this.config = { ...this.config, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load recipe scraping config:', error);
    }
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('recipeScrapingConfig', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save recipe scraping config:', error);
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.config = {
      useStandalone: true,
      firebaseFunctionUrl: 'https://your-firebase-function-url.com/parseRecipe',
      corsProxyUrl: 'https://api.allorigins.win/raw?url=',
      timeoutMs: 30000,
      maxRetries: 3
    };
    this.saveConfig();
  }

  /**
   * Get available CORS proxies
   */
  getAvailableCorsProxies(): string[] {
    return [
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://thingproxy.freeboard.io/fetch/',
      'https://api.codetabs.com/v1/proxy?quest='
    ];
  }

  /**
   * Test configuration
   */
  async testConfiguration(): Promise<{ success: boolean; message: string }> {
    if (this.config.useStandalone) {
      return this.testStandaloneMode();
    } else {
      return this.testFirebaseMode();
    }
  }

  /**
   * Test standalone mode
   */
  private async testStandaloneMode(): Promise<{ success: boolean; message: string }> {
    try {
      const testUrl = 'https://httpbin.org/html';
      const response = await fetch(this.getCorsProxyUrl() + encodeURIComponent(testUrl), {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Standalone mode is working correctly'
        };
      } else {
        return {
          success: false,
          message: `CORS proxy failed with status: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Standalone mode test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Test Firebase function mode
   */
  private async testFirebaseMode(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config.firebaseFunctionUrl) {
        return {
          success: false,
          message: 'Firebase function URL is not configured'
        };
      }

      const response = await fetch(this.config.firebaseFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: 'https://httpbin.org/html' })
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Firebase function mode is working correctly'
        };
      } else {
        return {
          success: false,
          message: `Firebase function failed with status: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Firebase function test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
