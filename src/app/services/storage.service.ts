import { Injectable, inject } from '@angular/core';
import { getDownloadURL, ref, Storage, uploadBytes } from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage = inject(Storage);

  async uploadVocabularyImage(wordId: string, file: File): Promise<{ url: string; path: string }> {
    return this.upload(`vocabulary/${wordId}/image`, file);
  }

  async uploadVocabularyAudio(wordId: string, file: File): Promise<{ url: string; path: string }> {
    return this.upload(`vocabulary/${wordId}/audio`, file);
  }

  private async upload(path: string, file: File): Promise<{ url: string; path: string }> {
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file);
    return { url: await getDownloadURL(storageRef), path };
  }
}
