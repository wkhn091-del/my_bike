"use client";

import {
  Component,
  memo,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF, useProgress } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { DRACOLoader } from "three-stdlib";
import {
  AdditiveBlending,
  BackSide,
  Box3,
  Color,
  DoubleSide,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  type Material,
  type Texture,
} from "three";
import { prefersReducedMotion, ScrollTrigger } from "@/motion/gsap";
import { MovingBike, type GroundSampler } from "./MovingBike";

const ROAD_URL = "/models/road-tunnel.glb";
const DRACO_PATH = "/draco/";

/**
 * road-tunnel.glb is in Sketchfab units of ~1.95 cm (a 3.5 m lane is 180 units wide). The bike is
 * 1.55 scene units tall (≈1.1 m), so 1 m ≈ 1.41 scene units and the tunnel needs ≈0.0275 per file unit.
 * At the old 6.2/height scale the tunnel was 1.7 units high: barely taller than the bike.
 */
const TUNNEL_SCALE = 0.0275;
/** Road centre sits this far to +X so the bike (facing +Z, its right hand is -X) rides the right lane. */
const LANE_SHIFT = 2.45;
/** World Z of the tunnel mouth behind the camera (camera starts at z 5.4). */
const NEAR_PORTAL_Z = 8.5;
/** Bike contact point in world space; the tunnel is lifted/lowered so the road surface is y = 0 here. */
const BIKE_CONTACT = new Vector3(0, 0, 1.15);
/** speedRef → scene units per second. 2.1 × 3.2 ≈ 6.7 u/s ≈ 4.8 m/s, an easy road-bike pace. */
const WORLD_SPEED = 3.2;

/** Materials in road-tunnel.glb, by name. */
// Untextured helper shell + end cap (white slabs when seen from the road); the portal sign reads mirrored from inside.
const HIDDEN_MATERIALS = new Set(["material", "material_0", "Sign"]);
const SCROLLING_MATERIALS = new Set(["Road", "Asphalt"]); // UV v runs along the road; scrolling it is the motion
const THIN_MATERIALS = new Set(["Concrete", "Stone", "Metal", "Gravel"]); // single-sided pieces you can end up behind

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(DRACO_PATH);
dracoLoader.setDecoderConfig({ type: "js" });

const configureGltfLoader: NonNullable<Parameters<typeof useGLTF>[3]> = (loader) => {
  loader.setDRACOLoader(dracoLoader);
};

