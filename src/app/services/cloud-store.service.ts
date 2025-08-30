import { Injectable } from '@angular/core';
import {Storage, ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable} from '@angular/fire/storage';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CloudStoreService {

  constructor(
    private storage: Storage,
    private authService: AuthService
  ) { }

  private validateFileType(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return allowedTypes.includes(file.type);
  }

  private validateFileSize(file: File): boolean {
    // 10MB limit
    const maxSize = 10 * 1024 * 1024;
    return file.size <= maxSize;
  }

  async storeRecipeImage(file: File, recipeUUID: string) {
    if (!this.authService.isAuthenticated()) {
      throw new Error('User must be authenticated to upload images');
    }

    if (!file || !recipeUUID) {
      throw new Error('File and recipe UUID are required');
    }

    if (!this.validateFileType(file)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }

    if (!this.validateFileSize(file)) {
      throw new Error('File size must be less than 10MB');
    }

    const userUID = this.authService.getUserUID();
    const filePath = `users/${userUID}/recipes/${recipeUUID}/image`;
    const storageRef = ref(this.storage, filePath);
    
    // Add metadata for security rules
    const metadata = {
      contentType: file.type,
      customMetadata: {
        owner: userUID,
        recipeUUID: recipeUUID
      }
    };
    
    return uploadBytes(storageRef, file, metadata);
  }

  async getReferenceToUploadedFile(recipeUUID: string) {
    if (!this.authService.isAuthenticated()) {
      throw new Error('User must be authenticated to access images');
    }

    if (!recipeUUID) {
      throw new Error('Recipe UUID is required');
    }

    const userUID = this.authService.getUserUID();
    const filePath = `users/${userUID}/recipes/${recipeUUID}/image`;
    const fileRef = ref(this.storage, filePath);
    return getDownloadURL(fileRef);
  }

  async removeImage(recipeUUID: string) {
    if (!this.authService.isAuthenticated()) {
      throw new Error('User must be authenticated to delete images');
    }

    if (!recipeUUID) {
      throw new Error('Recipe UUID is required');
    }

    const userUID = this.authService.getUserUID();
    const filePath = `users/${userUID}/recipes/${recipeUUID}/image`;
    const fileRef = ref(this.storage, filePath);
    return deleteObject(fileRef);
  }

  // Image resizing functionality can be implemented later with modern web APIs
  // or by using browser-based image manipulation libraries
  resizeImage(fileURI: string): string {
    // TODO: Implement image resizing using modern browser APIs
    return fileURI;
  }
  
  createThumbnail(fileURI: string): string {
    // TODO: Implement thumbnail creation using modern browser APIs
    return fileURI;
  }
}
