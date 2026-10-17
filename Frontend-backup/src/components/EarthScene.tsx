import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MutableRefObject,
} from "react";
import * as THREE from "three";
import dayAsset from "@/assets/earth-day-4096.jpg.asset.json";
import nightAsset from "@/assets/earth-night-4096.jpg.asset.json";
import surfaceAsset from "@/assets/earth-surface-clouds-4096.jpg.asset.json";
import {
  MARKERS,
  PLANET_RADIUS,
  PRESETS,
  earthBus,
  latLonToVec3,
  type Marker,
  type Preset,
} from "@/lib/earth-bus";
import { fmtLat, fmtLon } from "@/lib/sector";

const HOME_ZOOM = PRESETS.overview.zoom;

/* ─────────────── original photoreal shaders (unchanged) ─────────────── */
const earthVertex = `
varying vec2 vUv; varying vec3 vNormalW; varying vec3 vView;
void main(){
  vUv=uv;
  vec4 world=modelMatrix*vec4(position,1.0);
  vNormalW=normalize(mat3(modelMatrix)*normal);
  vView=normalize(cameraPosition-world.xyz);
  gl_Position=projectionMatrix*viewMatrix*world;
}`;

const earthFragment = `
uniform sampler2D dayMap; uniform sampler2D nightMap; uniform sampler2D surfaceMap; uniform vec3 sunDirection;
varying vec2 vUv; varying vec3 vNormalW; varying vec3 vView;
void main(){
  vec3 normal=normalize(vNormalW);
  vec4 packed=texture2D(surfaceMap,vUv);
  float land=smoothstep(0.28,0.72,packed.g);
  float cloud=smoothstep(0.36,0.82,packed.b);
  float sunlight=dot(normal,sunDirection);
  float dayMix=smoothstep(-0.1,0.22,sunlight);
  float diffuse=max(sunlight,0.0);
  vec3 day=texture2D(dayMap,vUv).rgb;
  day=pow(day,vec3(0.88));
  day*=0.085+1.04*diffuse;
  vec3 nightTexture=texture2D(nightMap,vUv).rgb;
  float cityMask=smoothstep(0.025,0.48,max(nightTexture.r,max(nightTexture.g,nightTexture.b)));
  vec3 night=nightTexture*vec3(1.24,0.76,0.34)*1.8+vec3(0.0015,0.003,0.008);
  vec3 color=mix(night,day,dayMix);
  color+=vec3(1.0,0.55,0.18)*cityMask*(1.0-dayMix)*0.08;
  vec3 halfVector=normalize(sunDirection+vView);
  float ocean=1.0-land;
  color+=vec3(1.0,0.86,0.64)*pow(max(dot(normal,halfVector),0.0),148.0)*ocean*dayMix*0.13;
  float fresnel=pow(1.0-max(dot(normal,vView),0.0),4.5);
  color+=vec3(0.08,0.27,0.62)*fresnel*(0.14+0.34*dayMix);
  color=mix(color,color*(1.0-cloud*0.08),0.55);
  gl_FragColor=vec4(color,1.0);
}`;

const atmosphereVertex = `
varying vec3 vNormalW; varying vec3 vView;
void main(){
  vec4 world=modelMatrix*vec4(position,1.0);
  vNormalW=normalize(mat3(modelMatrix)*normal);
  vView=normalize(cameraPosition-world.xyz);
  gl_Position=projectionMatrix*viewMatrix*world;
}`;

const atmosphereFragment = `
uniform vec3 sunDirection; varying vec3 vNormalW; varying vec3 vView;
void main(){
  vec3 n=normalize(vNormalW);
  float fresnel=pow(1.0-max(dot(n,vView),0.0),3.3);
  float daylight=smoothstep(-0.35,0.62,dot(n,sunDirection));
  float alpha=fresnel*(0.018+daylight*0.075);
  vec3 color=mix(vec3(0.05,0.17,0.42),vec3(0.27,0.58,0.92),daylight);
  gl_FragColor=vec4(color,alpha);
}`;

