import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Vec2 } from '../types';

const SIZE = 1024;

export function useMaskTexture(
  mask: Vec2[] | null | undefined,
): THREE.CanvasTexture | null {
  const texture = useMemo(() => {
    if (!mask || mask.length < 3) {
      return null;
    }
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    mask.forEach(([u, v], index) => {
      const x = u * SIZE;
      const y = (1 - v) * SIZE;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fill();

    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.NoColorSpace;
    result.minFilter = THREE.LinearFilter;
    result.magFilter = THREE.LinearFilter;
    return result;
  }, [mask]);

  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}
