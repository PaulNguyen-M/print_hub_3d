import { type AxiosProgressEvent } from 'axios';
import apiClient from '../../api/axios';

export interface StlUploadMetadata {
  title?: string;
  description?: string;
  material?: string;
  color?: string;
}

export interface StlUploadResponse {
  uploadId: number;
  fileName: string;
  s3Url: string;
  s3Key: string;
  contentType: string;
  fileSize: number;
  sha256Checksum?: string;
  title?: string;
  description?: string;
  material?: string;
  color?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export async function uploadStlFile(
  file: File,
  metadata: StlUploadMetadata = {},
  onProgress?: (percent: number) => void
): Promise<StlUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.description) formData.append('description', metadata.description);
  if (metadata.material) formData.append('material', metadata.material);
  if (metadata.color) formData.append('color', metadata.color);

  const response = await apiClient.post<ApiResponse<StlUploadResponse>>(
    '/stl/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (!event.total) return;
        const progress = Math.round((event.loaded * 100) / event.total);
        onProgress?.(progress);
      },
    }
  );

  const result = response.data as ApiResponse<StlUploadResponse>;
  return result.data;
}
