import ApiService from './api.service';

export interface UploadUrlResponse {
  uploadUrl: string;
  mediaId: string;
  s3Key: string;
}

/**
 * Upload a local image through the presign path and return its media id.
 *
 * The byte size is read first because the backend signs it into the URL as
 * Content-Length — storage rejects a body of any other size. The PUT's status
 * is checked: a failed upload used to resolve normally, and the post then
 * went out pointing at an object that did not exist.
 */
export async function uploadImage(
  uri: string,
  fileName: string,
  width?: number,
  height?: number,
): Promise<string> {
  const contentType = 'image/jpeg';
  const blob = await (await fetch(uri)).blob();

  const { data } = await ApiService.post<UploadUrlResponse>('/media/upload-url', {
    fileName,
    contentType,
    byteSize: blob.size,
    width,
    height,
  });

  const put = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!put.ok) throw new Error(`Upload failed with HTTP ${put.status}`);

  return data.mediaId;
}
