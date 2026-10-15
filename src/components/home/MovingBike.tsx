"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { DRACOLoader } from "three-stdlib";
import { Box3, CanvasTexture, Color, Group, Mesh, MeshStandardMaterial, Vector3, type Material } from "three";

const BIKE_URL = "/models/mountain-bike.glb";
const DRACO_PATH = "/draco/";

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(DRACO_PATH);
dracoLoader.setDecoderConfig({ type: "js" });

const configureGltfLoader: NonNullable<Parameters<typeof useGLTF>[3]> = (loader) => {
  loader.setDRACOLoader(dracoLoader);
};

/**
 * mountain-bike.glb is a photogrammetry scan. The sand it was scanned on was fused into the main mesh
 * (no node to filter by name), so it was cut out of the geometry itself; the bike was also levelled
 * (the scan sat 3.1° nose-down) and given smooth normals so it can take the scene's light instead of
 * being unlit. The baked photo texture still carries daylight, so a small emissive floor keeps the
 * paint readable in the dark tunnel without washing out the rim light.
 */
function prepareBike(scene: Group) {
  const root = scene.clone(true);
  const owned: Material[] = [];

  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.castShadow = false;
    child.receiveShadow = false;
    const sources = Array.isArray(child.material) ? child.material : [child.material];
    const mapped = sources.map((source) => {
      const material = source.clone();
      owned.push(material);
      if (material instanceof MeshStandardMaterial) {
        material.roughness = 0.6;
        material.metalness = 0;
        material.emissive = new Color("#ffffff");
        material.emissiveMap = material.map;
        material.emissiveIntensity = 0.16;
      }
      return material;
    });
    child.material = Array.isArray(child.material) ? mapped : mapped[0];
  });

  root.updateMatrixWorld(true);
  const box = new Box3().setFromObject(root);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  // Target ~1.55m tall bike in scene units.
  const scale = 1.55 / Math.max(size.y, 0.001);

  return {
    root,
    offset: new Vector3(-center.x, -box.min.y, -center.z),
    scale,
    dispose() {
      for (const material of owned) material.dispose();
    },
  };
}

/** Bike length (≈2.6 units) and half wheelbase (≈0.8 units) after scaling, along the travel axis. */
const SHADOW_SIZE: [number, number] = [0.9, 3.1];
const CONTACT_OFFSET = 0.8;

/**
 * Soft ground shadow: one wide pool plus two tight blobs at the tyre contacts, so the bike sits on
 * the road instead of hovering. A baked texture costs nothing per frame (ContactShadows would
 * re-render the bike from below every frame).
 */
function createShadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 220;
  const context = canvas.getContext("2d");
  if (context) {
    const blob = (y: number, rx: number, ry: number, alpha: number) => {
      context.save();
      context.translate(canvas.width / 2, y);
      context.scale(rx, ry);
      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
      gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, 1, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };
    const middle = canvas.height / 2;
    const contact = (CONTACT_OFFSET / SHADOW_SIZE[1]) * canvas.height;
    blob(middle, canvas.width / 2, canvas.height / 2, 0.42);
    blob(middle - contact, canvas.width / 5, canvas.height / 9, 0.75);
    blob(middle + contact, canvas.width / 5, canvas.height / 9, 0.75);
  }
  return new CanvasTexture(canvas);
}

/** World-space road height at x/z near the bike (provided by the tunnel once it has loaded). */
export type GroundSampler = (x: number, z: number) => number;

/** Clearance under the tyres: just above the 7 mm pedalling bob, so the tread never sinks in. */
const RIDE_HEIGHT = 0.008;

type Props = {
  speedRef: MutableRefObject<number>;
  scrollRef: MutableRefObject<number>;
  groundRef: MutableRefObject<GroundSampler | null>;
};

export function MovingBike({ speedRef, scrollRef, groundRef }: Props) {
  const { scene } = useGLTF(BIKE_URL, false, true, configureGltfLoader);
  const model = useMemo(() => prepareBike(scene), [scene]);
  const rigRef = useRef<Group>(null);
  const frameRef = useRef<Group>(null);

  const shadow = useMemo(() => createShadowTexture(), []);

  // scene.clone() shares materials with useGLTF's cache, so prepareBike clones them and only those are disposed.
  useEffect(() => () => model.dispose(), [model]);
  useEffect(() => () => shadow.dispose(), [shadow]);

  useFrame(({ clock }) => {
    const bike = rigRef.current;
    const body = frameRef.current;
    if (!bike || !body) return;

    const t = clock.elapsedTime;
    const progress = scrollRef.current;
    void speedRef.current;

    body.rotation.z = Math.sin(t * 6.2) * 0.022;
    body.position.y = Math.sin(t * 12.4) * 0.007;
    body.rotation.x = Math.sin(t * 3.1) * 0.008;

    bike.position.x = -progress * 1.2;
    bike.position.z = 1.15 + progress * 0.25;
    bike.rotation.y = -progress * 0.16;

    // Follow the real road under both tyres: height from their average, pitch from their difference.
    const ground = groundRef.current;
    if (ground) {
      const dx = Math.sin(bike.rotation.y) * CONTACT_OFFSET;
      const dz = Math.cos(bike.rotation.y) * CONTACT_OFFSET;
      const front = ground(bike.position.x + dx, bike.position.z + dz);
      const rear = ground(bike.position.x - dx, bike.position.z - dz);
      bike.position.y = (front + rear) / 2 + RIDE_HEIGHT;
      bike.rotation.x = -Math.atan2(front - rear, CONTACT_OFFSET * 2);
    }
  });

  return (
    <group ref={rigRef} position={[0, RIDE_HEIGHT, 1.15]}>
      {/* Sits on the road plane (rig is pitched to the slope); polygonOffset wins the depth tie. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002 - RIDE_HEIGHT, 0]} renderOrder={1}>
        <planeGeometry args={SHADOW_SIZE} />
        <meshBasicMaterial
          map={shadow}
          transparent
          depthWrite={false}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      <group ref={frameRef}>
        {/* Length runs along X in the file with the front wheel at -X; +90° yaw maps -X to +Z (the camera). */}
        <group rotation={[0, Math.PI / 2, 0]} scale={model.scale}>
          <primitive object={model.root} position={model.offset} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(BIKE_URL, false, true, configureGltfLoader);
