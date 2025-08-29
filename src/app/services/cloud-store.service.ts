import { Injectable } from '@angular/core';
import {Storage, ref, uploadBytes, getDownloadURL, deleteObject} from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class CloudStoreService {

  constructor(private storage: Storage) { }

  storeRecipeImage(file, recipeUUID) {

    const filePath = 'recipeImage_' + recipeUUID;
    const storageRef = ref(this.storage, filePath);
    return uploadBytes(storageRef, file);
  }

  getReferenceToUploadedFile(recipeUUID) {
    const filePath = 'recipeImage_' + recipeUUID;
    const fileRef = ref(this.storage, filePath);
    return getDownloadURL(fileRef);
  }

  removeImage(recipeUUID) {
    const filePath = 'recipeImage_' + recipeUUID;
    const fileRef = ref(this.storage, filePath);
    return deleteObject(fileRef);
  }

  // Image resizing functionality can be implemented later with modern web APIs
  // or by using browser-based image manipulation libraries
  resizeImage(fileURI: string) {
    // TODO: Implement image resizing using modern browser APIs
    console.log('Image resizing not yet implemented for web');
    return fileURI;
  }
  
  createThumbnail(fileURI: string) {
    // TODO: Implement thumbnail creation using modern browser APIs
    console.log('Thumbnail creation not yet implemented for web');
    return fileURI;
  }
}
