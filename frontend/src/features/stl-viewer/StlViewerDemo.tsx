import { useState, useRef, useMemo } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Upload } from 'lucide-react';
import { StlViewer, StlViewerProvider } from './index';
import { useStlUpload } from './useStlUpload';
import type { StlUploadResponse } from './stlUploadService';

const StlViewerDemo = () => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<StlUploadResponse | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const metadata = useMemo(
    () => ({ title, description, material, color }),
    [title, description, material, color]
  );

  const { uploadFile, uploadProgress, isUploading } = useStlUpload({
    maxFileSize: 50 * 1024 * 1024,
    getMetadata: () => metadata,
    // Preview comes from the local blob (set in selectFile); upload only records metadata.
    onSuccess: (_file, _url, data) => {
      setUploadInfo(data ?? null);
    },
    onError: (error) => {
      console.error('Upload error:', error);
    },
  });

  /** Preview the exact local file immediately (reliable), then upload in background. */
  const selectFile = (file: File) => {
    setFileName(file.name);
    setFileUrl(URL.createObjectURL(file));
    void uploadFile(file);
  };

  const handleReset = () => {
    setFileUrl(null);
    setFileName(null);
    setUploadInfo(null);
    setTitle('');
    setDescription('');
    setMaterial('');
    setColor('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (fileUrl && fileName) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.click();
    }
  };

  const handleBrowseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) selectFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };

  return (
    <StlViewerProvider>
      <div className="flex flex-col h-screen w-full bg-gray-900">
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 shadow-lg">
          <h1 className="text-2xl font-bold text-white mb-2">STL Viewer</h1>
          <p className="text-gray-400 text-sm">Upload an STL model, preview it, and store metadata to S3.</p>
        </div>

        <div className="flex-1 flex gap-4 p-4">
          <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700">
            <StlViewer url={fileUrl || undefined} fileName={fileName || undefined} onDownload={handleDownload} />
          </div>

          <div className="w-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Upload STL File</h2>

                <div className="space-y-3">
                  <div className="grid gap-3">
                    <label className="text-sm text-gray-300">Model Title</label>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Enter a model title"
                      className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />

                    <label className="text-sm text-gray-300">Description</label>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Optional description"
                      rows={3}
                      className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-300">Material</label>
                        <input
                          value={material}
                          onChange={(event) => setMaterial(event.target.value)}
                          placeholder="PLA, ABS, etc."
                          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-300">Color</label>
                        <input
                          value={color}
                          onChange={(event) => setColor(event.target.value)}
                          placeholder="E.g. Black"
                          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-gray-300 text-sm mb-2">Drag and drop your STL file here</p>
                    <p className="text-gray-500 text-xs mb-4">or</p>
                    <button
                      type="button"
                      onClick={handleBrowseFile}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Browse Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".stl"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="h-3 rounded-full bg-gray-700 overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-right text-xs text-gray-400">
                    {isUploading ? 'Uploading…' : 'Upload progress'}: {uploadProgress}%
                  </p>
                </div>

                {fileName && (
                  <div className="mt-4 bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold">Loaded:</span> {fileName}
                    </p>
                    {uploadInfo && (
                      <div className="mt-2 text-xs text-gray-400 space-y-1">
                        <p>Uploaded at: {new Date(uploadInfo.uploadedAt).toLocaleString()}</p>
                        <p>Size: {(uploadInfo.fileSize / 1024).toFixed(1)} KB</p>
                        <p>Storage URL:</p>
                        <a
                          href={uploadInfo.s3Url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-300 underline break-all"
                        >
                          {uploadInfo.s3Url}
                        </a>
                      </div>
                    )}
                    <button
                      onClick={handleReset}
                      className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-700">
                <h3 className="text-sm font-semibold text-white mb-3">Feature Summary</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">✓</span>
                    <span>Upload validation for STL and max file size</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">✓</span>
                    <span>Drag-and-drop and browse support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">✓</span>
                    <span>Upload progress bar</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">✓</span>
                    <span>Backend metadata storage</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">✓</span>
                    <span>Remote S3 model storage</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StlViewerProvider>
  );
};

export default StlViewerDemo;
