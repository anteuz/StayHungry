import { Injectable } from '@angular/core';
import {AngularFireStorage} from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class CloudStoreService {

  constructor(private storage: AngularFireStorage) { }

  storeRecipeImage(file, recipeUUID) {
    const filePath = 'recipeImage_' + recipeUUID;
    const task = this.storage.upload(filePath, file);
    return task;
  }
  getReferenceToUploadedFile(recipeUUID) {
    const filePath = 'recipeImage_' + recipeUUID;
    const fileRef = this.storage.ref(filePath);
    return fileRef;
  }
  removeImage(recipeUUID) {
    const filePath = 'recipeImage_' + recipeUUID;
    const fileRef = this.storage.ref(filePath).delete();
    return fileRef;
  }
}
