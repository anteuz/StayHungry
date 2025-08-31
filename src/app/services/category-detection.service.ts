import { Injectable } from '@angular/core';
import { FinnishLemmatizerService } from './finnish-lemmatizer.service';
import { Storage } from '@ionic/storage-angular';

export interface CategoryKeywords {
  [category: string]: string[];
}

export interface UserLearningData {
  [itemName: string]: {
    category: string;
    timestamp: number;
    confidence: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CategoryDetectionService {
  
  private userLearningData: UserLearningData = {};
  private readonly LEARNING_STORAGE_KEY = 'category_learning_data';
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.7;
  private readonly MAX_LEARNING_ENTRIES = 1000; // Prevent unlimited growth
  
  constructor(
    private lemmatizer: FinnishLemmatizerService,
    private storage: Storage
  ) {
    this.initializeStorage();
  }

  private async initializeStorage() {
    await this.storage.create();
    await this.loadUserLearningData();
  }

  /**
   * Load user learning data from storage
   */
  private async loadUserLearningData(): Promise<void> {
    try {
      const data = await this.storage.get(this.LEARNING_STORAGE_KEY);
      this.userLearningData = data || {};
    } catch (error) {
      console.error('Failed to load user learning data:', error);
      this.userLearningData = {};
    }
  }

  /**
   * Save user learning data to storage
   */
  private async saveUserLearningData(): Promise<void> {
    try {
      await this.storage.set(this.LEARNING_STORAGE_KEY, this.userLearningData);
    } catch (error) {
      console.error('Failed to save user learning data:', error);
    }
  }

  /**
   * Learn from user category changes
   */
  async learnFromUserChange(itemName: string, newCategory: string): Promise<void> {
    if (!itemName || !newCategory) {
      return;
    }

    const normalizedName = itemName.toLowerCase().trim();
    const timestamp = Date.now();
    
    // Calculate confidence based on how many times this item has been categorized
    const existingEntry = this.userLearningData[normalizedName];
    const confidence = existingEntry ? Math.min(existingEntry.confidence + 0.1, 1.0) : 0.8;

    // Store the learning data
    this.userLearningData[normalizedName] = {
      category: newCategory,
      timestamp: timestamp,
      confidence: confidence
    };

    // Add to category keywords for future detection
    this.addCategoryKeywords(newCategory, [normalizedName]);

    // Clean up old entries if we exceed the limit
    await this.cleanupOldEntries();

    // Save to storage
    await this.saveUserLearningData();
  }

  /**
   * Clean up old learning entries to prevent unlimited growth
   */
  private async cleanupOldEntries(): Promise<void> {
    const entries = Object.entries(this.userLearningData);
    if (entries.length <= this.MAX_LEARNING_ENTRIES) {
      return;
    }

    // Sort by timestamp and remove oldest entries
    const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const entriesToKeep = sortedEntries.slice(-this.MAX_LEARNING_ENTRIES);
    
    // Convert back to object
    this.userLearningData = {};
    entriesToKeep.forEach(([key, value]) => {
      this.userLearningData[key] = value;
    });
  }

  /**
   * Get learned category for an item
   */
  private getLearnedCategory(itemName: string): string | null {
    const normalizedName = itemName.toLowerCase().trim();
    const entry = this.userLearningData[normalizedName];
    
    if (entry && entry.confidence >= this.MIN_CONFIDENCE_THRESHOLD) {
      return entry.category;
    }
    
    return null;
  }
  
  // Comprehensive Finnish grocery categories based on S-kaupat.fi
  private readonly CATEGORY_KEYWORDS: CategoryKeywords = {
    // Fruits and berries
    'fruits': [
      'omena', 'banaani', 'appelsiini', 'mandariini', 'lime', 'greippi', 'ananas', 
      'mango', 'kiivi', 'persikka', 'nektariini', 'aprikoosi', 'luumu', 'kirsikka', 'viinirypäle',
      'mansikka', 'vadelma', 'mustikka', 'puolukka', 'karviainen', 'lakka', 'mesimarja', 'karpalo',
      'katajanmarja', 'tyrnimarja', 'pihlajanmarja', 'kataja', 'tyrni', 'pihlaja', 'marja',
      'hedelmä'
    ],

    // Vegetables and greens
    'vegetables': [
      'tomaatti', 'kurkku', 'salaatti', 'porkkana', 'peruna', 'sipuli', 'valkosipuli', 'keltasipuli',
      'punasipuli', 'lohisipuli', 'purjo', 'selleri', 'pasternakka', 'nauris', 'lanttu', 'kaali',
      'kukkakaali', 'parsakaali', 'broccoli', 'kale', 'pinaatti', 'lehtsalaatti', 'jääsalaatti', 
      'ruukinsalaatti', 'endivi', 'radicchio', 'rucola', 'vihannes', 'kasvis'
    ],

    // Dairy products
    'dairy': [
      'maito', 'juusto', 'kerma', 'voi', 'jogurtti', 'kermaviili', 'crème fraîche', 'rahka',
      'tuorejuusto', 'oivariini', 'margariini', 'kermajuusto', 'emmental', 'edam', 'gouda',
      'cheddar', 'brie', 'camembert', 'feta', 'mozzarella', 'parmesan', 'pecorino', 'ricotta',
      'cottage', 'quark', 'skyr', 'fil', 'kefir', 'piimä', 'maitotuote'
    ],

    // Meat and fish
    'meat': [
      'liha', 'kana', 'kala', 'jauheliha', 'nakki', 'makkara', 'kananmuna', 'paistileikkeet',
      'pihvi', 'kylmäsavustettu', 'lämmin savustettu', 'kinkku', 'pekoni', 'salami', 'mortadella',
      'prosciutto', 'parma', 'serrano', 'chorizo', 'pepperoni', 'bologna', 'leberkäse',
      'pastrami', 'corned beef', 'roast beef', 'turkey', 'kalkkuna', 'ankka', 'hanhi',
      'porsas', 'sika', 'nauta', 'härkä', 'lehmä', 'lammas', 'vuohi', 'hirvi', 'peura', 'jänis',
      'broileri', 'lohi', 'silli', 'ahven', 'kuha', 'hauki', 'särki', 'lahna', 'muikku', 'siika', 
      'kirjolohi', 'taimen', 'nieriä', 'harjus', 'kivenkala', 'turska', 'seiti', 'kummeliturska', 
      'punakampela', 'kampela', 'meriantura', 'katkarapu', 'rapu', 'hummeri', 'simpukka', 
      'sinisimpukka', 'ostronki', 'merenelävä', 'merenelävät'
    ],

    // Grains and bread
    'grains': [
      'leipä', 'riisi', 'pasta', 'murot', 'hiutaleet', 'spagetti', 'penne', 'fettuccine',
      'linguine', 'tagliatelle', 'ravioli', 'tortellini', 'lasagne', 'cannelloni', 'gnocchi',
      'couscous', 'bulgur', 'quinoa', 'amarantti', 'teff', 'hirssi', 'tattari', 'ruis',
      'ohra', 'kaura', 'vehnä', 'ruisleipä', 'vehnäleipä', 'sämpylä', 'pulla', 'korppu'
    ],

    // Pantry items
    'pantry': [
      'öljy', 'maustaminen', 'kastike', 'suola', 'pippuri', 'mustapippuri', 'timjami', 'basilika', 'oregano', 'kaneli', 
      'sitruunankuor', 'kardemumma', 'neilikka', 'muskot', 'sahrami', 'vanilja', 'vaniljasokeri', 'sokeri', 
      'kastanjasokeri', 'fruktoosi', 'glukoosi', 'hunaja', 'siirappi', 'vaahtera', 'agave', 'stevia', 
      'aspartaami', 'sukraloosi', 'sorbitoli', 'ksylitoli', 'erytritoli', 'oliiviöljy', 'rypsiöljy', 
      'auringonkukkaöljy', 'soijaöljy', 'kookosöljy', 'avokadoöljy', 'seesamiöljy', 'pähkinäöljy', 'soija', 
      'teriyaki', 'worcestershire', 'tabasco', 'sriracha', 'ketsuppi', 'sinappi', 'majoneesi', 'aioli', 
      'tahini', 'hummus', 'guacamole', 'salsa', 'pesto', 'chimichurri', 'kumina', 'kurkuma', 'inkivääri',
      'chili', 'paprika', 'jalapeno', 'habanero', 'persilja', 'tilli', 'rosmariini', 'majuri'
    ],

    // Frozen foods
    'frozen': [
      'pakaste', 'jäädytetty', 'lehtitaikinalevy', 'jäätelö', 'pakastevihannekset', 'pakastehedelmät',
      'pakastekala', 'pakasteliha', 'pakastepizza', 'pakasteleipä', 'pakastekakkuja',
      'pakasteleivonnaiset', 'pakastepasta', 'pakasteriisi', 'pakasteperunat', 'pakastepihvit',
      'pakastenakit', 'pakastemakkara', 'pakastekana', 'pakastekalkkuna', 'pakasteankka',
      'pakastehanhi', 'pakasteporsas', 'pakastesika', 'pakastenauta', 'pakastehärkä',
      'pakastelehmä', 'pakastelammas', 'pakastevuohi', 'pakastehirvi', 'pakastepeura',
      'pakastejänis', 'pakastelohi', 'pakastesilli', 'pakasteahven', 'pakastekuha', 'pakastehauki',
      'pakastesärki', 'pakastelahna', 'pakastemuikku', 'pakastesiiika', 'pakastekirjolohi',
      'pakastetaimen', 'pakastenieriä', 'pakasteharjus', 'pakastekivenkala', 'pakasteturska',
      'pakasteseiti', 'pakastekummeliturska', 'pakastepunakampela', 'pakastekampela',
      'pakastemeriantura', 'pakastekatkarapu', 'pakasterapu', 'pakastehummeri', 'pakastesimpukka',
      'pakastesinisimpukka', 'pakasteostronki', 'pakastemerenelävä', 'pakastemerenelävät'
    ]
  };

  /**
   * Detect category for a given ingredient name
   */
  detectCategory(itemName: string): string {
    if (!itemName || typeof itemName !== 'string') {
      return 'other';
    }

    const lowerName = itemName.toLowerCase().trim();
    
    // First, check if we have learned this item from user behavior
    const learnedCategory = this.getLearnedCategory(itemName);
    if (learnedCategory) {
      return learnedCategory;
    }
    
    // Check for frozen items first (highest priority)
    if (this.matchesCategory(lowerName, 'frozen')) {
      return 'frozen';
    }

    // Get the most relevant word for category detection
    const relevantWord = this.lemmatizer.getMostRelevantWord(itemName);
    
    // Check other categories with lemmatized word
    for (const [category, keywords] of Object.entries(this.CATEGORY_KEYWORDS)) {
      if (category !== 'frozen' && this.matchesCategory(relevantWord, category)) {
        return category;
      }
    }

    // If no match found with lemmatized word, try original text
    for (const [category, keywords] of Object.entries(this.CATEGORY_KEYWORDS)) {
      if (category !== 'frozen' && this.matchesCategory(lowerName, category)) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Check if item name matches any keywords in a category
   */
  private matchesCategory(itemName: string, category: string): boolean {
    const keywords = this.CATEGORY_KEYWORDS[category];
    if (!keywords) {
      return false;
    }

    return keywords.some(keyword => {
      // Check for word match with flexible boundaries for Finnish
      // Match word start, end, or complete word
      const wordPattern = new RegExp(`\\b${keyword}\\b|\\b${keyword}|${keyword}\\b`, 'i');
      return wordPattern.test(itemName);
    });
  }

  /**
   * Get all keywords for a specific category
   */
  getCategoryKeywords(category: string): string[] {
    return this.CATEGORY_KEYWORDS[category] || [];
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): string[] {
    return Object.keys(this.CATEGORY_KEYWORDS);
  }

  /**
   * Add custom keywords to a category
   */
  addCategoryKeywords(category: string, keywords: string[]): void {
    if (!this.CATEGORY_KEYWORDS[category]) {
      this.CATEGORY_KEYWORDS[category] = [];
    }
    // Add only unique keywords
    keywords.forEach(keyword => {
      if (!this.CATEGORY_KEYWORDS[category].includes(keyword)) {
        this.CATEGORY_KEYWORDS[category].push(keyword);
      }
    });
  }

  /**
   * Get learning statistics
   */
  getLearningStatistics(): { totalLearned: number; categories: { [category: string]: number } } {
    const categories: { [category: string]: number } = {};
    let totalLearned = 0;

    Object.values(this.userLearningData).forEach(entry => {
      if (entry.confidence >= this.MIN_CONFIDENCE_THRESHOLD) {
        totalLearned++;
        categories[entry.category] = (categories[entry.category] || 0) + 1;
      }
    });

    return { totalLearned, categories };
  }

  /**
   * Clear all learning data
   */
  async clearLearningData(): Promise<void> {
    this.userLearningData = {};
    await this.saveUserLearningData();
  }

  /**
   * Get learned items for a specific category
   */
  getLearnedItemsForCategory(category: string): string[] {
    return Object.entries(this.userLearningData)
      .filter(([_, entry]) => entry.category === category && entry.confidence >= this.MIN_CONFIDENCE_THRESHOLD)
      .map(([itemName, _]) => itemName);
  }
}
