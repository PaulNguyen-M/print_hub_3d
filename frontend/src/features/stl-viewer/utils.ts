// STL Utilities for file handling and processing

export interface STLFileInfo {
  name: string;
  size: number;
  type: 'binary' | 'ascii';
  vertices: number;
  triangles: number;
}

/**
 * Validate if file is a valid STL file
 */
/** Kiểm tra file có phải STL hợp lệ (đuôi .stl + kích thước cho phép). */
export function isValidStlFile(file: File): boolean {
  if (!file.name.toLowerCase().endsWith('.stl')) {
    return false;
  }

  // Check file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    return false;
  }

  return true;
}

/**
 * Get STL file information
 */
export async function getStlFileInfo(file: File): Promise<STLFileInfo | null> {
  if (!isValidStlFile(file)) {
    return null;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const view = new DataView(arrayBuffer);
    const isASCII = isASCIISTL(arrayBuffer);

    let triangles = 0;
    let vertices = 0;

    if (!isASCII) {
      // Binary STL
      triangles = view.getUint32(80, true);
      vertices = triangles * 3;
    } else {
      // ASCII STL - count facets
      const text = new TextDecoder().decode(arrayBuffer);
      const facetMatches = text.match(/facet\s+normal/gi);
      triangles = facetMatches ? facetMatches.length : 0;
      vertices = triangles * 3;
    }

    return {
      name: file.name,
      size: file.size,
      type: isASCII ? 'ascii' : 'binary',
      vertices,
      triangles,
    };
  } catch (error) {
    console.error('Error reading STL file info:', error);
    return null;
  }
}

/**
 * Check if file is ASCII STL format
 */
function isASCIISTL(arrayBuffer: ArrayBuffer): boolean {
  const view = new Uint8Array(arrayBuffer);
  const header = new TextDecoder().decode(view.slice(0, 5));
  return header === 'solid';
}

/**
 * Format file size for display
 */
/** Đổi số byte sang chuỗi kích thước dễ đọc (KB/MB...). */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format number with separators
 */
/** Định dạng số có phân tách hàng nghìn. */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Create a download link for a file
 */
/** Tải một file từ URL về máy (tạo thẻ <a download> tạm). */
export function downloadFile(url: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Validate STL geometry (optional advanced validation)
 */
export async function validateStlGeometry(file: File): Promise<{
  valid: boolean;
  message: string;
  details?: {
    vertices: number;
    triangles: number;
  };
}> {
  const info = await getStlFileInfo(file);

  if (!info) {
    return {
      valid: false,
      message: 'Invalid STL file format',
    };
  }

  if (info.vertices === 0) {
    return {
      valid: false,
      message: 'STL file contains no geometry data',
    };
  }

  return {
    valid: true,
    message: 'STL file is valid',
    details: {
      vertices: info.vertices,
      triangles: info.triangles,
    },
  };
}
