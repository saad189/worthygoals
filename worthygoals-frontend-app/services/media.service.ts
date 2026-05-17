import ApiService from './api.service';

export interface UploadUrlResponse {
  uploadUrl: string;
  mediaId: string;
  s3Key: string;
}

export const mediaService = {
  requestUploadUrl: async (
    fileName: string,
    contentType: string,
    width?: number,
    height?: number,
  ): Promise<UploadUrlResponse> => {
    const { data } = await ApiService.post<UploadUrlResponse>('/media/upload-url', {
      fileName,
      contentType,
      width,
      height,
    });
    return data;
  },

  uploadToPresignedUrl: async (
    uploadUrl: string,
    imageUri: string,
    contentType: string,
  ): Promise<void> => {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });
  },
};