const cloudFragment = `
uniform sampler2D surfaceMap; uniform vec3 sunDirection;
varying vec2 vUv; varying vec3 vNormalW; varying vec3 vView;
void main(){
  float density=smoothstep(0.43,0.78,texture2D(surfaceMap,vUv).b);
  float sunlight=dot(normalize(vNormalW),sunDirection);
  float daylight=smoothstep(-0.13,0.24,sunlight);
  float rim=pow(1.0-max(dot(normalize(vNormalW),normalize(vView)),0.0),3.0);
  vec3 cloudColor=mix(vec3(0.05,0.07,0.1),vec3(0.86,0.89,0.9),daylight);
  float alpha=density*(0.12+daylight*0.58)+density*rim*0.08;
  gl_FragColor=vec4(cloudColor,alpha);
}`;

/* ─────────────── new additive shells (separate meshes; Earth shaders untouched) ─────────────── */
const shellVertex = `
varying vec3 vNormalW; varying vec3 vView; varying vec3 vLocal;
void main(){
  vLocal=position;
  vec4 world=modelMatrix*vec4(position,1.0);
  vNormalW=normalize(mat3(modelMatrix)*normal);
  vView=normalize(cameraPosition-world.xyz);
  gl_Position=projectionMatrix*viewMatrix*world;
}`;

// Faint auroral rim on high latitudes: curtains that live mostly at the limb and on the night side.
const auroraFragment = `
uniform float time; uniform float intensity; uniform vec3 sunDirection;
varying vec3 vNormalW; varying vec3 vView; varying vec3 vLocal;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);
}
void main(){
  vec3 n=normalize(vNormalW);
  vec3 p=normalize(vLocal);
  float lat=abs(asin(clamp(p.y,-1.0,1.0)));
  float band=smoothstep(0.98,1.2,lat)*(1.0-smoothstep(1.3,1.5,lat));
  vec2 dir=normalize(p.xz+vec2(1e-5));
  float c1=noise(dir*3.0+vec2(lat*14.0,time*0.11));
  float c2=noise(dir*7.0+vec2(-lat*30.0,time*0.17));
  float curtain=smoothstep(0.34,0.86,c1*0.62+c2*0.38);
  float rim=pow(1.0-max(dot(n,normalize(vView)),0.0),2.2);
  float night=1.0-smoothstep(-0.25,0.35,dot(n,sunDirection));
  float alpha=band*curtain*(0.09+rim*0.85)*(0.35+night*0.65)*intensity;
  vec3 color=mix(vec3(0.12,0.95,0.55),vec3(0.36,0.46,1.0),smoothstep(1.1,1.45,lat));
  gl_FragColor=vec4(color,alpha);
}`;

// Thin limb glow used by the Atmospheric Horizon preset (warms toward the sun side).
const horizonFragment = `
uniform vec3 sunDirection; uniform float intensity;
varying vec3 vNormalW; varying vec3 vView; varying vec3 vLocal;
void main(){
  vec3 n=normalize(vNormalW);
  float d=abs(dot(n,normalize(vView)));
  float glow=pow(smoothstep(0.0,0.42,d),2.6);
  float sunSide=dot(n,sunDirection);
  float lit=smoothstep(-0.45,0.55,sunSide);
  vec3 color=mix(vec3(0.10,0.34,0.95),vec3(1.0,0.60,0.28),smoothstep(0.55,0.97,sunSide));
  gl_FragColor=vec4(color,glow*(0.18+lit*0.82)*intensity*0.55);
}`;

// Radar: an equatorial front travels to the target latitude, then rings collapse onto the sector.
const radarFragment = `
uniform float sweep; uniform float lock; uniform float flash; uniform float fade; uniform float pulse;
uniform vec3 target; uniform float targetLat;
varying vec3 vNormalW; varying vec3 vView; varying vec3 vLocal;
void main(){
  vec3 p=normalize(vLocal);
  float lat=asin(clamp(p.y,-1.0,1.0));
  float front=targetLat*sweep;
  float band=exp(-pow((lat-front)/0.03,2.0));
  float lo=min(0.0,front); float hi=max(0.0,front);
  float trail=step(lo,lat)*step(lat,hi)*0.10;
  float equator=exp(-pow(lat/0.02,2.0))*(1.0-sweep)*0.9;
  float ang=acos(clamp(dot(p,target),-1.0,1.0));
  float focus=mix(1.0,exp(-pow(ang/1.1,2.0)),sweep);
  float r=(1.0-lock)*0.6+0.045+pulse*0.012;
  float rings=exp(-pow((ang-r)/0.011,2.0))+0.5*exp(-pow((ang-r*1.7)/0.01,2.0))*(1.0-lock*0.5);
  float core=exp(-pow(ang/0.035,2.0))*(0.35+flash);
  float sweepPart=(band*1.15+trail+equator)*focus*(1.0-lock);
  float a=(sweepPart+rings*lock*1.1+core*lock)*fade;
  float rim=0.55+0.45*pow(1.0-max(dot(normalize(vNormalW),normalize(vView)),0.0),1.5);
  vec3 scan=vec3(0.34,0.86,1.0);
  vec3 secured=vec3(0.50,1.0,0.78);
  gl_FragColor=vec4(mix(scan,secured,lock),clamp(a*rim,0.0,1.0));
}`;

