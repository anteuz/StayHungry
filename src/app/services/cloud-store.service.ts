import { Injectable } from '@angular/core';
import {AngularFireStorage} from '@angular/fire/storage';
import {ImageResizer, ImageResizerOptions} from '@ionic-native/image-resizer/ngx';

@Injectable({
  providedIn: 'root'
})
export class CloudStoreService {

  constructor(private storage: AngularFireStorage, private imageResizer: ImageResizer) { }

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

  resizeImage(fileURI: string) {
    let _filePath;
    const options = {
      uri: fileURI,
      quality: 70,
      width: 1280,
      height: 1280
    } as ImageResizerOptions;

    this.imageResizer
        .resize(options)
        .then((filePath: string) => _filePath = filePath)
        .catch(e => console.log(e));

    return _filePath;
  }
  createThumbnail(fileURI: string) {
    let _filePath;
    const options = {
      uri: fileURI,
      quality: 50,
      width: 240,
      height: 240
    } as ImageResizerOptions;

    this.imageResizer
        .resize(options)
        .then((filePath: string) => _filePath = filePath)
        .catch(e => console.log(e));

    return _filePath;
  }
}
