import { useEffect, useState } from 'react';
import * as THREE from 'three';

export function useVideoTexture(url: string, playing: boolean): THREE.VideoTexture | null {
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null);

  useEffect(() => {
    const video = document.createElement('video');
    video.src = url;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.style.position = 'fixed';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    video.style.left = '-10px';
    video.style.top = '-10px';
    document.body.appendChild(video);
    video.load();

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    setTexture(videoTexture);

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
      videoTexture.dispose();
      setTexture(null);
    };
  }, [url]);

  useEffect(() => {
    if (!texture) {
      return;
    }
    const video = texture.image as HTMLVideoElement;
    if (playing) {
      void video.play().catch(() => {
        // Autoplay can be blocked until a user gesture. The output window
        // exposes a fullscreen/start control for that.
      });
    } else {
      video.pause();
    }
  }, [playing, texture]);

  return texture;
}
