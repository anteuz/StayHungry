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
    timeoutMs: 45000, // 45 seconds
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
      timeoutMs: 45000,
      maxRetries: 3
    };
    this.saveConfig();
  }

  /**
   * Get available CORS proxies (updated list)
   */
  getAvailableCorsProxies(): string[] {
    return [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
      'https://cors-anywhere.herokuapp.com/',
      'https://thingproxy.freeboard.io/fetch/',
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://cors.bridged.cc/',
      'https://cors-anywhere.herokuapp.com/'
    ];
  }

  /**
   * Test configuration with improved error handling
   */
  async testConfiguration(): Promise<{ success: boolean; message: string }> {
    if (this.config.useStandalone) {
      return this.testStandaloneMode();
    } else {
      return this.testFirebaseMode();
    }
  }

  /**
   * Test standalone mode with multiple proxies
   */
  private async testStandaloneMode(): Promise<{ success: boolean; message: string }> {
    const testUrl = 'https://httpbin.org/html';
    const proxies = this.getAvailableCorsProxies();
    
    for (let i = 0; i < proxies.length; i++) {
      const proxy = proxies[i];
      
      try {
        const proxyUrl = proxy === 'https://corsproxy.io/?' ? 
          `${proxy}${encodeURIComponent(testUrl)}` : 
          `${proxy}${testUrl}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return {
            success: true,
            message: `Standalone mode is working correctly with proxy: ${proxy}`
          };
        }
      } catch (error) {
        console.warn(`Proxy ${proxy} failed:`, error);
        continue;
      }
    }

    return {
      success: false,
      message: 'All CORS proxies failed. Consider using Firebase function mode.'
    };
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(this.config.firebaseFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: 'https://httpbin.org/html' }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
