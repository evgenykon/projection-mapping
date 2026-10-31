import type { Quad, Vec2 } from '../types';

const IDENTITY_MATRIX3D =
  'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)';

export function computeHomography(
  source: Vec2[],
  destination: Vec2[],
): number[] | null {
  if (source.length !== 4 || destination.length !== 4) {
    return null;
  }

  const matrix: number[][] = [];
  const vector: number[] = [];

  for (let index = 0; index < 4; index += 1) {
    const [x, y] = source[index];
    const [targetX, targetY] = destination[index];
    matrix.push([x, y, 1, 0, 0, 0, -x * targetX, -y * targetX]);
    vector.push(targetX);
    matrix.push([0, 0, 0, x, y, 1, -x * targetY, -y * targetY]);
    vector.push(targetY);
  }

  const size = 8;
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) {
        pivot = row;
      }
    }
    if (Math.abs(matrix[pivot][column]) < 1e-12) {
      return null;
    }
    if (pivot !== column) {
      [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
      [vector[column], vector[pivot]] = [vector[pivot], vector[column]];
    }
    const divisor = matrix[column][column];
    for (let item = column; item < size; item += 1) {
      matrix[column][item] /= divisor;
    }
    vector[column] /= divisor;

    for (let row = 0; row < size; row += 1) {
      if (row === column) {
        continue;
      }
      const factor = matrix[row][column];
      if (Math.abs(factor) < 1e-15) {
        continue;
      }
      for (let item = column; item < size; item += 1) {
        matrix[row][item] -= factor * matrix[column][item];
      }
      vector[row] -= factor * vector[column];
    }
  }

  const [h11, h12, h13, h21, h22, h23, h31, h32] = vector;
  return [h11, h12, h13, h21, h22, h23, h31, h32, 1];
}

export function quadToCssMatrix(
  quad: Quad,
  width: number,
  height: number,
): string {
  if (width <= 0 || height <= 0) {
    return IDENTITY_MATRIX3D;
  }
  const source: Vec2[] = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
  const destination: Vec2[] = quad.map(([x, y]) => [x * width, y * height]);
  const homography = computeHomography(source, destination);
  if (!homography) {
    return IDENTITY_MATRIX3D;
  }
  const [h11, h12, h13, h21, h22, h23, h31, h32, h33] = homography;
  return `matrix3d(${h11}, ${h21}, 0, ${h31}, ${h12}, ${h22}, 0, ${h32}, 0, 0, 1, 0, ${h13}, ${h23}, 0, ${h33})`;
}
