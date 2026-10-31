import type {
  Keyframe,
  ObjectEffects,
  SceneObject,
  Scenario,
  Vec3,
} from '../types';

export function getActiveScenario(
  scenarios: Scenario[],
  activeScenarioId: string,
): Scenario | null {
  return scenarios.find((scenario) => scenario.id === activeScenarioId) ?? null;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function easeInOut(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function lerpEffects(
  a: ObjectEffects,
  b: ObjectEffects,
  t: number,
): ObjectEffects {
  return {
    opacity: lerp(a.opacity, b.opacity, t),
    brightness: lerp(a.brightness, b.brightness, t),
    contrast: lerp(a.contrast, b.contrast, t),
    saturation: lerp(a.saturation, b.saturation, t),
    hue: lerp(a.hue, b.hue, t),
    scanline: lerp(a.scanline, b.scanline, t),
  };
}

function findPair(
  track: Keyframe[],
  time: number,
): { a: Keyframe; b: Keyframe; t: number } | null {
  if (track.length === 0) {
    return null;
  }
  if (time <= track[0].time) {
    return { a: track[0], b: track[0], t: 0 };
  }
  const last = track[track.length - 1];
  if (time >= last.time) {
    return { a: last, b: last, t: 0 };
  }
  for (let index = 0; index < track.length - 1; index += 1) {
    const a = track[index];
    const b = track[index + 1];
    if (time >= a.time && time <= b.time) {
      const span = b.time - a.time;
      return {
        a,
        b,
        t: span <= 0 ? 0 : easeInOut((time - a.time) / span),
      };
    }
  }
  return { a: last, b: last, t: 0 };
}

export function applyScenario(
  objects: SceneObject[],
  scenario: Scenario | null,
  time: number,
): SceneObject[] {
  if (!scenario) {
    return objects;
  }
  return objects.map((object) => {
    const track = scenario.tracks[object.id];
    if (!track || track.length === 0) {
      return object;
    }
    const pair = findPair(track, time);
    if (!pair) {
      return object;
    }
    const { a, b, t } = pair;
    return {
      ...object,
      position: lerpVec3(a.values.position, b.values.position, t),
      rotation: lerpVec3(a.values.rotation, b.values.rotation, t),
      scale: lerpVec3(a.values.scale, b.values.scale, t),
      visible: a.values.visible,
      effects: lerpEffects(a.values.effects, b.values.effects, t),
    };
  });
}

export function scenarioDuration(scenario: Scenario | null): number {
  if (!scenario) {
    return 10;
  }
  const maxKeyframe = Object.values(scenario.tracks)
    .flat()
    .reduce((max, keyframe) => Math.max(max, keyframe.time), 0);
  return Math.max(scenario.duration, maxKeyframe, 1);
}
