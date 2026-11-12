import {
  ACESFilmicToneMapping, AdditiveBlending, AmbientLight, BoxGeometry,
  BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, CylinderGeometry,
  DirectionalLight, EdgesGeometry, Float32BufferAttribute, FogExp2, Group,
  HemisphereLight, InstancedMesh, Line, LineBasicMaterial,
  LineSegments, Material, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  Object3D, OctahedronGeometry, PerspectiveCamera, Points, Raycaster, Scene,
  ShaderMaterial, Sprite, SpriteMaterial, SRGBColorSpace, TorusGeometry, TubeGeometry, Vector2, Vector3, WebGLRenderer
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { SIGNAL_POSITIONS, clampJourneyProgress, nearestSignal } from './journey';
import exhibit from './exhibit.json';

export interface SignalWorld {
  begin(): void;
  travelTo(index: number): void;
  activate(index: number): void;
  setMotion(enabled: boolean): void;
  suspend(value: boolean): void;
  reset(): void;
  dispose(): void;
}
interface Options {
  mount: HTMLElement;
  motion: boolean;
  onZone(index: number): void;
  onArrive(index: number): void;
  onProgress(value: number): void;
  onInspect(index: number): void;
  onApproach(visible: boolean): void;
  onFailure(error: unknown): void;
}
interface Portal {
  group: Group;
  beacon: Mesh;
  rings: Mesh[];
  lights: MeshBasicMaterial;
  active: boolean;
  phase: number;
}

export function createSignalWorld(options: Options): SignalWorld {
  const { mount } = options;
  const smallScreen = matchMedia('(max-width: 650px)');
  const renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x030c11);
  renderer.setPixelRatio(Math.min(devicePixelRatio, smallScreen.matches ? 1.25 : 1.5));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const canvas = renderer.domElement;
  mount.append(canvas);
  const scene = new Scene();
  scene.background = new Color(0x030c11);
  scene.fog = new FogExp2(0x04141c, 0.009);
  const camera = new PerspectiveCamera(65, 1, 0.2, 650);
  const composer = new EffectComposer(renderer);
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.7, 0.6, 0.85);
  const antialias = new ShaderPass(FXAAShader);
  const output = new OutputPass();
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloom);
  composer.addPass(antialias);
  composer.addPass(output);
  scene.add(new AmbientLight(0x315e6e, 1.6));
  scene.add(new HemisphereLight(0xa6e6e1, 0x020912, 2.4));
  const key = new DirectionalLight(0xb6f8ef, 3.5);
  key.position.set(-20, 35, 10);
  scene.add(key);

  const curve = new CatmullRomCurve3([
    new Vector3(0, 0, 30), new Vector3(0, 3, -45),
    new Vector3(32, 7, -155), new Vector3(-35, 14, -275),
    new Vector3(30, -3, -420), new Vector3(-22, 7, -550),
    new Vector3(0, 0, -690)
  ]);
  const up = new Vector3(0, 1, 0);
  const forwardAxis = new Vector3(0, 0, -1);
  const palettes = exhibit.stations.map((station) => station.color);
  const darkMaterial = new MeshStandardMaterial({ color: 0x10333f, metalness: 0.62, roughness: 0.42 });
  const edgeMaterial = new LineBasicMaterial({ color: 0x2a7280, transparent: true, opacity: 0.45 });
  const teal = new MeshBasicMaterial({ color: new Color(0x5de6d0).multiplyScalar(1.7) });
  const white = new MeshBasicMaterial({ color: new Color(0xd0fff2).multiplyScalar(2.5) });
  const copper = new MeshBasicMaterial({ color: new Color(0xffad7d).multiplyScalar(1.8) });
  const portals: Portal[] = [];
  const beacons: Mesh[] = [];
  const world = new Group();
  scene.add(world);
  const boxGeometry = new BoxGeometry(1, 1, 1);
  const dummy = new Object3D();

  function localFrame(t: number): { point: Vector3; tangent: Vector3; right: Vector3 } {
    const point = curve.getPointAt(MathUtils.clamp(t, 0, 1));
    const tangent = curve.getTangentAt(MathUtils.clamp(t, 0, 1));
    return { point, tangent, right: new Vector3().crossVectors(tangent, up).normalize() };
  }
  function mesh(geometry: BufferGeometry, material: Material, parent: Group, x = 0, y = 0, z = 0): Mesh {
    const item = new Mesh(geometry, material);
    item.position.set(x, y, z);
    parent.add(item);
    return item;
  }
  function block(parent: Group, x: number, y: number, z: number, sx: number, sy: number, sz: number, material: Material = darkMaterial): Mesh {
    const item = mesh(boxGeometry, material, parent, x, y, z);
    item.scale.set(sx, sy, sz);
    return item;
  }
  function ring(parent: Group, radius: number, tube: number, material: Material, x = 0, y = 0, z = 0): Mesh {
    return mesh(new TorusGeometry(radius, tube, 8, 96), material, parent, x, y, z);
  }
  function random(index: number): number {
    const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  }
  function label(parent: Group, text: string, x: number, y: number, z: number, wide = false): void {
    const surface = document.createElement('canvas');
    surface.width = 1024;
    surface.height = 256;
    const context = surface.getContext('2d');
    if (!context) throw new Error('Cannot create career landmark labels');
    context.fillStyle = '#061820';
    context.fillRect(0, 0, 1024, 256);
    context.strokeStyle = '#52767b';
    context.lineWidth = 5;
    context.strokeRect(4, 4, 1016, 248);
    context.fillStyle = '#c4d7da';
    context.font = '600 94px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 512, 132, 920);
    const texture = new CanvasTexture(surface);
    texture.colorSpace = SRGBColorSpace;
    const marker = new Sprite(new SpriteMaterial({ map: texture, depthWrite: false, toneMapped: false }));
    marker.position.set(x, y, z);
    marker.scale.set(wide ? 12 : 9, wide ? 3 : 2.25, 1);
    parent.add(marker);
  }
  function connection(parent: Group, from: Vector3, to: Vector3, material: Material): void {
    const midpoint = from.clone().lerp(to, 0.5).add(new Vector3(0, 1.5, 0));
    mesh(new TubeGeometry(new CatmullRomCurve3([from, midpoint, to]), 32, 0.055, 5, false), material, parent);
  }

  // The river is a bundle of actual 3D curves, not a screen-space background.
  for (let strand = -3; strand <= 3; strand++) {
    const points: Vector3[] = [];
    for (let step = 0; step <= 320; step++) {
      const t = step / 320;
      const frame = localFrame(t);
      points.push(frame.point.addScaledVector(frame.right, strand * 1.65 + Math.sin(t * 45 + strand) * 0.65).add(new Vector3(0, -3.4 + Math.sin(t * 50 + strand) * 0.35, 0)));
    }
    const filament = new CatmullRomCurve3(points);
    mesh(new TubeGeometry(filament, 500, strand === 0 ? 0.09 : 0.032, 5, false), strand === 0 ? white : teal, world);
  }
  for (const side of [-1, 1]) {
    const points: Vector3[] = [];
    for (let step = 0; step <= 200; step++) {
      const t = step / 200;
      const frame = localFrame(t);
      points.push(frame.point.addScaledVector(frame.right, side * (11 + Math.sin(t * 23) * 4)).add(new Vector3(0, -2 + Math.cos(t * 33) * 3, 0)));
    }
    mesh(new TubeGeometry(new CatmullRomCurve3(points), 400, 0.05, 5, false), copper, world);
  }

  const towers = new InstancedMesh(boxGeometry, darkMaterial, 240);
  const windows = new InstancedMesh(boxGeometry, teal, 240);
  for (let index = 0; index < 240; index++) {
    const t = 0.025 + random(index + 1) * 0.95;
    const frame = localFrame(t);
    const side = index % 2 === 0 ? -1 : 1;
    const height = 8 + random(index + 100) * 56;
    dummy.position.copy(frame.point).addScaledVector(frame.right, side * (19 + random(index + 200) * 65));
    dummy.position.y += -26 + height / 2;
    dummy.rotation.set(0, random(index + 400) * 0.5, (random(index + 500) - 0.5) * 0.15);
    dummy.scale.set(2 + random(index + 600) * 7, height, 2 + random(index + 700) * 8);
    dummy.updateMatrix();
    towers.setMatrixAt(index, dummy.matrix);
    dummy.position.y += height / 2 + 0.2;
    dummy.scale.y = 0.09;
    dummy.updateMatrix();
    windows.setMatrixAt(index, dummy.matrix);
  }
  towers.instanceMatrix.needsUpdate = true;
  windows.instanceMatrix.needsUpdate = true;
  world.add(towers, windows);

  // Each chapter has a different spatial signature along the same navigable river.
  SIGNAL_POSITIONS.forEach((t, index) => {
    const station = exhibit.stations[index];
    if (!station) throw new Error(`Missing milestone for world ${index}`);
    const frame = localFrame(t);
    const group = new Group();
    group.position.copy(frame.point);
    group.quaternion.setFromUnitVectors(forwardAxis, frame.tangent);
    world.add(group);
    const color = new Color(palettes[index] ?? 0x7dffdb);
    const lights = new MeshBasicMaterial({ color: color.clone().multiplyScalar(1.8) });
    const rings: Mesh[] = [];
    const portal = { group, lights, rings, active: false, phase: 0, beacon: mesh(new OctahedronGeometry(0.9), white, group, 0, -2, -11) };
    portal.beacon.userData.zoneIndex = index;
    beacons.push(portal.beacon);
    const halo = ring(group, 1.55, 0.025, lights, 0, -2, -11);
    halo.rotation.y = Math.PI / 5;
    rings.push(halo);
    const axis = block(group, 0, -2.6, -11, 0.025, 1.2, 0.025, lights);
    axis.userData.beaconAxis = true;
    for (let i = 0; i < 10; i++) block(group, (i - 4.5) * 1.1, -3, -11, 0.35, 0.04, 0.1, lights);

    const node = (nodeIndex: number, position: Vector3, wide = false): void => {
      const text = station.labels[nodeIndex];
      if (!text) throw new Error(`Missing landmark ${nodeIndex} in ${station.id}`);
      const tile = block(group, position.x, position.y, position.z, wide ? 9 : 5, 0.7, 5);
      tile.add(new LineSegments(new EdgesGeometry(boxGeometry), edgeMaterial));
      block(group, position.x, position.y + 0.4, position.z, wide ? 8.5 : 4.5, 0.04, 4.6, lights);
      label(group, text, position.x, position.y + 2.8, position.z, wide);
    };
    if (station.id === 'origins') {
      let previous: Vector3 | undefined;
      station.labels.forEach((_, nodeIndex) => {
        const point = new Vector3(-9 + nodeIndex * 6, 1 + nodeIndex * 2.8, -25 - nodeIndex * 2);
        node(nodeIndex, point);
        if (previous) connection(group, previous, point, lights);
        previous = point;
      });
    } else if (station.id === 'delivery') {
      const destination = new Vector3(0, 0, -19);
      const stages = [new Vector3(-9, 6, -30), new Vector3(0, 6, -30), new Vector3(9, 11, -32)];
      stages.forEach((point, nodeIndex) => {
        node(nodeIndex, point);
        connection(group, point, destination, nodeIndex === 2 ? white : lights);
      });
      node(3, destination, true);
      for (const side of [-1, 1]) block(group, side * 17, 4, -35, 3, 26, 7);
    } else if (station.id === 'signal') {
      const destination = new Vector3(0, 0, -17);
      const products = [
        new Vector3(-7, 13, -35), new Vector3(7, 13, -35),
        new Vector3(-7, 5, -29), new Vector3(7, 5, -29)
      ];
      products.forEach((point, nodeIndex) => {
        node(nodeIndex, point);
        connection(group, point, destination, lights);
      });
      node(4, destination, true);
      block(group, 0, -1.5, -17, 15, 1, 9);
    } else if (station.id === 'core') {
      const foundation = new Vector3(0, 0, -19);
      block(group, 0, -2, -26, 27, 1.2, 18);
      const capabilities = [new Vector3(-9, 7, -30), new Vector3(0, 13, -36), new Vector3(9, 7, -30)];
      capabilities.forEach((point, nodeIndex) => {
        block(group, point.x, (point.y - 2) / 2, point.z, 3, point.y + 2, 3);
        node(nodeIndex, point);
        connection(group, point, foundation, lights);
      });
      node(3, foundation, true);
      const sharedBoundary = ring(group, 19, 0.045, lights, 0, -1, -26);
      sharedBoundary.rotation.x = Math.PI / 2;
    } else {
      throw new Error(`No visual milestone defined for ${station.id}`);
    }
    portals.push(portal);
  });

  const dustPositions = new Float32Array(1500 * 3);
  for (let index = 0; index < 1500; index++) {
    dustPositions[index * 3] = (random(index + 900) - 0.5) * 240;
    dustPositions[index * 3 + 1] = (random(index + 2000) - 0.5) * 160;
    dustPositions[index * 3 + 2] = 50 - random(index + 4000) * 800;
  }
  const dustGeometry = new BufferGeometry();
  dustGeometry.setAttribute('position', new BufferAttribute(dustPositions, 3));
  const dustMaterial = new ShaderMaterial({
    uniforms: { color: { value: new Color(0x79c6d4) } },
    vertexShader: 'void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(170./-p.z,1.,4.);}',
    fragmentShader: 'uniform vec3 color;void main(){float a=pow(max(0.,1.-length(gl_PointCoord-.5)*2.),2.);gl_FragColor=vec4(color,a*.65);}',
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending
  });
  world.add(new Points(dustGeometry, dustMaterial));

  const flowCount = 100;
  const flowGeometry = new BufferGeometry();
  const flowData = new Float32Array(flowCount * 3);
  flowGeometry.setAttribute('position', new BufferAttribute(flowData, 3));
  const flowMaterial = new ShaderMaterial({
    vertexShader: 'void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(360./-p.z,2.,14.);}',
    fragmentShader: 'void main(){float a=pow(max(0.,1.-length(gl_PointCoord-.5)*2.),2.);gl_FragColor=vec4(.55,1.,.85,a);}',
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending
  });
  world.add(new Points(flowGeometry, flowMaterial));

  const player = new Group();
  scene.add(player);
  const signalBody = mesh(new OctahedronGeometry(0.38), white, player);
  const playerRing = ring(player, 0.8, 0.014, teal);
  playerRing.rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) {
    const fin = mesh(new CylinderGeometry(0, 0.16, 1.1, 3), teal, player, side * 0.55, 0, 0.1);
    fin.rotation.z = side * Math.PI / 3;
    fin.rotation.x = Math.PI / 2;
  }
  const trailLength = 70;
  const trailPoints = Array.from({ length: trailLength }, () => new Vector3());
  const trailGeometry = new BufferGeometry();
  trailGeometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(trailLength * 3), 3));
  const trail = new Line(trailGeometry, new LineBasicMaterial({ color: 0x7dffdb, transparent: true, opacity: 0.8, blending: AdditiveBlending }));
  trail.frustumCulled = false;
  scene.add(trail);

  let motion = options.motion;
  let started = false;
  let suspended = false;
  let disposed = false;
  let frame = 0;
  let lastTime = 0;
  let time = 0;
  let progress = 0.018;
  let targetProgress = progress;
  let zone = 0;
  let arrived = -1;
  let steeringX = 0;
  let steeringY = 0;
  let desiredX = 0;
  let desiredY = 0;
  let introBlend = 0;
  let lastPlayerPosition = new Vector3();
  let pointerStart: { x: number; y: number; id: number; progress: number } | null = null;
  const pointer = new Vector2();
  const raycaster = new Raycaster();

  function moveTo(value: number): void {
    targetProgress = clampJourneyProgress(value);
    if (!motion) {
      progress = targetProgress;
      trailPoints.forEach((point) => point.copy(player.position));
    }
    arrived = -1;
    invalidate();
  }
  function travelTo(index: number): void {
    const destination = SIGNAL_POSITIONS[index];
    if (destination === undefined) throw new RangeError(`Unknown signal destination: ${index}`);
    moveTo(destination);
  }
  function resize(): void {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.fov = smallScreen.matches ? 76 : 65;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, smallScreen.matches ? 1.25 : 1.5));
    renderer.setSize(width, height);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
    const resolution = antialias.uniforms.resolution?.value;
    if (!(resolution instanceof Vector2)) throw new Error('Missing FXAA resolution uniform');
    resolution.set(1 / (width * renderer.getPixelRatio()), 1 / (height * renderer.getPixelRatio()));
    invalidate();
  }
  function update(delta: number): void {
    if (motion) time += delta;
    if (started) progress = motion ? MathUtils.damp(progress, targetProgress, 1.5, delta) : targetProgress;
    introBlend = motion ? MathUtils.damp(introBlend, started ? 1 : 0, 2.5, delta) : Number(started);
    steeringX = motion ? MathUtils.damp(steeringX, desiredX, 4, delta) : desiredX;
    steeringY = motion ? MathUtils.damp(steeringY, desiredY, 4, delta) : desiredY;
    const current = localFrame(progress);
    player.position.copy(current.point).addScaledVector(current.right, steeringX * 4.5).addScaledVector(up, 0.4 + steeringY * 2);
    player.quaternion.setFromUnitVectors(forwardAxis, current.tangent);
    player.rotation.z -= steeringX * 0.3;
    signalBody.rotation.y = time * 0.7;
    signalBody.rotation.z = time * 0.4;
    player.visible = started;
    trail.visible = started;
    const eye = current.point.clone().addScaledVector(current.tangent, -15.5).addScaledVector(up, 6.5);
    eye.addScaledVector(current.right, (1 - introBlend) * -19 + steeringX * 0.75);
    camera.position.copy(eye);
    camera.lookAt(current.point.clone().addScaledVector(current.tangent, 23).addScaledVector(up, 4).addScaledVector(current.right, (1 - introBlend) * 9 + steeringX * 1.5));
    camera.updateMatrixWorld();
    if (lastPlayerPosition.distanceTo(player.position) > 20 || lastTime === 0) trailPoints.forEach((point) => point.copy(player.position));
    if (motion || !started) {
      trailPoints.unshift(player.position.clone());
      trailPoints.pop();
    }
    const positions = trailGeometry.getAttribute('position');
    trailPoints.forEach((point, index) => positions.setXYZ(index, point.x, point.y, point.z));
    positions.needsUpdate = true;
    lastPlayerPosition.copy(player.position);
    for (let index = 0; index < flowCount; index++) {
      const t = (index / flowCount + time * 0.009) % 1;
      const flow = localFrame(t);
      flow.point.addScaledVector(flow.right, Math.sin(index * 9.1) * 4.5).addScaledVector(up, -3 + Math.sin(index) * 0.3);
      flowData[index * 3] = flow.point.x;
      flowData[index * 3 + 1] = flow.point.y;
      flowData[index * 3 + 2] = flow.point.z;
    }
    flowGeometry.getAttribute('position').needsUpdate = true;
    const newZone = nearestSignal(progress);
    if (newZone !== zone) {
      zone = newZone;
      options.onZone(zone);
    }
    portals.forEach((portal, index) => {
      portal.beacon.rotation.y = time * 0.55;
      portal.beacon.position.y = -2 + (motion ? Math.sin(time * 1.4 + index) * 0.3 : 0);
      portal.rings.forEach((rotor, rotorIndex) => {
        rotor.rotation.z = time * (rotorIndex % 2 === 0 ? 0.035 : -0.03) + rotorIndex * 0.2;
      });
      if (portal.active && portal.phase < 1) {
        portal.phase = motion ? Math.min(1, portal.phase + delta * 0.6) : 1;
        portal.lights.color.set(palettes[index] ?? 0x7dffdb).multiplyScalar(2 + Math.sin(portal.phase * Math.PI) * 5);
      }
    });
    const destination = SIGNAL_POSITIONS[zone] ?? 0.12;
    const atBeacon = started && Math.abs(progress - destination) < 0.012 && Math.abs(targetProgress - progress) < 0.012;
    if (atBeacon && arrived !== zone) {
      arrived = zone;
      options.onArrive(zone);
    }
    options.onApproach(atBeacon);
    options.onProgress(progress);
  }
  function render(timestamp: number): void {
    frame = 0;
    if (disposed || suspended || document.hidden) return;
    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 1 / 60;
    update(delta);
    lastTime = timestamp;
    try {
      composer.render();
    } catch (error) {
      options.onFailure(error);
      return;
    }
    if (motion) invalidate();
  }
  function invalidate(): void {
    if (!frame && !disposed && !suspended && !document.hidden) frame = requestAnimationFrame(render);
  }
  function steer(event: PointerEvent): void {
    const bounds = canvas.getBoundingClientRect();
    desiredX = MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
    desiredY = MathUtils.clamp(1 - (event.clientY - bounds.top) / bounds.height * 2, -1, 1);
  }
  function onPointerMove(event: PointerEvent): void {
    if (!started || suspended || (event.pointerType === 'touch' && !pointerStart)) return;
    steer(event);
    if (pointerStart?.id === event.pointerId && event.pointerType !== 'mouse') {
      moveTo(pointerStart.progress + (pointerStart.y - event.clientY) * 0.0007);
    }
    invalidate();
  }
  function onPointerDown(event: PointerEvent): void {
    if (!started || event.button !== 0 || !event.isPrimary) return;
    pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId, progress: targetProgress };
    canvas.setPointerCapture(event.pointerId);
  }
  function onPointerUp(event: PointerEvent): void {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const wasTap = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) < 8;
    pointerStart = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (!wasTap) return;
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
    raycaster.setFromCamera(pointer, camera);
    const object = raycaster.intersectObjects(beacons, false)[0]?.object;
    if (typeof object?.userData.zoneIndex === 'number') options.onInspect(object.userData.zoneIndex);
  }
  function onPointerCancel(): void { pointerStart = null; }
  function onWheel(event: WheelEvent): void {
    if (!started || suspended) return;
    event.preventDefault();
    const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? mount.clientHeight : 1;
    moveTo(targetProgress + event.deltaY * multiplier * 0.00022);
  }
  function onVisibility(): void {
    lastTime = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else invalidate();
  }
  function onContextLost(event: Event): void {
    event.preventDefault();
    options.onFailure(new Error('WebGL context lost'));
  }
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('webglcontextlost', onContextLost);
  document.addEventListener('visibilitychange', onVisibility);
  const observer = new ResizeObserver(resize);
  observer.observe(mount);
  const controller: SignalWorld = {
    begin() {
      started = true;
      travelTo(0);
    },
    travelTo,
    activate(index) {
      const portal = portals[index];
      if (!portal) throw new RangeError(`Unknown signal: ${index}`);
      if (!portal.active) {
        portal.active = true;
        portal.phase = 0;
        portal.beacon.material = portal.lights;
      }
      invalidate();
    },
    setMotion(enabled) {
      motion = enabled;
      if (!motion) progress = targetProgress;
      lastTime = 0;
      invalidate();
    },
    suspend(value) {
      suspended = value;
      lastTime = 0;
      cancelAnimationFrame(frame);
      frame = 0;
      if (!suspended) invalidate();
    },
    reset() {
      started = false;
      introBlend = 0;
      progress = 0.018;
      targetProgress = progress;
      desiredX = desiredY = steeringX = steeringY = 0;
      arrived = -1;
      zone = 0;
      options.onZone(0);
      invalidate();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      document.removeEventListener('visibilitychange', onVisibility);
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      scene.traverse((object) => {
        if (object instanceof Mesh || object instanceof Line || object instanceof Points) {
          geometries.add(object.geometry);
          const used = Array.isArray(object.material) ? object.material : [object.material];
          used.forEach((material) => materials.add(material));
          if (object instanceof InstancedMesh) object.dispose();
        } else if (object instanceof Sprite) materials.add(object.material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => {
        if (material instanceof SpriteMaterial) material.map?.dispose();
        material.dispose();
      });
      bloom.dispose();
      antialias.dispose();
      output.dispose();
      composer.dispose();
      renderer.dispose();
      canvas.remove();
    }
  };
  try {
    resize();
    update(1 / 60);
    composer.render();
    options.onZone(0);
    invalidate();
  } catch (error) {
    controller.dispose();
    throw error;
  }
  return controller;
}
