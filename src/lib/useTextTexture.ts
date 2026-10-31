import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { TextStyle } from '../types';

export function useTextTexture(
  text: TextStyle,
  aspect: number,
): THREE.CanvasTexture {
  const texture = useMemo(() => {
    const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
    const width = 1600;
    const height = Math.max(256, Math.round(width / safeAspect));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      if (!text.transparent) {
        ctx.fillStyle = text.background;
        ctx.fillRect(0, 0, width, height);
      }
      const fontSize = (height * text.size) / 100;
      ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
      ctx.fillStyle = text.color;
      ctx.textBaseline = 'middle';
      ctx.textAlign =
        text.align === 'left' ? 'left' : text.align === 'right' ? 'right' : 'center';
      const x =
        text.align === 'left'
          ? width * 0.06
          : text.align === 'right'
            ? width * 0.94
            : width / 2;
      const lines = text.text.split('\n');
      const lineHeight = fontSize * 1.15;
      const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, index) => {
        ctx.fillText(line, x, startY + index * lineHeight);
      });
    }

    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.minFilter = THREE.LinearFilter;
    result.magFilter = THREE.LinearFilter;
    return result;
  }, [text.text, text.color, text.size, text.background, text.transparent, text.align, aspect]);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}