type InteractionState = {
  hovered: boolean;
  zoom: number;
  anchorX: number;
  anchorY: number;
  forward: boolean;
  tweenZoom: boolean;
  holdSpin: boolean;
};

type ViewState = {
  rotY: number;
  tilt: number;
  lookX: number;
  lookY: number;
  horizon: number;
  aurora: number;
};
type Flight = {
  t: number;
  dur: number;
  from: ViewState & { zoom: number; sun: THREE.Vector3 };
  to: ViewState & { zoom: number; sun: THREE.Vector3 };
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutQuint = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
// Rotation.y that brings a longitude to face the camera (+z).
const rotationForLon = (lonDeg: number) => -Math.PI / 2 - THREE.MathUtils.degToRad(lonDeg);

/* ─────────────── texture loading: local file → Lovable asset → built-in procedural fallback ─────────────── */
const loadImage = (url: string) =>
  new Promise<THREE.Texture>((resolve, reject) =>
    new THREE.TextureLoader().load(url, resolve, undefined, reject),
  );

async function loadFirst(urls: string[]) {
  for (const url of urls) {
    try {
      return await loadImage(url);
    } catch {
      /* try next source */
    }
  }
  return null;
}

function hash3(x: number, y: number, z: number) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
  const sx = x - xi,
    sy = y - yi,
    sz = z - zi;
  const fx = sx * sx * (3 - 2 * sx),
    fy = sy * sy * (3 - 2 * sy),
    fz = sz * sz * (3 - 2 * sz);
  const l = THREE.MathUtils.lerp;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy),
    l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz,
  );
}

function fbm(x: number, y: number, z: number) {
  let sum = 0,
    amp = 0.5,
    freq = 1;
  for (let i = 0; i < 5; i++) {
    sum += amp * vnoise(x * freq, y * freq, z * freq);
    freq *= 2;
    amp *= 0.5;
  }
  return sum;
}

// Seamless procedural Earth (day / night lights / packed land+cloud map) used when no image files are found.
// Drop real textures into public/textures/ (earth-day.jpg, earth-night.jpg, earth-surface-clouds.jpg) to replace it.
function makeFallbackTextures(): [THREE.Texture, THREE.Texture, THREE.Texture] {
  const w = 1024,
    h = 512;
  const make = () => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    return { ctx, img: ctx.createImageData(w, h) };
  };
  const day = make(),
    night = make(),
    surface = make();
  for (let y = 0; y < h; y++) {
    const lat = (0.5 - y / h) * Math.PI;
    for (let x = 0; x < w; x++) {
      const lon = (x / w - 0.5) * Math.PI * 2;
      const dx = Math.cos(lat) * Math.cos(lon),
        dy = Math.sin(lat),
        dz = -Math.cos(lat) * Math.sin(lon);
      const elevation = fbm(dx * 1.9 + 4, dy * 1.9 + 4, dz * 1.9 + 4);
      const land = elevation > 0.53 ? 1 : 0;
      const cloud = THREE.MathUtils.clamp(
        (fbm(dx * 3.4 + 20, dy * 3.4 + 20, dz * 3.4 + 20) - 0.42) * 3,
        0,
        1,
      );
      const ice = Math.abs(lat) > 1.22 ? 1 : 0;
      const i = (y * w + x) * 4;
      let r: number, g: number, b: number;
      if (ice) {
        r = 232;
        g = 240;
        b = 248;
      } else if (land) {
        const dry = THREE.MathUtils.clamp((elevation - 0.53) * 7, 0, 1);
        r = 44 + dry * 90;
        g = 88 + dry * 30;
        b = 40 + dry * 30;
      } else {
        const depth = THREE.MathUtils.clamp((0.53 - elevation) * 4, 0, 1);
        r = 8 + (1 - depth) * 14;
        g = 34 + (1 - depth) * 40;
        b = 84 + (1 - depth) * 50;
      }
      day.img.data.set([r, g, b, 255], i);
      const lights =
        land && !ice && hash3(x, y, 7) > 0.992 && fbm(dx * 6, dy * 6, dz * 6) > 0.5 ? 255 : 0;
      night.img.data.set([lights, lights * 0.62, lights * 0.25, 255], i);
      surface.img.data.set([0, land * 255, cloud * 255, 255], i);
    }
  }
  return [day, night, surface].map(({ ctx, img }) => {
    ctx.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(ctx.canvas);
  }) as unknown as [THREE.Texture, THREE.Texture, THREE.Texture];
}