function cssToken(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

type ScrollingTexture = { texture: Texture; vPerUnit: number };

function materialsOf(mesh: Mesh): Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

/** Least-squares slope of UV v against file-space Y (the road's length axis), so scrolling follows the asset. */
function vPerFileUnit(mesh: Mesh): number {
  const uv = mesh.geometry.getAttribute("uv");
  const position = mesh.geometry.getAttribute("position");
  if (!uv || !position) return 0;
  let n = 0;
  let sy = 0;
  let sv = 0;
  let syy = 0;
  let syv = 0;
  for (let index = 0; index < uv.count; index += 1) {
    const y = position.getY(index);
    const v = uv.getY(index);
    n += 1;
    sy += y;
    sv += v;
    syy += y * y;
    syv += y * v;
  }
  const denominator = n * syy - sy * sy;
  return denominator === 0 ? 0 : (n * syv - sy * sv) / denominator;
}

function buildTunnel(scene: Object3D) {
  const root = scene.clone(true);
  root.updateMatrixWorld(true);

  const owned = new Set<Material | Texture>();
  const scrolling: ScrollingTexture[] = [];
  const found: { road?: Mesh; portals?: Mesh } = {};

  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.castShadow = false;
    child.receiveShadow = false;

    const sources = materialsOf(child);
    const name = sources[0]?.name ?? "";
    if (HIDDEN_MATERIALS.has(name)) {
      child.visible = false;
      return;
    }
    if (name === "Road") found.road = child;
    if (name === "Stone") found.portals = child;

    const mapped = sources.map((source) => {
      const material = source.clone();
      owned.add(material);
      if (!(material instanceof MeshStandardMaterial)) return material;

      if (THIN_MATERIALS.has(name)) material.side = DoubleSide;
      if (name === "Gravel") material.color.multiplyScalar(0.6); // embankments read as sand dunes at full brightness
      if (name === "Light") {
        // Sodium strips along the upper walls; bright enough to bloom.
        material.color.set("#2a1a0c");
        material.emissive.set("#ffb066");
        material.emissiveIntensity = 5;
      }
      if (SCROLLING_MATERIALS.has(name)) {
        material.roughness = 0.82; // multiplies the roughness map: a touch of sheen to catch the sun
        // Clone the maps so the scroll offset never leaks into useGLTF's cached scene.
        const vPerUnit = vPerFileUnit(child) / TUNNEL_SCALE;
        const swapped = new Map<Texture, Texture>();
        for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap"] as const) {
          const texture = material[key];
          if (!texture) continue;
          let copy = swapped.get(texture);
          if (!copy) {
            copy = texture.clone();
            copy.anisotropy = 8; // the road is seen at a grazing angle; capped by the GPU
            swapped.set(texture, copy);
            owned.add(copy);
            scrolling.push({ texture: copy, vPerUnit });
          }
          material[key] = copy;
        }
      }
      material.needsUpdate = true;
      return material;
    });
    // A single-primitive glTF mesh has no geometry groups: handing it a material ARRAY makes three.js
    // draw nothing at all. That (not face culling) is why the tunnel was invisible.
    child.material = Array.isArray(child.material) ? mapped : mapped[0];
  });

  // Place the asset: road centre on LANE_SHIFT, near portal behind the camera, road surface at y = 0
  // under the bike. Everything is measured from the file so a re-export does not silently break it.
  const { road, portals } = found;
  const position = new Vector3();
  const roadBox = road ? new Box3().setFromObject(road) : null;
  const portalBox = portals ? new Box3().setFromObject(portals) : null;
  const roadCenterX = roadBox ? (roadBox.min.x + roadBox.max.x) / 2 : 17.5;
  const nearPortal = portalBox ? portalBox.max.z : 762;
  position.x = LANE_SHIFT - roadCenterX * TUNNEL_SCALE;
  position.z = NEAR_PORTAL_Z - nearPortal * TUNNEL_SCALE;

  // Road height (file units) under a world-space x/z, before the vertical offset is known.
  const probe = new Raycaster();
  probe.ray.direction.set(0, -1, 0);
  const surfaceAt = (x: number, z: number) => {
    if (!road) return 245; // crest height, fallback only
    probe.ray.origin.set((x - position.x) / TUNNEL_SCALE, 5000, (z - position.z) / TUNNEL_SCALE);
    return probe.intersectObject(road, false)[0]?.point.y ?? 245;
  };
  position.y = -surfaceAt(BIKE_CONTACT.x, BIKE_CONTACT.z) * TUNNEL_SCALE;

  // The road is crowned and climbs ~1.2% toward the crest, so a single flat height leaves the bike
  // floating or sunk once it drifts on scroll. Sample a small grid around the bike once (raycasts
  // are too slow per frame) and interpolate.
  const grid = { x0: -3, z0: -1.5, step: 0.5, nx: 11, nz: 12 };
  const heights = new Float32Array(grid.nx * grid.nz);
  for (let iz = 0; iz < grid.nz; iz += 1) {
    for (let ix = 0; ix < grid.nx; ix += 1) {
      const x = grid.x0 + ix * grid.step;
      const z = grid.z0 + iz * grid.step;
      heights[iz * grid.nx + ix] = position.y + surfaceAt(x, z) * TUNNEL_SCALE;
    }
  }
  const groundAt: GroundSampler = (x, z) => {
    const fx = MathUtils.clamp((x - grid.x0) / grid.step, 0, grid.nx - 1.001);
    const fz = MathUtils.clamp((z - grid.z0) / grid.step, 0, grid.nz - 1.001);
    const ix = Math.floor(fx);
    const iz = Math.floor(fz);
    const tx = fx - ix;
    const tz = fz - iz;
    const at = (cx: number, cz: number) => heights[cz * grid.nx + cx];
    const near = MathUtils.lerp(at(ix, iz), at(ix + 1, iz), tx);
    const far = MathUtils.lerp(at(ix, iz + 1), at(ix + 1, iz + 1), tx);
    return MathUtils.lerp(near, far, tz);
  };

  return {
    root,
    position,
    groundAt,
    /** Move the road surface by `distance` scene units toward -Z (away from the camera). */
    advance(distance: number) {
      for (const item of scrolling) item.texture.offset.y = (item.texture.offset.y - distance * item.vPerUnit) % 1;
    },
    dispose() {
      for (const item of owned) item.dispose();
    },
  };
}

