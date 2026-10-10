import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface EarthSceneProps {
  currentLat?: number;
  currentLng?: number;
  className?: string;
  isVisible?: boolean;
  currentTemp?: number;
}

const VERT = `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/* Surface: NASA day/night maps, ocean glint, cloud shadows, limb scattering, twilight band */
const EARTH_FRAG = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D landMap;
  uniform sampler2D cloudMap;
  uniform vec3 sunDirection;
  uniform float cloudShift;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vView;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vView);
    vec3 L = normalize(sunDirection);
    float sun = dot(N, L);
    float dayMix = smoothstep(-0.10, 0.22, sun);
    float diffuse = clamp(sun, 0.0, 1.0);
    float land = texture2D(landMap, vUv).r;
    float ocean = 1.0 - land;

    vec3 day = texture2D(dayMap, vUv).rgb;
    day = pow(day, vec3(0.92));
    day = mix(day, day * vec3(0.80, 0.93, 1.12), ocean * 0.45);   // deeper, bluer water
    day = mix(day, day * day * 1.55 + day * 0.18, land * 0.35);   // more contrast on land
    day *= 0.10 + 1.05 * pow(diffuse, 0.82);

    // cloud shadows, offset away from the sun so they sit beside the clouds
    float shade = texture2D(cloudMap, vUv + vec2(-0.0032, 0.0016) + vec2(cloudShift, 0.0)).r;
    day *= 1.0 - shade * 0.38 * diffuse;

    vec3 nt = texture2D(nightMap, vUv).rgb;
    float lum = max(nt.r, max(nt.g, nt.b));
    vec3 night = nt * vec3(1.35, 0.82, 0.38) * 1.7 + vec3(0.002, 0.004, 0.010);
    float cover = texture2D(cloudMap, vUv + vec2(cloudShift, 0.0)).r;
    night *= 1.0 - cover * 0.55;                                    // clouds veil city lights

    vec3 color = mix(night, day, dayMix);

    // sun glint on water
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 220.0) * ocean * dayMix * (1.0 - cover);
    color += vec3(1.0, 0.92, 0.78) * spec * 0.22;

    // atmospheric scattering at the limb + red/orange terminator band
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    color += vec3(0.18, 0.44, 0.95) * rim * (0.10 + 0.62 * dayMix);
    float twilight = smoothstep(-0.14, 0.0, sun) * (1.0 - smoothstep(0.0, 0.16, sun));
    color += vec3(1.0, 0.45, 0.2) * twilight * (0.03 + rim * 0.28);

    gl_FragColor = vec4(color, 1.0);
  }
`;

/* Clouds: soft real-satellite density, lit tops / shaded undersides, dark veil on the night side */
const CLOUD_FRAG = `
  uniform sampler2D cloudMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vView;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vView);
    vec3 L = normalize(sunDirection);

    float c  = texture2D(cloudMap, vUv).r;
    float cs = texture2D(cloudMap, vUv + vec2(0.0016, -0.0010)).r;   // sample toward the sun
    float relief = clamp(0.5 + (c - cs) * 3.2, 0.0, 1.0);             // fake self-shading

    float density = smoothstep(0.14, 0.82, c);
    float sun = dot(N, L);
    float day = smoothstep(-0.10, 0.26, sun);

    vec3 lit = mix(vec3(0.70, 0.76, 0.86), vec3(1.0), relief);
    vec3 warm = mix(vec3(1.0, 0.62, 0.38), vec3(1.0, 0.99, 0.97), smoothstep(0.0, 0.32, sun));
    vec3 col = lit * warm * (0.10 + 0.95 * max(sun, 0.0));
    col = mix(vec3(0.015, 0.02, 0.03), col, day);

    float limb = 1.0 - max(dot(N, V), 0.0);
    float alpha = density * mix(0.34, 0.92, day);
    alpha *= 1.0 - smoothstep(0.80, 1.0, limb) * 0.35;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

const ATMO_FRAG = `
  uniform vec3 sunDirection;
  varying vec3 vNormalW;
  varying vec3 vView;
  void main() {
    vec3 N = normalize(vNormalW);
    float d = -dot(N, normalize(vView));              // 0 at the shell edge, grows toward the planet
    float glow = pow(smoothstep(0.0, 0.52, d), 2.4);
    float lit = smoothstep(-0.55, 0.65, dot(N, normalize(sunDirection)));
    vec3 col = mix(vec3(0.05, 0.14, 0.38), vec3(0.30, 0.62, 1.0), lit);
    gl_FragColor = vec4(col, glow * (0.18 + 0.62 * lit));
  }
