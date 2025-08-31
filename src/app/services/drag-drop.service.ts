import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DragItem {
  ingredient: any;
  sourceCategory: string;
  sourceIndex: number;
}

export interface DropZone {
  category: string;
  element: HTMLElement;
}

@Injectable({
  providedIn: 'root'
})
export class DragDropService {
  private dragItemSubject = new BehaviorSubject<DragItem | null>(null);
  public dragItem$ = this.dragItemSubject.asObservable();

  private dropZones: Map<string, DropZone> = new Map();
  private isDragging = false;

  constructor() {}

  /**
   * Start dragging an item
   */
  startDrag(ingredient: any, sourceCategory: string, sourceIndex: number): void {
    this.isDragging = true;
    this.dragItemSubject.next({
      ingredient,
      sourceCategory,
      sourceIndex
    });
  }

  /**
   * Stop dragging
   */
  stopDrag(): void {
    this.isDragging = false;
    this.dragItemSubject.next(null);
  }

  /**
   * Get current drag item
   */
  getCurrentDragItem(): DragItem | null {
    return this.dragItemSubject.value;
  }

  /**
   * Check if currently dragging
   */
  isCurrentlyDragging(): boolean {
    return this.isDragging;
  }

  /**
   * Register a drop zone
   */
  registerDropZone(category: string, element: HTMLElement): void {
    this.dropZones.set(category, { category, element });
  }

  /**
   * Unregister a drop zone
   */
  unregisterDropZone(category: string): void {
    this.dropZones.delete(category);
  }

  /**
   * Get all registered drop zones
   */
  getDropZones(): DropZone[] {
    return Array.from(this.dropZones.values());
  }

  /**
   * Check if an element is a valid drop target
   */
  isValidDropTarget(element: HTMLElement): boolean {
    return this.dropZones.has(element.dataset.category || '');
  }

  /**
   * Get category from drop target element
   */
  getCategoryFromDropTarget(element: HTMLElement): string | null {
    return element.dataset.category || null;
  }
}