function Tunnel({
  speedRef,
  groundRef,
}: {
  speedRef: MutableRefObject<number>;
  groundRef: MutableRefObject<GroundSampler | null>;
}) {
  const { scene } = useGLTF(ROAD_URL, false, true, configureGltfLoader);
  const model = useMemo(() => buildTunnel(scene), [scene]);

  useEffect(() => {
    groundRef.current = model.groundAt;
    return () => {
      groundRef.current = null;
      model.dispose();
    };
  }, [groundRef, model]);

  // The bike rides toward the camera, so the road recedes (-Z). In this asset UV v grows toward -Z,
  // so a receding road means a falling v offset (handled in advance()).
  useFrame((_, delta) => {
    model.advance(speedRef.current * WORLD_SPEED * Math.min(delta, 0.1));
  });

  return (
    <group position={model.position} scale={TUNNEL_SCALE}>
      <primitive object={model.root} />
    </group>
  );
}

/** Air streaks: they stream past the bike and recede into the tunnel, same direction as the road. */
function SpeedLines({ speedRef }: { speedRef: MutableRefObject<number> }) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const count = 42;
  const seedsRef = useRef(
    Float32Array.from({ length: count * 4 }, (_, index) => {
      const lane = Math.floor(index / 4);
      // Keep a clear corridor around the lens so no streak sweeps across the frame.
      if (index % 4 === 0) return (lane % 2 ? -1 : 1) * (1.8 + ((lane * 47) % 17) * 0.26) + 0.5;
      if (index % 4 === 1) return 0.2 + ((lane * 13) % 18) * 0.07;
      if (index % 4 === 2) return -28 + ((lane * 29) % 35);
      return 0.45 + ((lane * 7) % 10) * 0.1;
    }),
  );

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const run = Math.max(speedRef.current, 0.25);
    const seeds = seedsRef.current;
    const step = Math.min(delta, 0.1);
    for (let index = 0; index < count; index += 1) {
      const base = index * 4;
      seeds[base + 2] -= run * 14 * step;
      if (seeds[base + 2] < -30) seeds[base + 2] = 7 + (index % 5);
      dummy.position.set(seeds[base], seeds[base + 1], seeds[base + 2]);
      dummy.scale.set(0.025, 0.025, seeds[base + 3] * (0.85 + run));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffd9b0" transparent opacity={0.16} depthWrite={false} blending={AdditiveBlending} />
    </instancedMesh>
  );
}

function ScrollDirector({
  speedRef,
  scrollRef,
}: {
  speedRef: MutableRefObject<number>;
  scrollRef: MutableRefObject<number>;
}) {
  const reduce = prefersReducedMotion();

  useEffect(() => {
    speedRef.current = reduce ? 0 : 2.1;
    if (reduce) {
      scrollRef.current = 0;
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      scrub: 0.65,
      onUpdate: (self) => {
        scrollRef.current = self.progress;
        speedRef.current = MathUtils.lerp(2.4, 0.7, self.progress);
      },
    });

    return () => trigger.kill();
  }, [reduce, scrollRef, speedRef]);

  useFrame((state, delta) => {
    const camera = state.camera;
    if (!(camera instanceof PerspectiveCamera)) return;
    const progress = scrollRef.current;
    camera.position.x = MathUtils.damp(camera.position.x, progress * 1.15, 4, delta);
    camera.position.y = MathUtils.damp(camera.position.y, 1.2 + progress * 0.28, 4, delta);
    camera.position.z = MathUtils.damp(camera.position.z, 5.4 - progress * 0.55, 4, delta);
    camera.lookAt(-progress * 0.95, 0.55, -progress * 0.35);
  });

  return null;
}

