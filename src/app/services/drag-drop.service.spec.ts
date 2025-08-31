import { TestBed } from '@angular/core/testing';
import { DragDropService, DragItem, DropZone } from './drag-drop.service';

describe('DragDropService', () => {
  let service: DragDropService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DragDropService]
    });
    service = TestBed.inject(DragDropService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('drag operations', () => {
    it('should start drag correctly', () => {
      const mockIngredient = { id: '1', name: 'Test Item' };
      const sourceCategory = 'fruits';
      const sourceIndex = 0;

      service.startDrag(mockIngredient, sourceCategory, sourceIndex);

      expect(service.isCurrentlyDragging()).toBe(true);
      
      const currentDragItem = service.getCurrentDragItem();
      expect(currentDragItem).toBeTruthy();
      expect(currentDragItem?.ingredient).toEqual(mockIngredient);
      expect(currentDragItem?.sourceCategory).toBe(sourceCategory);
      expect(currentDragItem?.sourceIndex).toBe(sourceIndex);
    });

    it('should stop drag correctly', () => {
      const mockIngredient = { id: '1', name: 'Test Item' };
      service.startDrag(mockIngredient, 'fruits', 0);

      service.stopDrag();

      expect(service.isCurrentlyDragging()).toBe(false);
      expect(service.getCurrentDragItem()).toBeNull();
    });

    it('should track drag state correctly', () => {
      expect(service.isCurrentlyDragging()).toBe(false);
      
      service.startDrag({ id: '1' }, 'fruits', 0);
      expect(service.isCurrentlyDragging()).toBe(true);
      
      service.stopDrag();
      expect(service.isCurrentlyDragging()).toBe(false);
    });
  });

  describe('drop zones', () => {
    it('should register and unregister drop zones', () => {
      const mockElement = document.createElement('div');
      mockElement.dataset.category = 'fruits';

      service.registerDropZone('fruits', mockElement);
      expect(service.getDropZones()).toHaveLength(1);
      expect(service.getDropZones()[0].category).toBe('fruits');

      service.unregisterDropZone('fruits');
      expect(service.getDropZones()).toHaveLength(0);
    });

    it('should validate drop targets correctly', () => {
      const mockElement = document.createElement('div');
      mockElement.dataset.category = 'fruits';

      service.registerDropZone('fruits', mockElement);

      expect(service.isValidDropTarget(mockElement)).toBe(true);

      const invalidElement = document.createElement('div');
      expect(service.isValidDropTarget(invalidElement)).toBe(false);
    });

    it('should get category from drop target', () => {
      const mockElement = document.createElement('div');
      mockElement.dataset.category = 'vegetables';

      expect(service.getCategoryFromDropTarget(mockElement)).toBe('vegetables');

      const elementWithoutCategory = document.createElement('div');
      expect(service.getCategoryFromDropTarget(elementWithoutCategory)).toBeNull();
    });
  });

  describe('observable behavior', () => {
    it('should emit drag item changes', (done) => {
      const mockIngredient = { id: '1', name: 'Test Item' };
      
      service.dragItem$.subscribe(dragItem => {
        if (dragItem) {
          expect(dragItem.ingredient).toEqual(mockIngredient);
          expect(dragItem.sourceCategory).toBe('fruits');
          done();
        }
      });

      service.startDrag(mockIngredient, 'fruits', 0);
    });

    it('should emit null when drag stops', (done) => {
      const mockIngredient = { id: '1', name: 'Test Item' };
      let emissionCount = 0;
      
      service.dragItem$.subscribe(dragItem => {
        emissionCount++;
        if (emissionCount === 1) {
          // First emission is the initial null value from BehaviorSubject
          expect(dragItem).toBeNull();
        } else if (emissionCount === 2) {
          // Second emission is when drag starts
          expect(dragItem).toBeTruthy();
        } else if (emissionCount === 3) {
          // Third emission is when drag stops
          expect(dragItem).toBeNull();
          done();
        }
      });

      service.startDrag(mockIngredient, 'fruits', 0);
      service.stopDrag();
    });
  });
});
