import * as THREE from 'three';
import type { ProjectorConfig, SceneObject, Vec2 } from '../types';

const DEG = Math.PI / 180;

export function getObjectMatrix(object: SceneObject): THREE.Matrix4 {
  const position = new THREE.Vector3(...object.position);
  const quaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      object.rotation[0] * DEG,
      object.rotation[1] * DEG,
      object.rotation[2] * DEG,
    ),
  );
  const scale = new THREE.Vector3(...object.scale);
  return new THREE.Matrix4().compose(position, quaternion, scale);
}

function getProjectorCamera(
  projector: ProjectorConfig,
  aspect: number,
): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    projector.fov,
    aspect,
    0.05,
    100,
  );
  camera.position.set(...projector.position);
  camera.rotation.set(
    projector.rotation[0] * DEG,
    projector.rotation[1] * DEG,
    projector.rotation[2] * DEG,
  );
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  return camera;
}

export function planeToScreen(
  u: number,
  v: number,
  object: SceneObject,
  projector: ProjectorConfig,
  aspect: number,
): { x: number; y: number } | null {
  if (object.kind !== 'plane') {
    return null;
  }
  const local = new THREE.Vector3(
    (u - 0.5) * object.size.width,
    (v - 0.5) * object.size.height,
    0,
  );
  const world = local.applyMatrix4(getObjectMatrix(object));
  const camera = getProjectorCamera(projector, aspect);
  const view = world.clone().applyMatrix4(camera.matrixWorldInverse);
  if (view.z > -camera.near) {
    return null;
  }
  const projected = world.project(camera);
  return {
    x: projected.x * 0.5 + 0.5,
    y: -projected.y * 0.5 + 0.5,
  };
}

export function screenToPlaneUv(
  x: number,
  y: number,
  object: SceneObject,
  projector: ProjectorConfig,
  aspect: number,
): Vec2 | null {
  if (object.kind !== 'plane') {
    return null;
  }
  const camera = getProjectorCamera(projector, aspect);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(
    new THREE.Vector2(x * 2 - 1, -(y * 2 - 1)),
    camera,
  );

  const matrix = getObjectMatrix(object);
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
  const normal = new THREE.Vector3(0, 0, 1)
    .applyMatrix3(normalMatrix)
    .normalize();
  const center = new THREE.Vector3(...object.position);
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, center);
  const hit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(plane, hit)) {
    return null;
  }

  const local = hit.applyMatrix4(matrix.clone().invert());
  const u = local.x / object.size.width + 0.5;
  const v = local.y / object.size.height + 0.5;
  if (u < 0 || u > 1 || v < 0 || v > 1) {
    return null;
  }
  return [u, v];
}
