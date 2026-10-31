import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const WIDTH = 1920;
const HEIGHT = 1080;

function drawPattern(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const columns = 16;
  const rows = 9;
  const cellW = WIDTH / columns;
  const cellH = HEIGHT / rows;

  ctx.strokeStyle = 'rgba(0, 255, 180, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 1; i < columns; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * cellW, 0);
    ctx.lineTo(i * cellW, HEIGHT);
    ctx.stroke();
  }
  for (let i = 1; i < rows; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, i * cellH);
    ctx.lineTo(WIDTH, i * cellH);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(0, 255, 180, 0.9)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.moveTo(0, HEIGHT / 2);
  ctx.lineTo(WIDTH, HEIGHT / 2);
  ctx.stroke();

  const corner = 90;
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#ffd166';
  const corners = [
    [0, 0, 1, 1],
    [WIDTH, 0, -1, 1],
    [WIDTH, HEIGHT, -1, -1],
    [0, HEIGHT, 1, -1],
  ] as const;
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * corner);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * corner, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(0, 255, 180, 0.8)';
  ctx.font = '600 26px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('PROJECTOR CALIBRATION', WIDTH / 2, 28);
  ctx.textBaseline = 'bottom';
  ctx.fillText('1920 × 1080', WIDTH / 2, HEIGHT - 28);
}

export function CalibrationPattern() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    drawPattern(canvas);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.minFilter = THREE.LinearFilter;
    result.magFilter = THREE.LinearFilter;
    return result;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, 1.35, -2.995]}>
      <planeGeometry args={[2.4, 1.35]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
