import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ObjectEffects } from '../types';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform bool uHasMap;
  uniform sampler2D uAlphaMap;
  uniform bool uHasAlphaMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uBrightness;
  uniform float uContrast;
  uniform float uSaturation;
  uniform float uHue;
  uniform float uScanline;
  uniform float uTime;

  varying vec2 vUv;

  vec3 hueShift(vec3 color, float angle) {
    const vec3 k = vec3(0.57735);
    float c = cos(angle);
    float s = sin(angle);
    return color * c + cross(k, color) * s + k * dot(k, color) * (1.0 - c);
  }

  void main() {
    vec4 base = uHasMap ? texture2D(uMap, vUv) : vec4(uColor, 1.0);
    if (uHasMap) {
      base.rgb *= uColor;
    }

    vec3 color = base.rgb;
    color = (color - 0.5) * uContrast + 0.5;
    color *= uBrightness;
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, uSaturation);
    color = hueShift(color, radians(uHue));

    if (uScanline > 0.0) {
      float scan = 0.5 + 0.5 * sin(vUv.y * 700.0 + uTime * 6.0);
      color *= mix(1.0, scan, uScanline);
    }

    float alpha = base.a * uOpacity;
    if (uHasAlphaMap) {
      alpha *= texture2D(uAlphaMap, vUv).g;
    }
    if (alpha <= 0.001) {
      discard;
    }

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

export function ProjectionMaterial({
  map,
  alphaMap,
  color,
  effects,
  side = THREE.FrontSide,
}: {
  map: THREE.Texture | null;
  alphaMap: THREE.Texture | null;
  color: string;
  effects: ObjectEffects;
  side?: THREE.Side;
}) {
  const whiteTexture = useMemo(() => {
    const texture = new THREE.DataTexture(
      new Uint8Array([255, 255, 255, 255]),
      1,
      1,
    );
    texture.needsUpdate = true;
    return texture;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        side,
        uniforms: {
          uMap: { value: whiteTexture },
          uHasMap: { value: false },
          uAlphaMap: { value: whiteTexture },
          uHasAlphaMap: { value: false },
          uColor: { value: new THREE.Color('#ffffff') },
          uOpacity: { value: 1 },
          uBrightness: { value: 1 },
          uContrast: { value: 1 },
          uSaturation: { value: 1 },
          uHue: { value: 0 },
          uScanline: { value: 0 },
          uTime: { value: 0 },
        },
      }),
    // The material is intentionally created once and updated below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [whiteTexture],
  );

  useEffect(() => {
    return () => {
      material.dispose();
      whiteTexture.dispose();
    };
  }, [material, whiteTexture]);

  useEffect(() => {
    material.side = side;
    material.uniforms.uMap.value = map ?? whiteTexture;
    material.uniforms.uHasMap.value = Boolean(map);
    material.uniforms.uAlphaMap.value = alphaMap ?? whiteTexture;
    material.uniforms.uHasAlphaMap.value = Boolean(alphaMap);
    material.uniforms.uColor.value.set(color);
    material.uniforms.uOpacity.value = effects.opacity;
    material.uniforms.uBrightness.value = effects.brightness;
    material.uniforms.uContrast.value = effects.contrast;
    material.uniforms.uSaturation.value = effects.saturation;
    material.uniforms.uHue.value = effects.hue;
    material.uniforms.uScanline.value = effects.scanline;
    material.needsUpdate = true;
  }, [material, map, alphaMap, color, effects, side, whiteTexture]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
  });

  return <primitive object={material} attach="material" />;
}