type PlanetProps = {
  interaction: MutableRefObject<InteractionState>;
  markers: Marker[];
  markerEls: MutableRefObject<Map<string, HTMLElement>>;
  reticle: MutableRefObject<HTMLDivElement | null>;
  textures: [THREE.Texture, THREE.Texture, THREE.Texture];
};

function Planet({ interaction, markers, markerEls, reticle, textures }: PlanetProps) {
  const earth = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const horizonMesh = useRef<THREE.Mesh>(null);
  const auroraMesh = useRef<THREE.Mesh>(null);
  const radarMesh = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const viewAnchor = useRef({ x: 0, y: 0 });
  const lookTarget = useRef(new THREE.Vector3(0.58, -0.42, 0));
  const [day, night, surface] = textures;
  const { gl } = useThree();

  const sun = useMemo(() => new THREE.Vector3(...PRESETS.overview.sun).normalize(), []);
  const view = useRef<ViewState>({
    rotY: 0,
    tilt: PRESETS.overview.tilt,
    lookX: 0,
    lookY: 0,
    horizon: 0,
    aurora: PRESETS.overview.aurora,
  });
  const flight = useRef<Flight | null>(null);
  const lastCmd = useRef(0);
  const radar = useRef({ id: 0, t0: null as number | null, locked: false });
  const scratch = useMemo(
    () => ({
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      c: new THREE.Vector3(),
      d: new THREE.Vector3(),
    }),
    [],
  );
  const markerVecs = useMemo(
    () => markers.map((m) => latLonToVec3(m.lat, m.lon, PLANET_RADIUS * 1.004)),
    [markers],
  );

  useEffect(() => {
    [day, night, surface].forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      texture.wrapS = THREE.RepeatWrapping;
      texture.needsUpdate = true;
    });
    surface.colorSpace = THREE.NoColorSpace;
  }, [day, night, surface, gl]);

  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches) return;
    const move = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const leave = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    window.addEventListener("pointermove", move);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  const earthMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: earthVertex,
        fragmentShader: earthFragment,
        uniforms: {
          dayMap: { value: day },
          nightMap: { value: night },
          surfaceMap: { value: surface },
          sunDirection: { value: sun },
        },
      }),
    [day, night, surface, sun],
  );

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: { sunDirection: { value: sun } },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [sun],
  );

  const cloudMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: earthVertex,
        fragmentShader: cloudFragment,
        uniforms: { surfaceMap: { value: surface }, sunDirection: { value: sun } },
        transparent: true,
        depthWrite: false,
      }),
    [surface, sun],
  );

  const auroraMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shellVertex,
        fragmentShader: auroraFragment,
        uniforms: {
          time: { value: 0 },
          intensity: { value: PRESETS.overview.aurora },
          sunDirection: { value: sun },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [sun],
  );

  const horizonMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shellVertex,
        fragmentShader: horizonFragment,
        uniforms: { sunDirection: { value: sun }, intensity: { value: 0 } },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [sun],
  );

  const radarMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shellVertex,
        fragmentShader: radarFragment,
        uniforms: {
          sweep: { value: 0 },
          lock: { value: 0 },
          flash: { value: 0 },
          fade: { value: 1 },
          pulse: { value: 0 },
          target: { value: new THREE.Vector3(0, 0, 1) },
          targetLat: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useEffect(
    () => () => {
      [
        earthMaterial,
        atmosphereMaterial,
        cloudMaterial,
        auroraMaterial,
        horizonMaterial,
        radarMaterial,
      ].forEach((m) => m.dispose());
    },
    [
      earthMaterial,
      atmosphereMaterial,
      cloudMaterial,
      auroraMaterial,
      horizonMaterial,
      radarMaterial,
    ],
  );

  const beginFlight = (
    to: Partial<Preset> & { lon: number; tilt: number; zoom: number },
    dur: number,
  ) => {
    const v = view.current;
    const targetRot = rotationForLon(to.lon);
    flight.current = {
      t: 0,
      dur,
      from: {
        rotY: v.rotY,
        tilt: v.tilt,
        lookX: v.lookX,
        lookY: v.lookY,
        horizon: v.horizon,
        aurora: v.aurora,
        zoom: interaction.current.zoom,
        sun: sun.clone(),
      },
      to: {
        rotY: v.rotY + wrapPi(targetRot - v.rotY),
        tilt: to.tilt,
        lookX: to.lookX ?? v.lookX,
        lookY: to.lookY ?? v.lookY,
        horizon: to.horizon ?? v.horizon,
        aurora: to.aurora ?? v.aurora,
        zoom: to.zoom,
        sun: to.sun ? new THREE.Vector3(...to.sun).normalize() : sun.clone(),
      },
    };
    interaction.current.tweenZoom = true;
  };

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const group = earth.current;
    if (!group) return;
    const v = view.current;
    const snap = earthBus.getSnapshot();

    /* commands from the HUD / form */
    if (snap.cmd.id !== lastCmd.current) {
      lastCmd.current = snap.cmd.id;
      if (snap.cmd.kind === "preset") {
        const preset = PRESETS[snap.cmd.preset];
        beginFlight(preset, reduced ? 0.01 : preset.duration);
      } else if (snap.cmd.kind === "sector") {
        const lat = THREE.MathUtils.clamp(snap.cmd.lat, -60, 60);
        beginFlight(
          {
            lon: snap.cmd.lon,
            tilt: 0.28 + lat * 0.006,
            zoom: Math.min(interaction.current.zoom, 7.6),
          },
          reduced ? 0.01 : 2.3,
        );
      }
    }
    if (snap.radar.id !== radar.current.id) {
      radar.current.id = snap.radar.id;
      if (snap.radar.phase === "scanning" && snap.radar.sector) {
        radar.current.t0 = state.clock.elapsedTime;
        radar.current.locked = false;
        const u = radarMaterial.uniforms;
        latLonToVec3(
          snap.radar.sector.lat,
          snap.radar.sector.lon,
          1,
          u["target"]!.value as THREE.Vector3,
        );
        u["targetLat"]!.value = THREE.MathUtils.degToRad(snap.radar.sector.lat);
      }
    }

    /* eased flight between viewpoints; manual wheel zoom cancels only the zoom part */
    const f = flight.current;
    if (f) {
      f.t += delta / f.dur;
      const k = clamp01(f.t);
      const e = easeInOutQuint(k);
      const lerp = THREE.MathUtils.lerp;
      v.rotY = lerp(f.from.rotY, f.to.rotY, e);
      v.tilt = lerp(f.from.tilt, f.to.tilt, e);
      v.lookX = lerp(f.from.lookX, f.to.lookX, e);
      v.lookY = lerp(f.from.lookY, f.to.lookY, e);
      v.horizon = lerp(f.from.horizon, f.to.horizon, e);
      v.aurora = lerp(f.from.aurora, f.to.aurora, e);
      sun.lerpVectors(f.from.sun, f.to.sun, e).normalize();
      if (interaction.current.tweenZoom) interaction.current.zoom = lerp(f.from.zoom, f.to.zoom, e);
      if (k >= 1) flight.current = null;
    } else if (!reduced && !interaction.current.hovered && !interaction.current.holdSpin) {
      v.rotY += delta * 0.018;
    }

    group.rotation.y = v.rotY;
    const damping = 1 - Math.exp(-2.4 * delta);
    group.rotation.x += (v.tilt + pointer.current.y * 0.055 - group.rotation.x) * damping;
    group.rotation.z += (-0.08 - pointer.current.x * 0.035 - group.rotation.z) * damping;
    group.position.x += (pointer.current.x * 0.045 - group.position.x) * damping;
    group.position.y += (-0.5 - pointer.current.y * 0.025 - group.position.y) * damping;
    if (clouds.current && !reduced) clouds.current.rotation.y += delta * 0.024;
    const anchorDamping = 1 - Math.exp(-3.2 * delta);
    viewAnchor.current.x += (interaction.current.anchorX - viewAnchor.current.x) * anchorDamping;
    viewAnchor.current.y += (interaction.current.anchorY - viewAnchor.current.y) * anchorDamping;
    const cameraDamping = 1 - Math.exp(-3.4 * delta);
    state.camera.position.z += (interaction.current.zoom - state.camera.position.z) * cameraDamping;
    const zoomStrength = (HOME_ZOOM - state.camera.position.z) / 3.8;
    const cameraX = pointer.current.x * 0.07 + viewAnchor.current.x * zoomStrength * 0.22;
    const cameraY = -pointer.current.y * 0.04 - viewAnchor.current.y * zoomStrength * 0.16;
    state.camera.position.x += (cameraX - state.camera.position.x) * cameraDamping;
    state.camera.position.y += (cameraY - state.camera.position.y) * cameraDamping;
    lookTarget.current.x +=
      (0.58 + v.lookX + viewAnchor.current.x * zoomStrength * 0.08 - lookTarget.current.x) *
      cameraDamping;
    const zoomLift = THREE.MathUtils.clamp(zoomStrength, 0, 1.4) * 0.52;
    lookTarget.current.y +=
      (-0.42 +
        v.lookY -
        viewAnchor.current.y * zoomStrength * 0.06 -
        zoomLift -
        lookTarget.current.y) *
      cameraDamping;
    state.camera.lookAt(lookTarget.current);

    /* keep the Earth naturally seated in the composition without covering hero content */
    const z = interaction.current.zoom;
    const wasForward = interaction.current.forward;
    if (!wasForward && z < 8.1) interaction.current.forward = true;
    else if (wasForward && z > 8.35) interaction.current.forward = false;

    /* shell uniforms */
    auroraMaterial.uniforms["time"]!.value = state.clock.elapsedTime;
    auroraMaterial.uniforms["intensity"]!.value = v.aurora;
    horizonMaterial.uniforms["intensity"]!.value = v.horizon;
    if (horizonMesh.current) horizonMesh.current.visible = v.horizon > 0.01;
    if (auroraMesh.current) auroraMesh.current.visible = v.aurora > 0.01;

    /* radar sweep → lock */
    const r = radar.current;
    const radarOn = r.t0 !== null;
    if (radarMesh.current) radarMesh.current.visible = radarOn;
    if (radarOn && r.t0 !== null) {
      const t = state.clock.elapsedTime - r.t0;
      const u = radarMaterial.uniforms;
      u["sweep"]!.value = easeInOutQuint(clamp01(t / 1.9));
      u["lock"]!.value = easeOutCubic(clamp01((t - 1.9) / 1.0));
      u["flash"]!.value = t > 2.9 ? Math.max(0, 1 - (t - 2.9) / 1.4) : clamp01(t - 1.9) * 0.6;
      u["pulse"]!.value = Math.sin(state.clock.elapsedTime * 3.2);
      u["fade"]!.value = t > 6.5 ? Math.max(0, 1 - (t - 6.5) / 1.5) : 1;
      if (t > 2.9 && !r.locked) {
        r.locked = true;
        earthBus.lockRadar(r.id);
      }
      if (t > 8) r.t0 = null;
    }

    /* pin DOM markers to the globe */
    const { a: worldPos, b: normal, c: toCam, d: centre } = scratch;
    const { width, height } = state.size;
    const rect = gl.domElement.getBoundingClientRect();
    group.getWorldPosition(centre);
    const centreScreen = centre.clone().project(state.camera);
    const cx = (centreScreen.x * 0.5 + 0.5) * width;
    const cy = (-centreScreen.y * 0.5 + 0.5) * height;
    markers.forEach((marker, index) => {
      const el = markerEls.current.get(marker.id);
      const local = markerVecs[index];
      if (!el || !local) return;
      worldPos.copy(local);
      group.localToWorld(worldPos);
      normal.copy(worldPos).sub(centre).normalize();
      toCam.copy(state.camera.position).sub(worldPos).normalize();
      const facing = normal.dot(toCam);
      const visibility = THREE.MathUtils.smoothstep(facing, 0.04, 0.26);
      const projected = worldPos.clone().project(state.camera);
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      el.style.opacity = visibility.toFixed(3);
      el.style.pointerEvents = visibility > 0.45 ? "auto" : "none";
      el.style.setProperty("--ring-rot", `${Math.atan2(y - cy, x - cx)}rad`);
      el.style.setProperty("--ring-sx", Math.max(0.22, facing).toFixed(3));
      const side = x > width * 0.62 ? "left" : "right";
      if (el.dataset["side"] !== side) el.dataset["side"] = side;
      const vert = rect.top + y > window.innerHeight * 0.58 ? "up" : "down";
      if (el.dataset["vert"] !== vert) el.dataset["vert"] = vert;
    });
  });

  const toGeo = (point: THREE.Vector3) => {
    const g = earth.current;
    if (!g) return null;
    const local = g.worldToLocal(point.clone());
    const len = local.length() || 1;
    return {
      lat: THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(local.y / len, -1, 1))),
      lon: THREE.MathUtils.radToDeg(Math.atan2(-local.z, local.x)),
    };
  };

  return (
    <group ref={earth} position={[0, -0.5, 0]}>
      <mesh
        material={earthMaterial}
        onPointerEnter={(event) => {
          event.stopPropagation();
          interaction.current.hovered = true;
          document.body.classList.add("earth-hovering");
        }}
        onPointerMove={(event) => {
          const geo = toGeo(event.point);
          if (geo) earthBus.emitGeo(geo);
          const el = reticle.current;
          if (el) {
            const rect = gl.domElement.getBoundingClientRect();
            el.style.transform = `translate3d(${event.nativeEvent.clientX - rect.left}px,${event.nativeEvent.clientY - rect.top}px,0)`;
            el.style.opacity = "1";
          }
        }}
        onPointerLeave={() => {
          interaction.current.hovered = false;
          document.body.classList.remove("earth-hovering");
          earthBus.emitGeo(null);
          if (reticle.current) reticle.current.style.opacity = "0";
        }}
      >
        <sphereGeometry args={[PLANET_RADIUS, 160, 112]} />
      </mesh>
      <mesh ref={clouds} rotation-y={0.02}>
        <sphereGeometry args={[PLANET_RADIUS * 1.006, 128, 88]} />
        <primitive object={cloudMaterial} attach="material" />
      </mesh>
      <mesh scale={1.014} material={atmosphereMaterial}>
        <sphereGeometry args={[PLANET_RADIUS, 128, 88]} />
      </mesh>
      <mesh ref={auroraMesh} material={auroraMaterial} raycast={() => null}>
        <sphereGeometry args={[PLANET_RADIUS * 1.022, 96, 64]} />
      </mesh>
      <mesh ref={horizonMesh} material={horizonMaterial} visible={false} raycast={() => null}>
        <sphereGeometry args={[PLANET_RADIUS * 1.09, 96, 64]} />
      </mesh>
      <mesh ref={radarMesh} material={radarMaterial} visible={false} raycast={() => null}>
        <sphereGeometry args={[PLANET_RADIUS * 1.012, 128, 88]} />
      </mesh>
    </group>
  );
}

