/**
 * ExternalBlob - wrapper for blob storage operations
 * Provides getDirectURL() for displaying blobs (images, videos)
 * and upload support with progress tracking.
 */
export class ExternalBlob {
  private _url: string | null = null;
  private _bytes: Uint8Array | null = null;
  private _onProgress: ((percentage: number) => void) | null = null;

  private constructor() {}

  static fromURL(url: string): ExternalBlob {
    const blob = new ExternalBlob();
    blob._url = url;
    return blob;
  }

  static fromBytes(bytes: Uint8Array): ExternalBlob {
    const blob = new ExternalBlob();
    blob._bytes = bytes;
    return blob;
  }

  withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob {
    const clone = new ExternalBlob();
    clone._url = this._url;
    clone._bytes = this._bytes;
    clone._onProgress = onProgress;
    return clone;
  }

  getDirectURL(): string {
    if (this._url) return this._url;
    if (this._bytes) {
      // Create an object URL from bytes
      const blob = new Blob([this._bytes.buffer as ArrayBuffer], {
        type: "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      this._url = url;
      return url;
    }
    return "";
  }

  async getBytes(): Promise<Uint8Array> {
    if (this._bytes) return this._bytes;
    if (this._url) {
      const response = await fetch(this._url);
      const buffer = await response.arrayBuffer();
      this._bytes = new Uint8Array(buffer);
      return this._bytes;
    }
    return new Uint8Array(0);
  }
}
