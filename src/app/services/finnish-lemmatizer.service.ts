import { Injectable } from '@angular/core';

export interface LemmatizationResult {
  originalWord: string;
  basicForm: string;
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinnishLemmatizerService {
  
  // Finnish inflection patterns for common grocery items
  private readonly INFLECTION_PATTERNS = {
    // Partitive case endings (-a, -ä, -ta, -tä, -tta, -ttä)
    partitive: [
      { pattern: /([aeiouyäö])(a|ä)$/, replacement: '$1' },
      { pattern: /([bcdfghjklmnpqrstvwxz])(ta|tä)$/, replacement: '$1' },
      { pattern: /([bcdfghjklmnpqrstvwxz])(tta|ttä)$/, replacement: '$1' }
    ],
    
    // Genitive case endings (-n, -en, -in, -den, -tten)
    genitive: [
      { pattern: /([aeiouyäö])n$/, replacement: '$1' },
      { pattern: /([bcdfghjklmnpqrstvwxz])en$/, replacement: '$1' },
      { pattern: /([bcdfghjklmnpqrstvwxz])in$/, replacement: '$1' },
      { pattern: /([bcdfghjklmnpqrstvwxz])den$/, replacement: '$1' },
      { pattern: /([bcdfghjklmnpqrstvwxz])tten$/, replacement: '$1' }
    ],
    
    // Plural endings (-t, -et, -at, -ät, -it, -ut, -yt, -ot, -öt)
    plural: [
      { pattern: /([aeiouyäö])t$/, replacement: '$1' },
      { pattern: /([bcdfghjklmnpqrstvwxz])et$/, replacement: '$1' },
      { pattern: /([aeiouyäö])at$/, replacement: '$1a' },
      { pattern: /([aeiouyäö])ät$/, replacement: '$1ä' },
      { pattern: /([aeiouyäö])it$/, replacement: '$1i' },
      { pattern: /([aeiouyäö])ut$/, replacement: '$1u' },
      { pattern: /([aeiouyäö])yt$/, replacement: '$1y' },
      { pattern: /([aeiouyäö])ot$/, replacement: '$1o' },
      { pattern: /([aeiouyäö])öt$/, replacement: '$1ö' }
    ],
    
    // Comparative and superlative forms
    comparison: [
      { pattern: /([aeiouyäö])mpi$/, replacement: '$1' },
      { pattern: /([aeiouyäö])in$/, replacement: '$1' }
    ],
    
    // Verb forms (present participle, past participle)
    verb: [
      { pattern: /([aeiouyäö])va$/, replacement: '$1' },
      { pattern: /([aeiouyäö])vä$/, replacement: '$1' },
      { pattern: /([aeiouyäö])tu$/, replacement: '$1' },
      { pattern: /([aeiouyäö])ty$/, replacement: '$1' },
      { pattern: /([aeiouyäö])ttu$/, replacement: '$1' },
      { pattern: /([aeiouyäö])tty$/, replacement: '$1' }
    ]
  };

  // Common compound word patterns for grocery items
  private readonly COMPOUND_PATTERNS = [
    // Compound words with common grocery prefixes/suffixes
    { pattern: /^aurinko(.+)/, base: '$1' },
    { pattern: /^tuore(.+)/, base: '$1' },
    { pattern: /^pakaste(.+)/, base: '$1' },
    { pattern: /^kylmä(.+)/, base: '$1' },
    { pattern: /^lämmin(.+)/, base: '$1' },
    { pattern: /^kuiva(.+)/, base: '$1' },
    { pattern: /^hienonnet(.+)/, base: '$1' },
    { pattern: /^raastet(.+)/, base: '$1' },
    { pattern: /^paahdet(.+)/, base: '$1' },
    { pattern: /^kypsennet(.+)/, base: '$1' },
    { pattern: /^savustet(.+)/, base: '$1' },
    { pattern: /^suolat(.+)/, base: '$1' },
    { pattern: /^maustet(.+)/, base: '$1' },
    { pattern: /^konservoi(.+)/, base: '$1' },
    { pattern: /^ripaus(.+)/, base: '$1' },
    { pattern: /^kuppi(.+)/, base: '$1' },
    { pattern: /^pala(.+)/, base: '$1' },
    { pattern: /^viipale(.+)/, base: '$1' },
    { pattern: /^purkki(.+)/, base: '$1' },
    { pattern: /^pussi(.+)/, base: '$1' },
    { pattern: /^pakkaus(.+)/, base: '$1' },
    { pattern: /^rinta(.+)/, base: '$1' },
    { pattern: /^filee(.+)/, base: '$1' },
    { pattern: /^lehti(.+)/, base: '$1' },
    { pattern: /^kynsi(.+)/, base: '$1' }
  ];

  // Special cases for common grocery items
  private readonly SPECIAL_CASES: { [key: string]: string } = {
    'tomaatteja': 'tomaatti',
    'tomaattia': 'tomaatti',
    'tomaatit': 'tomaatti',
    'broilerin': 'broileri',
    'broileria': 'broileri',
    'broilerit': 'broileri',
    'oliiviöljyä': 'oliiviöljy',
    'oliiviöljy': 'oliiviöljy',
    'parmesanraastetta': 'parmesan',
    'parmesanraaste': 'parmesan',
    'mustapippuria': 'mustapippuri',
    'mustapippuri': 'mustapippuri',
    'suolaa': 'suola',
    'suola': 'suola',
    'timjaminlehtiä': 'timjami',
    'timjaminlehti': 'timjami',
    'timjami': 'timjami',
    'valkosipulinkynttä': 'valkosipuli',
    'valkosipulinkynsi': 'valkosipuli',
    'valkosipuli': 'valkosipuli',
    'sipulia': 'sipuli',
    'sipulit': 'sipuli',
    'sipuli': 'sipuli',
    'maitoa': 'maito',
    'maito': 'maito',
    'juustoa': 'juusto',
    'juusto': 'juusto',
    'kermaa': 'kerma',
    'kerma': 'kerma',
    'voita': 'voi',
    'voi': 'voi',
    'jogurttia': 'jogurtti',
    'jogurtti': 'jogurtti',
    'kermaviiliä': 'kermaviili',
    'kermaviili': 'kermaviili',
    'rahkaa': 'rahka',
    'rahka': 'rahka',
    'tuorejuustoa': 'tuorejuusto',
    'tuorejuusto': 'tuorejuusto',
    'oivariinia': 'oivariini',
    'oivariini': 'oivariini',
    'margariinia': 'margariini',
    'margariini': 'margariini',
    'kermajuustoa': 'kermajuusto',
    'kermajuusto': 'kermajuusto',
    'emmentalia': 'emmental',
    'emmental': 'emmental',
    'edamia': 'edam',
    'edam': 'edam',
    'goudaa': 'gouda',
    'gouda': 'gouda',
    'cheddaria': 'cheddar',
    'cheddar': 'cheddar',
    'brieä': 'brie',
    'brie': 'brie',
    'camembertia': 'camembert',
    'camembert': 'camembert',
    'fetaa': 'feta',
    'feta': 'feta',
    'mozzarellaa': 'mozzarella',
    'mozzarella': 'mozzarella',
    'pecorinoa': 'pecorino',
    'pecorino': 'pecorino',
    'ricottaa': 'ricotta',
    'ricotta': 'ricotta',
    'cottagea': 'cottage',
    'cottage': 'cottage',
    'quarkia': 'quark',
    'quark': 'quark',
    'skyria': 'skyr',
    'skyr': 'skyr',
    'filiä': 'fil',
    'fil': 'fil',
    'kefiriä': 'kefir',
    'kefir': 'kefir',
    'piimää': 'piimä',
    'piimä': 'piimä',
    'maitotuotteita': 'maitotuote',
    'maitotuote': 'maitotuote',
    // Additional special cases for the problematic ingredients
    'aurinkokuivattuja': 'tomaatti',
    'rintafileitä': 'fileitä',
    'fileitä': 'fileitä',
    'kuivattuja': 'kuivattuja',
    'tuoreita': 'tuoreita',
    'lehtiä': 'lehtiä',
    // Grains
    'leipää': 'leipä',
    'riisiä': 'riisi',
    'pastaa': 'pasta',
    'muroja': 'murot',
    // Fruits
    'omenaa': 'omena',
    'banaania': 'banaani',
    'appelsiinia': 'appelsiini',
    'mansikoita': 'mansikka'
  };

  /**
   * Lemmatize a single word to its basic form
   */
  lemmatizeWord(word: string): LemmatizationResult {
    if (!word || typeof word !== 'string') {
      return { originalWord: word, basicForm: word, confidence: 0 };
    }

    const lowerWord = word.toLowerCase().trim();
    
    // Check special cases first (highest confidence)
    if (this.SPECIAL_CASES[lowerWord]) {
      return {
        originalWord: word,
        basicForm: this.SPECIAL_CASES[lowerWord],
        confidence: 1.0
      };
    }

    // Try compound word patterns
    for (const pattern of this.COMPOUND_PATTERNS) {
      const match = lowerWord.match(pattern.pattern);
      if (match) {
        const baseForm = match[0].replace(pattern.pattern, pattern.base);
        return {
          originalWord: word,
          basicForm: baseForm,
          confidence: 0.8
        };
      }
    }

    // Try inflection patterns
    let lemmatized = lowerWord;
    let confidence = 0.5;

    // Apply inflection patterns in order of specificity
    for (const [inflectionType, patterns] of Object.entries(this.INFLECTION_PATTERNS)) {
      for (const { pattern, replacement } of patterns) {
        if (pattern.test(lemmatized)) {
          lemmatized = lemmatized.replace(pattern, replacement);
          confidence += 0.1;
          break; // Only apply one pattern per inflection type
        }
      }
    }

    // Cap confidence at 0.9 for inflection-based lemmatization
    confidence = Math.min(confidence, 0.9);

    return {
      originalWord: word,
      basicForm: lemmatized,
      confidence
    };
  }

  /**
   * Lemmatize a phrase or sentence by processing each word
   */
  lemmatizePhrase(phrase: string): string {
    if (!phrase || typeof phrase !== 'string') {
      return phrase;
    }

    // Split into words and process each one
    const words = phrase.split(/\s+/);
    const lemmatizedWords = words.map(word => {
      const result = this.lemmatizeWord(word);
      return result.basicForm;
    });

    return lemmatizedWords.join(' ');
  }

  /**
   * Extract key words from a phrase for category detection
   * This removes common words and focuses on the main ingredients
   */
  extractKeyWords(phrase: string): string[] {
    if (!phrase || typeof phrase !== 'string') {
      return [];
    }

    // Common Finnish words to filter out
    const stopWords = [
      'ja', 'tai', 'sekä', 'myös', 'lisäksi', 'lisäten', 'mukaan', 'mukana',
      'ripaus', 'kuppi', 'pala', 'viipale', 'purkki', 'pussi', 'pakkaus',
      'tuore', 'pakaste', 'kylmä', 'lämmin', 'kuiva', 'aurinko',
      'hienonnettu', 'raastettu', 'paahdettu', 'kypsennetty', 'savustettu',
      'suolattu', 'maustettu', 'konservoitu', 'lehti', 'kynsi', 'rinta', 'filee',
      'kuivattuja', 'tuoreita', 'lehtiä', 'fileitä'
    ];

    const lemmatized = this.lemmatizePhrase(phrase);
    const words = lemmatized.split(/\s+/);
    
    return words.filter(word => 
      word.length > 2 && 
      !stopWords.includes(word.toLowerCase())
    ).filter((word, index, array) => array.indexOf(word) === index); // Remove duplicates
  }

  /**
   * Get the most relevant word for category detection
   */
  getMostRelevantWord(phrase: string): string {
    const keyWords = this.extractKeyWords(phrase);
    
    if (keyWords.length === 0) {
      return this.lemmatizePhrase(phrase);
    }
    
    // Return the longest word as it's likely the most specific
    return keyWords.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }
}