/** Low sun beyond the far portal, slightly to the open (right-hand) side of the frame. */
const SUN_DIRECTION = new Vector3(0.12, 0.03, -1).normalize();

type Palette = { sunset: Color; cream: Color; charcoal: Color };

function usePalette(): Palette {
  return useMemo(
    () => ({
      sunset: new Color(cssToken("--color-sunset", "#e07a2e")),
      cream: new Color(cssToken("--color-cream", "#f4ede0")),
      charcoal: new Color(cssToken("--color-charcoal", "#1f211c")),
    }),
    [],
  );
}

/**
 * Dusk sky dome, only ever seen through the far portal. Values go above 1 near the sun so Bloom
 * picks it up as the "light at the end of the tunnel". No fog: the haze colour is matched to it.
 */
function SunsetSky({ palette }: { palette: Palette }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          zenith: { value: new Color("#17162a") },
          dusk: { value: new Color("#5b2f45") },
          horizon: { value: palette.sunset.clone().lerp(new Color("#ff9d5c"), 0.45) },
          glow: { value: palette.cream.clone().lerp(new Color("#ffc98a"), 0.6) },
          ground: { value: palette.charcoal.clone().lerp(palette.sunset, 0.18) },
          sunDirection: { value: SUN_DIRECTION },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDirection;
          void main() {
            vDirection = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 zenith;
          uniform vec3 dusk;
          uniform vec3 horizon;
          uniform vec3 glow;
          uniform vec3 ground;
          uniform vec3 sunDirection;
          varying vec3 vDirection;
          void main() {
            vec3 direction = normalize(vDirection);
            float elevation = direction.y;
            vec3 sky = mix(horizon, dusk, smoothstep(0.02, 0.22, elevation));
            sky = mix(sky, zenith, smoothstep(0.22, 0.6, elevation));
            sky = mix(ground, sky, smoothstep(-0.04, 0.0, elevation));
            float facing = max(dot(direction, sunDirection), 0.0);
            sky += glow * (pow(facing, 900.0) * 9.0 + pow(facing, 70.0) * 0.8 + pow(facing, 10.0) * 0.22);
            gl_FragColor = vec4(sky, 1.0);
          }
        `,
      }),
    [palette],
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[52, 48, 24]} />
    </mesh>
  );
}

/**
 * Cinematic dusk rig: warm low sun behind the bike (rim light + long sheen on the road), cool dusk
 * fill from the portal behind the camera (teal/orange split), sodium practicals under the wall strips,
 * and warm haze so the tunnel melts into the sunset toward the far end.
 */
function SceneLights({ palette }: { palette: Palette }) {
  const sun = useMemo(() => palette.sunset.clone().lerp(palette.cream, 0.35), [palette]);
  const haze = useMemo(() => palette.charcoal.clone().lerp(palette.sunset, 0.3), [palette]);
  const sunPosition = useMemo(() => SUN_DIRECTION.clone().multiplyScalar(30).add(new Vector3(0, 2.4, 0)), []);

  return (
    <>
      <color attach="background" args={[palette.charcoal]} />
      <fogExp2 attach="fog" args={[haze, 0.02]} />
      <hemisphereLight args={["#7d8db5", "#140f0c", 0.3]} />
      <directionalLight color={sun} intensity={3.4} position={sunPosition} />
      <directionalLight color="#8796c4" intensity={0.65} position={[3, 3.5, 9]} />
      <pointLight color="#ffae5e" intensity={9} distance={16} decay={2} position={[-5.6, 4.9, 2.5]} />
      <pointLight color="#ffae5e" intensity={9} distance={16} decay={2} position={[-5.6, 4.9, -6]} />
      <pointLight color="#ffae5e" intensity={5} distance={16} decay={2} position={[10.5, 4.9, -2]} />
    </>
  );
}

/** Image-based light for glossy bits (frame paint, road sheen). Rendered once from light cards: no HDR download, CSP-safe. */
function DuskEnvironment({ palette }: { palette: Palette }) {
  return (
    <Environment resolution={64} frames={1} environmentIntensity={0.4}>
      <color attach="background" args={["#0c0a10"]} />
      <Lightformer form="rect" color={palette.sunset} intensity={4} position={[1.2, 0.8, -10]} scale={[7, 2.4, 1]} />
      <Lightformer form="rect" color="#4f5f8a" intensity={0.7} position={[0, 7, 0]} scale={[6, 18, 1]} rotation-x={Math.PI / 2} />
      <Lightformer form="rect" color="#6f7fae" intensity={0.6} position={[0, 2, 10]} scale={[10, 4, 1]} />
    </Environment>
  );
}

function CinematicPost() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.25} intensity={0.7} radius={0.7} />
      {/* EffectComposer forces renderer.toneMapping = NoToneMapping, so tone mapping must live here. */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.26} darkness={0.62} />
      <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.16} />
    </EffectComposer>
  );
}

/**
 * memo: HeroSceneCanvas re-renders on every loader progress tick; without it the Environment's
 * children change identity and the cube map + PMREM get rebuilt on each tick.
 * No inner Suspense: the scene (and onReady → fade-in) waits for BOTH models, so the bike never
 * shows up floating over an empty sky.
 */
const Scene = memo(function Scene({ onReady }: { onReady: () => void }) {
  const speedRef = useRef(2.1);
  const scrollRef = useRef(0);
  const groundRef = useRef<GroundSampler | null>(null);
  const palette = usePalette();

  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <>
      <SceneLights palette={palette} />
      <SunsetSky palette={palette} />
      <DuskEnvironment palette={palette} />
      <ScrollDirector speedRef={speedRef} scrollRef={scrollRef} />
      <Tunnel speedRef={speedRef} groundRef={groundRef} />
      <MovingBike speedRef={speedRef} scrollRef={scrollRef} groundRef={groundRef} />
      <SpeedLines speedRef={speedRef} />
      <CinematicPost />
    </>
  );
});

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[hero-scene]", error, info.componentStack);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function LoaderBadge({ ready }: { ready: boolean }) {
  const { progress, errors } = useProgress();
  if (ready) return null;
  return (
    <div
      data-scene-progress={Math.round(progress)}
      className="pointer-events-none absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream/20 bg-charcoal/70 px-4 py-2 text-micro font-semibold text-cream backdrop-blur-sm"
    >
      {errors.length ? "התמונה נשארה זמינה" : <>מכינים את המסלול… <bdi>{Math.round(progress)}%</bdi></>}
    </div>
  );
}

export function HeroSceneCanvas() {
  const [sceneReady, setSceneReady] = useState(false);
  const onReady = useMemo(() => () => setSceneReady(true), []);
  const { active, progress, errors } = useProgress();
  const ready = sceneReady || (!active && progress === 100 && errors.length === 0);
  const charcoal = cssToken("--color-charcoal", "#1f211c");

  return (
    <SceneBoundary>
      <div aria-hidden="true" className="absolute inset-0 bg-charcoal">
        <Canvas
          className={`transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
          style={{ width: "100%", height: "100%" }}
          camera={{ position: [0, 1.2, 5.4], fov: 42, near: 0.1, far: 110 }}
          dpr={[1, 2]}
          shadows
          gl={{ alpha: false, antialias: false, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.domElement.setAttribute("tabindex", "-1");
            gl.domElement.setAttribute("aria-hidden", "true");
            gl.setClearColor(new Color(charcoal), 1);
            // Tone mapping itself runs in CinematicPost; the effect still reads the renderer's exposure.
            gl.toneMappingExposure = 1;
            gl.outputColorSpace = SRGBColorSpace;
          }}
        >
          <Suspense fallback={null}>
            <Scene onReady={onReady} />
          </Suspense>
        </Canvas>
        <LoaderBadge ready={ready} />
      </div>
    </SceneBoundary>
  );
}

useGLTF.preload(ROAD_URL, false, true, configureGltfLoader);