`;

export const EarthScene: React.FC<EarthSceneProps> = ({
  currentLat = 0,
  currentLng = 0,
  className = '',
  isVisible = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [reticle, setReticle] = useState({ x: 0, y: 0, visible: false });
  const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const mountTimer = setTimeout(() => setIsMounted(true), 60);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    container.appendChild(renderer.domElement);

    const R = 1.5;
    const earthGroup = new THREE.Group();
    // Keep the geographic frame un-tilted so the location marker maps exactly
    // to the requested latitude/longitude on the equirectangular Earth texture.
    scene.add(earthGroup);

    // Centre the globe in its box and size it to fit both width and height
    const fit = () => {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const visW = visH * camera.aspect;
      earthGroup.scale.setScalar((Math.min(visH, visW) * 0.8) / (2 * R));
    };
    fit();

    const loader = new THREE.TextureLoader();
    const aniso = renderer.capabilities.getMaxAnisotropy();
    const load = (url: string, srgb: boolean) => {
      const t = loader.load(url);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      t.wrapS = THREE.RepeatWrapping;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      return t;
    };
    const dayMap = load('/textures/earth-day.jpg', true);
    const nightMap = load('/textures/earth-night.jpg', true);
    const landMap = load('/textures/earth-land.jpg', false);
    const cloudMap = load('/textures/earth-clouds.jpg', false);

    const sunDirection = new THREE.Vector3(0.85, 0.2, 0.5).normalize();

    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayMap },
        nightMap: { value: nightMap },
        landMap: { value: landMap },
        cloudMap: { value: cloudMap },
        sunDirection: { value: sunDirection },
        cloudShift: { value: 0 },
      },
      vertexShader: VERT,
      fragmentShader: EARTH_FRAG,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), earthMat);
    earthGroup.add(earth);

    const cloudMat = new THREE.ShaderMaterial({
      uniforms: { cloudMap: { value: cloudMap }, sunDirection: { value: sunDirection } },
      vertexShader: VERT,
      fragmentShader: CLOUD_FRAG,
      transparent: true,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.008, 128, 96), cloudMat);
    earthGroup.add(clouds);

    const atmoMat = new THREE.ShaderMaterial({
      uniforms: { sunDirection: { value: sunDirection } },
      vertexShader: VERT,
      fragmentShader: ATMO_FRAG,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.16, 128, 96), atmoMat);
    earthGroup.add(atmo);

    // Orbit ring + satellite
    const orbitCurve = new THREE.EllipseCurve(0, 0, R * 1.42, R * 1.26, 0, Math.PI * 2, false, 0);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(
      orbitCurve.getPoints(160).map((p) => new THREE.Vector3(p.x, 0, p.y))
    );
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.2 });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.rotation.x = THREE.MathUtils.degToRad(72);
    orbitLine.rotation.z = THREE.MathUtils.degToRad(-18);
    earthGroup.add(orbitLine);
    const nodeGeo = new THREE.SphereGeometry(0.024, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    earthGroup.add(node);

    // Map geographic coordinates to the exact UV convention used by
    // THREE.SphereGeometry and our standard equirectangular Earth texture.
    // For this geometry, longitude increases toward -Z (eastward on the map),
    // so the local surface vector uses z = -sin(longitude).
    // Rotate the globe so the requested location sits on the camera-facing
    // meridian immediately after geolocation resolves.
    const lon = THREE.MathUtils.degToRad(currentLng);
    const lat = THREE.MathUtils.degToRad(currentLat);
    const hasValidLocation =
      Number.isFinite(currentLat) &&
      Number.isFinite(currentLng) &&
      (Math.abs(currentLat) > 0.0001 || Math.abs(currentLng) > 0.0001);
    const startY = -lon - Math.PI / 2;
    earth.rotation.y = startY;
    clouds.rotation.y = startY;

    const anchor = new THREE.Object3D();
    anchor.position.set(
      R * 1.008 * Math.cos(lat) * Math.cos(lon),
      R * 1.008 * Math.sin(lat),
      -R * 1.008 * Math.cos(lat) * Math.sin(lon)
    );
    anchor.visible = hasValidLocation;
    earth.add(anchor);

    const onMove = (e: MouseEvent) => {
      if (reduced) return;
      mouse.current.tx = ((e.clientX / window.innerWidth) * 2 - 1) * 0.05;
      mouse.current.ty = (-(e.clientY / window.innerHeight) * 2 + 1) * 0.05;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const onResize = () => {
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      fit();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // Only render while the globe is actually on screen
    let onScreen = true;
    const io = new IntersectionObserver(([en]) => (onScreen = en.isIntersecting), { threshold: 0 });
    io.observe(container);
    let tabVisible = true;
    const onVis = () => (tabVisible = document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);

    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = clock.getDelta();
      const t = clock.elapsedTime;
      if (!onScreen || !tabVisible) return;

      if (!reduced) {
        // Keep the user's location facing the camera. Only clouds drift, so the
        // geographic pointer does not slowly rotate away from the real position.
        if (!hasValidLocation) earth.rotation.y += dt * 0.006;
        clouds.rotation.y += dt * 0.010;
      }
      mouse.current.x += (mouse.current.tx - mouse.current.x) * 0.04;
      mouse.current.y += (mouse.current.ty - mouse.current.y) * 0.04;
      camera.position.x = mouse.current.x * 3;
      camera.position.y = mouse.current.y * 3;
      camera.lookAt(0, 0, 0);

      const p = orbitCurve.getPoint((t * 0.06) % 1);
      node.position.set(p.x, 0, p.y).applyEuler(orbitLine.rotation);

      anchor.getWorldPosition(tmp);
      const facing = tmp.dot(camera.position.clone().sub(tmp)) > 0;
      tmp.project(camera);
      setReticle({
        x: ((tmp.x + 1) * width) / 2,
        y: ((-tmp.y + 1) * height) / 2,
        visible: hasValidLocation && facing && tmp.z < 1,
      });
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      clearTimeout(mountTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
      io.disconnect();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      [earth, clouds, atmo].forEach((m) => m.geometry.dispose());
      [earthMat, cloudMat, atmoMat, orbitMat, nodeMat].forEach((m) => m.dispose());
      orbitGeo.dispose();
      nodeGeo.dispose();
      [dayMap, nightMap, landMap, cloudMap].forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, [currentLat, currentLng]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden transition-opacity duration-700 ease-out ${
        isMounted && isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      {isVisible && reticle.visible && (
        <div className="absolute pointer-events-none" style={{ transform: `translate3d(${reticle.x}px, ${reticle.y}px, 0)` }}>
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            <div className="w-7 h-7 rounded-full border border-sky-300/60 flex items-center justify-center animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-200" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
