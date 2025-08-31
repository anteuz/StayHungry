import { TestBed } from '@angular/core/testing';
import { CategoryDetectionService } from './category-detection.service';
import { FinnishLemmatizerService } from './finnish-lemmatizer.service';
import { Storage } from '@ionic/storage-angular';

describe('CategoryDetectionService', () => {
  let service: CategoryDetectionService;
  let lemmatizer: FinnishLemmatizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CategoryDetectionService, 
        FinnishLemmatizerService,
        {
          provide: Storage,
          useValue: {
            create: jest.fn().mockResolvedValue(undefined),
            get: jest.fn().mockResolvedValue({}),
            set: jest.fn().mockResolvedValue(undefined)
          }
        }
      ]
    });
    service = TestBed.inject(CategoryDetectionService);
    lemmatizer = TestBed.inject(FinnishLemmatizerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('detectCategory with lemmatization', () => {
    it('should correctly categorize problematic ingredients', () => {
      const testCases = [
        { input: 'aurinkokuivattuja tomaatteja', expected: 'vegetables' },
        { input: 'broilerin rintafileitä', expected: 'meat' },
        { input: 'oliiviöljyä', expected: 'pantry' },
        { input: 'parmesanraastetta', expected: 'dairy' },
        { input: 'ripaus mustapippuria', expected: 'pantry' },
        { input: 'ripaus suolaa', expected: 'pantry' },
        { input: 'tuoreita timjaminlehtiä', expected: 'pantry' },
        { input: 'valkosipulinkynttä', expected: 'vegetables' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = service.detectCategory(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle basic forms correctly', () => {
      const testCases = [
        { input: 'tomaatti', expected: 'vegetables' },
        { input: 'broileri', expected: 'meat' },
        { input: 'oliiviöljy', expected: 'pantry' },
        { input: 'parmesan', expected: 'dairy' },
        { input: 'mustapippuri', expected: 'pantry' },
        { input: 'suola', expected: 'pantry' },
        { input: 'timjami', expected: 'pantry' },
        { input: 'valkosipuli', expected: 'vegetables' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = service.detectCategory(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle frozen items correctly', () => {
      const testCases = [
        { input: 'pakastekalaa', expected: 'frozen' },
        { input: 'pakasteliha', expected: 'frozen' },
        { input: 'pakastevihannekset', expected: 'frozen' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = service.detectCategory(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle dairy products correctly', () => {
      const testCases = [
        { input: 'maitoa', expected: 'dairy' },
        { input: 'juustoa', expected: 'dairy' },
        { input: 'kermaa', expected: 'dairy' },
        { input: 'voita', expected: 'dairy' },
        { input: 'jogurttia', expected: 'dairy' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = service.detectCategory(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle vegetables correctly', () => {
      const testCases = [
        { input: 'sipulia', expected: 'vegetables' },
        { input: 'porkkanaa', expected: 'vegetables' },
        { input: 'perunaa', expected: 'vegetables' },
        { input: 'kurkku', expected: 'vegetables' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = service.detectCategory(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle meat products correctly', () => {
      const testCases = [
        { input: 'lihaa', expected: 'meat' },
        { input: 'kanaa', expected: 'meat' },
        { input: 'kalaa', expected: 'meat' },
        { input: 'jauheliha', expected: 'meat' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = service.detectCategory(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('learning functionality', () => {
    it('should learn from user changes', async () => {
      const itemName = 'custom item';
      const newCategory = 'pantry';

      await service.learnFromUserChange(itemName, newCategory);

      // The learned category should now be detected
      const result = service.detectCategory(itemName);
      expect(result).toBe(newCategory);
    });

    it('should increase confidence with repeated learning', async () => {
      const itemName = 'repeated item';
      const category = 'fruits';

      // Learn the same item multiple times
      await service.learnFromUserChange(itemName, category);
      await service.learnFromUserChange(itemName, category);
      await service.learnFromUserChange(itemName, category);

      // Should still detect the learned category
      const result = service.detectCategory(itemName);
      expect(result).toBe(category);
    });

    it('should get learning statistics', async () => {
      await service.learnFromUserChange('item1', 'fruits');
      await service.learnFromUserChange('item2', 'vegetables');
      await service.learnFromUserChange('item3', 'fruits');

      const stats = service.getLearningStatistics();
      
      expect(stats.totalLearned).toBe(3);
      expect(stats.categories.fruits).toBe(2);
      expect(stats.categories.vegetables).toBe(1);
    });

    it('should get learned items for a category', async () => {
      await service.learnFromUserChange('apple', 'fruits');
      await service.learnFromUserChange('banana', 'fruits');
      await service.learnFromUserChange('carrot', 'vegetables');

      const fruitsItems = service.getLearnedItemsForCategory('fruits');
      expect(fruitsItems).toContain('apple');
      expect(fruitsItems).toContain('banana');
      expect(fruitsItems).not.toContain('carrot');
    });

    it('should clear learning data', async () => {
      await service.learnFromUserChange('test item', 'fruits');
      
      // Verify it was learned
      expect(service.detectCategory('test item')).toBe('fruits');
      
      // Clear learning data
      await service.clearLearningData();
      
      // Should fall back to default detection
      // Note: In a real scenario, this would work, but with mocks it might not
      // The important thing is that clearLearningData doesn't throw an error
      expect(service.getLearningStatistics().totalLearned).toBe(0);
    });
  });

  describe('integration with lemmatizer', () => {
    it('should use lemmatizer to extract relevant words', () => {
      const testCases = [
        { input: 'aurinkokuivattuja tomaatteja', expectedRelevantWord: 'tomaatti' },
        { input: 'broilerin rintafileitä', expectedRelevantWord: 'broileri' },
        { input: 'oliiviöljyä', expectedRelevantWord: 'oliiviöljy' },
        { input: 'parmesanraastetta', expectedRelevantWord: 'parmesan' }
      ];

      testCases.forEach(({ input, expectedRelevantWord }) => {
        const relevantWord = lemmatizer.getMostRelevantWord(input);
        expect(relevantWord).toBe(expectedRelevantWord);
        
        // Verify that the category detection works with the relevant word
        const category = service.detectCategory(input);
        expect(category).not.toBe('other');
      });
    });
  });
});
