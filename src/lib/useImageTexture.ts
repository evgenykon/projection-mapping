import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { resolveImageSource } from './assets';

export function useImageTexture(url: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let ownedUrl: string | null = null;
    let loadedTexture: THREE.Texture | null = null;

    setTexture(null);
    if (!url) {
      return;
    }

    resolveImageSource(url)
      .then((result) => {
        if (cancelled) {
          if (result.owned) {
            URL.revokeObjectURL(result.src);
          }
          return;
        }
        if (result.owned) {
          ownedUrl = result.src;
        }
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
          result.src,
          (loaded) => {
            if (cancelled) {
              loaded.dispose();
              return;
            }
            loaded.colorSpace = THREE.SRGBColorSpace;
            loaded.minFilter = THREE.LinearFilter;
            loaded.magFilter = THREE.LinearFilter;
            loadedTexture = loaded;
            setTexture(loaded);
          },
          undefined,
          () => {
            if (!cancelled) {
              setTexture(null);
            }
          },
        );
      })
      .catch(() => {
        if (!cancelled) {
          setTexture(null);
        }
      });

    return () => {
      cancelled = true;
      loadedTexture?.dispose();
      if (ownedUrl) {
        URL.revokeObjectURL(ownedUrl);
      }
    };
  }, [url]);

  return texture;
}