/* ─────────────── DOM telemetry marker (real button → keyboard + screen-reader friendly) ─────────────── */
function TelemetryMarker({
  marker,
  pinned,
  onToggle,
  register,
  onHold,
}: {
  marker: Marker;
  pinned: boolean;
  onToggle: () => void;
  register: (el: HTMLElement | null) => void;
  onHold: (hold: boolean) => void;
}) {
  const cardId = `marker-card-${marker.id}`;
  return (
    <div
      ref={register}
      className="marker"
      data-tone={marker.tone}
      data-pinned={pinned}
      data-side="right"
      data-vert="down"
      onPointerEnter={() => onHold(true)}
      onPointerLeave={() => onHold(false)}
    >
      <span className="marker-ring" aria-hidden="true">
        <i />
        <i />
      </span>
      <button
        type="button"
        className="marker-dot"
        aria-expanded={pinned}
        aria-describedby={cardId}
        aria-label={`${marker.name} telemetry`}
        onClick={onToggle}
      />
      <div id={cardId} role="tooltip" className="marker-card">
        <header>
          <small>{marker.code}</small>
          <span className="chip">{marker.status}</span>
        </header>
        <strong>{marker.name}</strong>
        <p>
          {fmtLat(marker.lat, 2)} · {fmtLon(marker.lon, 2)}
        </p>
        <dl>
          {marker.metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export function EarthScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const markerEls = useRef(new Map<string, HTMLElement>());
  const reticle = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [textures, setTextures] = useState<[THREE.Texture, THREE.Texture, THREE.Texture] | null>(
    null,
  );
  const snap = useSyncExternalStore(earthBus.subscribe, earthBus.getSnapshot, earthBus.getSnapshot);
  const interaction = useRef<InteractionState>({
    hovered: false,
    zoom: HOME_ZOOM,
    anchorX: 0,
    anchorY: 0,
    forward: false,
    tweenZoom: false,
    holdSpin: false,
  });

  const sector = snap.radar.sector;
  const markers = useMemo<Marker[]>(() => {
    const base = [...MARKERS];
    if (sector && snap.radar.phase !== "idle") {
      base.push({
        id: "you",
        name: sector.name,
        code: "SEC-USR",
        lat: sector.lat,
        lon: sector.lon,
        status: snap.radar.phase === "locked" ? "Secured" : "Scanning",
        tone: "ok",
        metrics: [
          { label: "Latitude", value: fmtLat(sector.lat, 2) },
          { label: "Longitude", value: fmtLon(sector.lon, 2) },
          { label: "Monitoring", value: "Live" },
        ],
      });
    }
    return base;
  }, [sector, snap.radar.phase]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const onWheel = (event: WheelEvent) => {
      if (!interaction.current.hovered) return;
      event.preventDefault();
      const rect = host.getBoundingClientRect();
      const normalizedDelta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      const delta = THREE.MathUtils.clamp(normalizedDelta, -100, 100);
      interaction.current.tweenZoom = false; // manual zoom always wins over a preset glide
      interaction.current.zoom = THREE.MathUtils.clamp(
        interaction.current.zoom * Math.exp(delta * 0.00082),
        3.72,
        9.7,
      );
      interaction.current.anchorX = THREE.MathUtils.clamp(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -1,
        1,
      );
      interaction.current.anchorY = THREE.MathUtils.clamp(
        ((event.clientY - rect.top) / rect.height) * 2 - 1,
        -1,
        1,
      );
    };
    host.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      host.removeEventListener("wheel", onWheel);
      document.body.classList.remove("earth-hovering");
      host.closest(".climate-entry")?.classList.remove("earth-zoomed-forward");
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [d, n, sf] = await Promise.all([
        loadFirst(["/textures/earth_day_4096.jpg", "/textures/earth-day.jpg", dayAsset.url]),
        loadFirst(["/textures/earth_night_4096.jpg", "/textures/earth-night.jpg", nightAsset.url]),
        loadFirst(["/textures/earth_bump_roughness_clouds_4096.jpg", "/textures/earth-surface-clouds.jpg", surfaceAsset.url]),
      ]);
      if (cancelled) return;
      setTextures(d && n && sf ? [d, n, sf] : makeFallbackTextures());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pinned) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPinned(null);
    };
    const onDown = (event: PointerEvent) => {
      if (!(event.target as Element | null)?.closest?.(".marker")) setPinned(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [pinned]);

  return (
    <div ref={hostRef} className="earth-interaction-surface">
      <Canvas
        camera={{ position: [0, 0, HOME_ZOOM], fov: 34, near: 0.1, far: 40 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        <ambientLight intensity={0.18} color="rgb(80, 112, 158)" />
        <directionalLight position={[5, 2, 4]} intensity={3.1} color="rgb(255, 226, 185)" />
        <Suspense fallback={null}>
          {textures && (
            <Planet
              interaction={interaction}
              markers={markers}
              markerEls={markerEls}
              reticle={reticle}
              textures={textures}
            />
          )}
        </Suspense>
      </Canvas>
      <div className="earth-overlay">
        <div ref={reticle} className="globe-reticle" aria-hidden="true">
          <i />
        </div>
        {markers.map((marker) => (
          <TelemetryMarker
            key={marker.id}
            marker={marker}
            pinned={pinned === marker.id}
            onToggle={() => setPinned((current) => (current === marker.id ? null : marker.id))}
            onHold={(hold) => {
              interaction.current.holdSpin = hold;
            }}
            register={(el) => {
              if (el) markerEls.current.set(marker.id, el);
              else markerEls.current.delete(marker.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
