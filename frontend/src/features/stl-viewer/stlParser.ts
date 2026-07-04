import * as THREE from 'three';

/**
 * Robust STL parser shared by all viewers. Handles binary + ASCII, is
 * case-insensitive, never allocates a giant array from a corrupt face count,
 * and tries both formats so files with a "solid" binary header or an ASCII
 * file lacking proper normals still load.
 */

/** Parse a binary STL. Face count is clamped to what fits in the buffer. */
function parseBinaryStl(dv: DataView, declaredFaces: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const fitFaces = Math.max(0, Math.floor((dv.byteLength - 84) / 50));
  const faces = Math.min(declaredFaces, fitFaces);
  const vertices = new Float32Array(faces * 9);
  const normals = new Float32Array(faces * 9);

  let offset = 84;
  let vi = 0;
  for (let i = 0; i < faces; i++) {
    const nx = dv.getFloat32(offset, true); offset += 4;
    const ny = dv.getFloat32(offset, true); offset += 4;
    const nz = dv.getFloat32(offset, true); offset += 4;
    for (let j = 0; j < 3; j++) {
      vertices[vi] = dv.getFloat32(offset, true); offset += 4;
      vertices[vi + 1] = dv.getFloat32(offset, true); offset += 4;
      vertices[vi + 2] = dv.getFloat32(offset, true); offset += 4;
      normals[vi] = nx; normals[vi + 1] = ny; normals[vi + 2] = nz;
      vi += 3;
    }
    offset += 2; // attribute byte count
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return geometry;
}

/** Parse an ASCII STL: extract every `vertex x y z`, regardless of normals/case. */
function parseAsciiStl(data: string): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const num = '([-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?)';
  const vertexPattern = new RegExp(`vertex\\s+${num}\\s+${num}\\s+${num}`, 'gi');
  const vertices: number[] = [];

  let m: RegExpExecArray | null;
  while ((m = vertexPattern.exec(data)) !== null) {
    vertices.push(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  if (vertices.length > 0) geometry.computeVertexNormals();
  return geometry;
}

const hasData = (g: THREE.BufferGeometry) => (g.getAttribute('position')?.count ?? 0) > 0;

/** Decide ASCII vs binary and parse; tries both and uses whichever yields data. */
export function parseStl(buffer: ArrayBuffer): THREE.BufferGeometry {
  if (buffer.byteLength >= 84) {
    const dv = new DataView(buffer);
    const faces = dv.getUint32(80, true);

    // Exact binary size → definitely binary
    if (buffer.byteLength === 84 + faces * 50) {
      const g = parseBinaryStl(dv, faces);
      if (hasData(g)) return g;
    }

    // Try ASCII text
    const ascii = parseAsciiStl(new TextDecoder('utf-8').decode(buffer));
    if (hasData(ascii)) return ascii;

    // Fall back to binary if the declared face count plausibly fits the buffer
    if (faces > 0 && 84 + faces * 50 <= buffer.byteLength + 2) {
      const bin = parseBinaryStl(dv, faces);
      if (hasData(bin)) return bin;
    }
    return ascii; // empty → caller surfaces a friendly error
  }

  return parseAsciiStl(new TextDecoder('utf-8').decode(buffer));
}
