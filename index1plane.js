import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js";

import { TrackballControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/TrackballControls.js";

let renderer, scene, planeMesh, group;
let plane = new THREE.Plane();

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xf0f0f0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.localClippingEnabled = true;

  let container = document.createElement("div");
  document.body.appendChild(container);
  container.appendChild(renderer.domElement);
  window.addEventListener("resize", onWindowResize, false);

  let camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.x = 0;
  camera.position.y = -200;
  camera.position.z = 100;

  let controls = new TrackballControls(camera, container);
  controls.rotateSpeed = 10.0;

  scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0x505050));

  // LIGHTS
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // color, intensity
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.copy(camera.position);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Create box1
  const geometry = new THREE.BoxGeometry(100, 100, 100);
  const material = new THREE.MeshStandardMaterial({
    color: "#ff0000",
    side: THREE.DoubleSide,
  });

  const box1 = new THREE.Mesh(geometry, material);
  box1.name = "box1";
  box1.renderOrder = 6;

  // Create box2
  const geometry2 = new THREE.BoxGeometry(100, 100, 100);
  const material2 = new THREE.MeshStandardMaterial({
    color: "#C7AC96",
    side: THREE.DoubleSide,
  });

  const box2 = new THREE.Mesh(geometry2, material2);
  box2.position.set(100, 0, 0);
  box2.name = "box2";
  box2.renderOrder = 6;

  group = new THREE.Group();
  group.name = "group";
  group.add(box1);
  group.add(box2);
  scene.add(group);

  // Create plane
  const planeGeometry = new THREE.PlaneGeometry(400, 200, 1, 1);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: "#38382f",
    side: THREE.DoubleSide,
  });

  planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  planeMesh.position.set(50, 0, 0);
  planeMesh.name = "plane";
  scene.add(planeMesh);

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function render() {
    requestAnimationFrame(render);
    controls.update();
    renderer.render(scene, camera);
  }

  render();
}

init();

const negated = document.getElementById("negated");
const negatedBox = document.getElementById("negatedBox");

document.getElementById("clipping").addEventListener("click", () => {

  const result = scene.children.filter((object) => object.name.startsWith("Clipping"));

  if (result.length === 0) {
    negatedBox.style.display = "unset";
    const normal = new THREE.Vector3();
    const point = new THREE.Vector3();

    // Create a THREE.Plane from a THREE.PlaneGeometry
    normal.set(0, 0, 1).applyQuaternion(planeMesh.quaternion);
    point.copy(planeMesh.position);
    plane.setFromNormalAndCoplanarPoint(normal, point);

    let planes = [plane];

    addColorToClippedMesh(scene, group, planes, planes);
  } else {
    negatedBox.style.display = "none";
    scene.children
      .filter((object) => object.name.startsWith("Clipping"))
      .map((object) => {
        scene.remove(object);
      });

    group.children.map((mesh) => {
      mesh.material.clippingPlanes = [];
    });
  }
});

document.getElementById("hidePlane").addEventListener("click", () => {
  planeMesh.visible = !planeMesh.visible;
});

negated.addEventListener("click", () => {
  plane.negate();
})

/**
 * Creates a clipping object
 * @param {THREE.BufferGeometry} geometry The geometry of the mesh
 * @param {THREE.Plane} plane The plane to clip the mesh
 * @param {THREE.Vector3} positionVector The vector to position the mesh
 * @param {Number} renderOrder The render order of the mesh
 * @returns THREE.Group of meshes
 */
export const createPlaneStencilGroup = (name, position, geometry, plane, renderOrder) => {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshBasicMaterial();
  baseMat.depthWrite = false;
  baseMat.depthTest = false;
  baseMat.colorWrite = false;
  baseMat.stencilWrite = true;
  baseMat.stencilFunc = THREE.AlwaysStencilFunc;

  // back faces
  const mat0 = baseMat.clone();
  mat0.side = THREE.BackSide;
  mat0.clippingPlanes = [plane];
  mat0.stencilFail = THREE.IncrementWrapStencilOp;
  mat0.stencilZFail = THREE.IncrementWrapStencilOp;
  mat0.stencilZPass = THREE.IncrementWrapStencilOp;

  const mesh0 = new THREE.Mesh(geometry, mat0);
  mesh0.name = "back";
  mesh0.renderOrder = renderOrder;
  mesh0.position.set(position.x, position.y, position.z);

  group.add(mesh0);

  // front faces
  const mat1 = baseMat.clone();
  mat1.side = THREE.FrontSide;
  mat1.clippingPlanes = [plane];
  mat1.stencilFail = THREE.DecrementWrapStencilOp;
  mat1.stencilZFail = THREE.DecrementWrapStencilOp;
  mat1.stencilZPass = THREE.DecrementWrapStencilOp;

  const mesh1 = new THREE.Mesh(geometry, mat1);
  mesh1.name = "front";
  mesh1.renderOrder = renderOrder;
  mesh1.position.set(position.x, position.y, position.z);
  // mesh1.position.set(-positionVector.x, -positionVector.y, -positionVector.z);

  group.add(mesh1);
  group.name = "planeStencilGroup" + name;

  return group;
};

/**
 * Adds the color to the clipped mesh
 * @param {THREE.Scene} scene The scene to add the mesh to
 * @param {THREE.Group} group The group to add the mesh to
 * @param {THREE.Vector} positionVector The vector to position the mesh
 * @param {THREE.Plane} planesNegated The list of the negated planes
 * @param {THREE.Plane} planes The list of the planes
 */
export const addColorToClippedMesh = (scene, group, planesNegated, planes) => {
  let object = new THREE.Group();
  object.name = "ClippingGroup";
  scene.add(object);

  let y = 0;

  group.children.map((mesh) => {
    let geometry = mesh.geometry;

    for (let i = 0; i < planesNegated.length; i++) {
      const planeObj = planesNegated[i];
      const stencilGroup = createPlaneStencilGroup(mesh.name, mesh.position, geometry, planeObj, y);
      // scene.add(stencilGroup);
      object.add(stencilGroup);
      console.log("planes", planes);
      console.log("planeObj", planeObj);

      const cap = createPlaneColored(planes, planeObj, mesh.material.color, y + 0.1);
      cap.name = "Clipping" + mesh.name;
      scene.add(cap);
      console.log("cap", cap);

      planeObj.coplanarPoint(cap.position);
      cap.lookAt(cap.position.x - planeObj.normal.x, cap.position.y - planeObj.normal.y, cap.position.z - planeObj.normal.z);
      y++;
    }

    console.log(scene.children);

    mesh.material.clippingPlanes = planesNegated;
  });
};

const createPlaneColored = (planes, plane, color, renderOrder) => {
  const capMat = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.1,
    roughness: 0.75,
    clippingPlanes: planes.filter((p) => p !== plane),
    side: THREE.DoubleSide,
    stencilWrite: true,
    stencilRef: 0,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.ReplaceStencilOp,
    stencilZFail: THREE.ReplaceStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
  });
  const cap = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), capMat);
  // clear the stencil buffer
  cap.onAfterRender = function (renderer) {
    renderer.clearStencil();
  };

  cap.renderOrder = renderOrder;
  return cap;
};
