import { useCallback, useState } from 'react';
import { useStlViewer } from './hook/useStlViewer';
import { uploadStlFile, type StlUploadMetadata, type StlUploadResponse } from './stlUploadService';

export interface UseStlUploadOptions {
  maxFileSize?: number; // in bytes, default 50MB
  onSuccess?: (fileName: string, fileUrl: string, data?: StlUploadResponse) => void;
  onError?: (error: string) => void;
  getMetadata?: () => StlUploadMetadata;
}

export function useStlUpload(options: UseStlUploadOptions = {}) {
  const { maxFileSize = 50 * 1024 * 1024, onSuccess, onError, getMetadata } = options;
  const { setLoading, setError, setFileName } = useStlViewer();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File): Promise<StlUploadResponse | null> => {
      if (!file.name.toLowerCase().endsWith('.stl')) {
        const error = 'Please select a valid STL file';
        setError(error);
        onError?.(error);
        return null;
      }

      if (file.size > maxFileSize) {
        const error = `File size exceeds ${(maxFileSize / 1024 / 1024).toFixed(0)}MB limit`;
        setError(error);
        onError?.(error);
        return null;
      }

      try {
        setLoading(true);
        setFileName(file.name);
        setUploadProgress(0);
        setIsUploading(true);

        const metadata = getMetadata?.() ?? {};
        const uploadResponse = await uploadStlFile(file, metadata, (progress) => {
          setUploadProgress(progress);
        });

        setLoading(false);
        setIsUploading(false);
        setUploadProgress(100);
        onSuccess?.(file.name, uploadResponse.s3Url, uploadResponse);

        return uploadResponse;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to upload file';
        setError(error);
        onError?.(error);
        setLoading(false);
        setIsUploading(false);
        return null;
      }
    },
    [maxFileSize, setLoading, setError, setFileName, onSuccess, onError, getMetadata]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleDragDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const file = event.dataTransfer.files?.[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  return {
    uploadFile,
    handleFileSelect,
    handleDragDrop,
    uploadProgress,
    isUploading,
  };
}
