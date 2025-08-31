import { TestBed } from '@angular/core/testing';
import { CategoryDetectionService } from './category-detection.service';
import { FinnishLemmatizerService } from './finnish-lemmatizer.service';

describe('Category Detection with Lemmatization Integration', () => {
  let categoryDetection: CategoryDetectionService;
  let lemmatizer: FinnishLemmatizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CategoryDetectionService,
        FinnishLemmatizerService
      ]
    });
    categoryDetection = TestBed.inject(CategoryDetectionService);
    lemmatizer = TestBed.inject(FinnishLemmatizerService);
  });

  it('should correctly categorize the original problematic ingredients', () => {
    const problematicIngredients = [
      'aurinkokuivattuja tomaatteja',
      'broilerin rintafileitä',
      'oliiviöljyä',
      'parmesanraastetta',
      'ripaus mustapippuria',
      'ripaus suolaa',
      'tuoreita timjaminlehtiä',
      'valkosipulinkynttä'
    ];

    const expectedCategories = [
      'vegetables',  // aurinkokuivattuja tomaatteja -> tomaatti
      'meat',        // broilerin rintafileitä -> broileri
      'pantry',      // oliiviöljyä -> oliiviöljy
      'dairy',       // parmesanraastetta -> parmesan
      'pantry',      // ripaus mustapippuria -> mustapippuri
      'pantry',      // ripaus suolaa -> suola
      'pantry',      // tuoreita timjaminlehtiä -> timjami
      'vegetables'   // valkosipulinkynttä -> valkosipuli
    ];

    problematicIngredients.forEach((ingredient, index) => {
      const category = categoryDetection.detectCategory(ingredient);
      expect(category).toBe(expectedCategories[index]);
    });
  });



  it('should extract relevant words correctly for category detection', () => {
    const testCases = [
      {
        ingredient: 'aurinkokuivattuja tomaatteja',
        expectedRelevantWord: 'tomaatti',
        expectedCategory: 'vegetables'
      },
      {
        ingredient: 'broilerin rintafileitä',
        expectedRelevantWord: 'broileri',
        expectedCategory: 'meat'
      },
      {
        ingredient: 'oliiviöljyä',
        expectedRelevantWord: 'oliiviöljy',
        expectedCategory: 'pantry'
      },
      {
        ingredient: 'parmesanraastetta',
        expectedRelevantWord: 'parmesan',
        expectedCategory: 'dairy'
      },
      {
        ingredient: 'ripaus mustapippuria',
        expectedRelevantWord: 'mustapippuri',
        expectedCategory: 'pantry'
      },
      {
        ingredient: 'ripaus suolaa',
        expectedRelevantWord: 'suola',
        expectedCategory: 'pantry'
      },
      {
        ingredient: 'tuoreita timjaminlehtiä',
        expectedRelevantWord: 'timjami',
        expectedCategory: 'pantry'
      },
      {
        ingredient: 'valkosipulinkynttä',
        expectedRelevantWord: 'valkosipuli',
        expectedCategory: 'vegetables'
      }
    ];

    testCases.forEach(({ ingredient, expectedRelevantWord, expectedCategory }) => {
      // Test lemmatizer
      const relevantWord = lemmatizer.getMostRelevantWord(ingredient);
      expect(relevantWord).toBe(expectedRelevantWord);

      // Test category detection
      const category = categoryDetection.detectCategory(ingredient);
      expect(category).toBe(expectedCategory);


    });
  });

  it('should handle both inflected and basic forms correctly', () => {
    const pairs = [
      { inflected: 'tomaatteja', basic: 'tomaatti', category: 'vegetables' },
      { inflected: 'broilerin', basic: 'broileri', category: 'meat' },
      { inflected: 'oliiviöljyä', basic: 'oliiviöljy', category: 'pantry' },
      { inflected: 'parmesanraastetta', basic: 'parmesan', category: 'dairy' },
      { inflected: 'mustapippuria', basic: 'mustapippuri', category: 'pantry' },
      { inflected: 'suolaa', basic: 'suola', category: 'pantry' },
      { inflected: 'timjaminlehtiä', basic: 'timjami', category: 'pantry' },
      { inflected: 'valkosipulinkynttä', basic: 'valkosipuli', category: 'vegetables' }
    ];

    pairs.forEach(({ inflected, basic, category }) => {
      // Both forms should result in the same category
      const inflectedCategory = categoryDetection.detectCategory(inflected);
      const basicCategory = categoryDetection.detectCategory(basic);
      
      expect(inflectedCategory).toBe(category);
      expect(basicCategory).toBe(category);
      expect(inflectedCategory).toBe(basicCategory);
    });
  });
});
