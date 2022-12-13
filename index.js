import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js";
import { VRButton } from "https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/webxr/VRButton.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/controls/OrbitControls.js";
import { XRControllerModelFactory } from "https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/webxr/XRControllerModelFactory.js";
import { STLLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/STLLoader.js";
import { TransformControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/TransformControls.js";

let container;
let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

let raycaster;

const intersected = [];
const tempMatrix = new THREE.Matrix4();

let controls, tControls, group;

let planeMesh, planeMesh2;

let planes = [];
let planesOriginal = [];

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  // camera.position.set(0, 1.6, 3);
  camera.position.set(0, -200, 100);

  controls = new OrbitControls(camera, container);
  // controls.target.set(0, 1.6, 0);
  controls.update();

  const floorGeometry = new THREE.PlaneGeometry(4, 4);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 1.0,
    metalness: 0.0,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  scene.add(new THREE.HemisphereLight(0x808080, 0x606060));

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 6, 0);
  light.castShadow = true;
  light.shadow.camera.top = 2;
  light.shadow.camera.bottom = -2;
  light.shadow.camera.right = 2;
  light.shadow.camera.left = -2;
  light.shadow.mapSize.set(4096, 4096);
  scene.add(light);

  group = new THREE.Group();
  scene.add(group);

  // // Create box1
  // const geometry1 = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  // const material = new THREE.MeshStandardMaterial({
  //   color: "#ff0000",
  //   side: THREE.DoubleSide,
  // });

  // const box1 = new THREE.Mesh(geometry1, material);
  // box1.name = "box1";
  // box1.position.set(0, 1, 0);
  // box1.renderOrder = 6;

  // // Create box2
  // const geometry2 = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  // const material2 = new THREE.MeshStandardMaterial({
  //   color: "#C7AC96",
  //   side: THREE.DoubleSide,
  // });

  // const box2 = new THREE.Mesh(geometry2, material2);
  // box2.position.set(0, 1, 0);
  // box2.name = "box2";
  // box2.renderOrder = 6;

  // group.name = "group";
  // group.add(box1);
  // group.add(box2);

  // Create plane
  // const planeGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
  // const planeMaterial = new THREE.MeshStandardMaterial({
  //   color: "#38382f",
  //   side: THREE.DoubleSide,
  // });

  // planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  // planeMesh.position.set(0, 1, 0);
  // planeMesh.rotation.x = Math.PI / 2;
  // planeMesh.name = "plane";
  // scene.add(planeMesh);

  // // Create plane2
  // const planeGeometry2 = new THREE.PlaneGeometry(1, 1, 1, 1);
  // const planeMaterial2 = new THREE.MeshStandardMaterial({
  //   color: "#f0f0f0",
  //   side: THREE.DoubleSide,
  // });

  // planeMesh2 = new THREE.Mesh(planeGeometry2, planeMaterial2);
  // planeMesh2.position.set(0, 1, 0);
  // planeMesh2.name = "plane2";
  // scene.add(planeMesh2);

  // Renderer

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.localClippingEnabled = true;
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer));

  tControls = new TransformControls(camera, renderer.domElement);
  tControls.addEventListener("change", render);

  tControls.addEventListener("dragging-changed", function (event) {
    controls.enabled = !event.value;
  });

  scene.add(tControls);

  // controllers

  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("selectend", onSelectEnd);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("selectend", onSelectEnd);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  //

  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);

  const line = new THREE.Line(geometry);
  line.name = "line";
  line.scale.z = 5;

  controller1.add(line.clone());
  controller2.add(line.clone());

  raycaster = new THREE.Raycaster();

  //

  window.addEventListener("resize", onWindowResize);
}

let mesh;

// Load the file and get the geometry
document.getElementById("file").onchange = (e) => {
  let reader = new FileReader();

  reader.onload = () => {
    const geometry = new STLLoader().parse(reader.result);

    createMeshFromFile(geometry);
  };

  reader.readAsArrayBuffer(e.target.files[0]);
};

/**
 * Creates the mesh from the file's geometry
 * @param {THREE.BufferGeometry} geometry
 */
const createMeshFromFile = (geometry) => {
  if (mesh) {
    scene.remove(mesh);
  }

  const material = new THREE.MeshLambertMaterial({
    color: "#C7AC96",
    wireframe: false,
  });
  mesh = new THREE.Mesh(geometry, material);
  const center = getCenter(mesh);

  mesh.position.set(-center.x, -center.y, -center.z);

  group.add(mesh);
};

document.getElementById("addPlanes").addEventListener("click", () => {
  const geometry = new THREE.PlaneGeometry(30, 30, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: "#38382f",
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "plane";

  scene.add(mesh);

  tControls.attach(mesh);
  tControls.setMode("translate");
});

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onSelectStart(event) {
  const controller = event.target;

  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];

    const object = intersection.object;
    object.material.emissive.b = 1;
    controller.attach(object);

    controller.userData.selected = object;
  }
}

function onSelectEnd(event) {
  const controller = event.target;

  if (controller.userData.selected !== undefined) {
    const object = controller.userData.selected;
    object.material.emissive.b = 0;
    group.attach(object);

    controller.userData.selected = undefined;
  }
}

function getIntersections(controller) {
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  return raycaster.intersectObjects(scene.children, false);
}

function intersectObjects(controller) {
  // Do not highlight when already selected

  if (controller.userData.selected !== undefined) return;

  const line = controller.getObjectByName("line");
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];

    const object = intersection.object;
    object.material.emissive.r = 1;
    intersected.push(object);

    line.scale.z = intersection.distance;
  } else {
    line.scale.z = 5;
  }
}

function cleanIntersected() {
  while (intersected.length) {
    const object = intersected.pop();
    object.material.emissive.r = 0;
  }
}

//

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  cleanIntersected();

  intersectObjects(controller1);
  intersectObjects(controller2);

  renderer.render(scene, camera);
}

const negated = document.getElementById("negated");
const negatedBox = document.getElementById("negatedBox");

document.getElementById("clipping").addEventListener("click", () => {
  planes = [];
  planesOriginal = [];
  const result = scene.children.filter((object) =>
    object.name.startsWith("Clipping")
  );

  if (result.length === 0) {
    negatedBox.style.display = "unset";
    const planesGeometry = scene.children.filter((object) =>
      object.name.startsWith("plane")
    );
    const normals = [];
    const centers = [];

    planesGeometry.forEach((item) => {
      const plane = new THREE.Plane();
      const normal = new THREE.Vector3();
      const point = new THREE.Vector3();

      // Gets the centers of the planes
      const center = getCenterPoint(item);
      centers.push(center);

      // Creates the THREE.Plane from THREE.PlaneGeometry
      normal.set(0, 0, 1).applyQuaternion(item.quaternion);
      point.copy(item.position);
      plane.setFromNormalAndCoplanarPoint(normal, point);

      // Saves the normals of the planes
      normals.push(plane.normal);

      planes.push(plane);
    });

    // Calculates the barycenter of the planes
    const pointx =
      centers.reduce((prev, curr) => prev + curr.x, 0) / centers.length;
    const pointy =
      centers.reduce((prev, curr) => prev + curr.y, 0) / centers.length;
    const pointz =
      centers.reduce((prev, curr) => prev + curr.z, 0) / centers.length;
    const barycenter = new THREE.Vector3(pointx, pointy, pointz);

    const distances = [];

    // Gets the distance from the plane and the barycenter
    planes.forEach((item) => {
      distances.push(item.distanceToPoint(barycenter));
    });

    // Negates only the plane with negative distance
    distances.forEach((distance, index) => {
      if (distance < 0) {
        planes[index].negate();
      }
    });

    // Creates the clipping object with colors
    addColorToClippedMesh(scene, group, planes, planes, false);

    group.children.map((object) => {
      object.material.clipIntersection = false;
    });

    // const planesOriginal = [];
    planesOriginal = planes.map((item) => item.clone());
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
  const planesGeometry = scene.children.filter((object) =>
    object.name.startsWith("plane")
  );

  planesGeometry.forEach((item) => (item.visible = !item.visible));
});

let count = 0;

negated.addEventListener("click", () => {
  count++;

  const result = scene.children.filter((object) =>
    object.name.startsWith("Clipping")
  );

  if (result.length > 0) {
    // removes the previous clipping object
    scene.children
      .filter((object) => object.name.startsWith("Clipping"))
      .map((object) => {
        scene.remove(object);
      });
  }

  if (count % 2 != 0) {
    planes.forEach((item) => item.negate());
    // removes the previous clipping planes with negated planes for the mesh and original planes for the colored planes
    addColorToClippedMesh(scene, group, planes, planesOriginal, true);

    group.children.map((object) => {
      object.material.clipIntersection = true;
    });
  } else {
    planes.forEach((item) => item.negate());

    // removes the previous clipping planes with negated planes for the mesh and original planes for the colored planes
    addColorToClippedMesh(scene, group, planesOriginal, planesOriginal, false);

    group.children.map((object) => {
      object.material.clipIntersection = false;
    });
  }
});

/**
 * Creates a clipping object
 * @param {THREE.BufferGeometry} geometry The geometry of the mesh
 * @param {THREE.Plane} plane The plane to clip the mesh
 * @param {THREE.Vector3} positionVector The vector to position the mesh
 * @param {Number} renderOrder The render order of the mesh
 * @returns THREE.Group of meshes
 */
export const createPlaneStencilGroup = (
  name,
  position,
  geometry,
  plane,
  renderOrder
) => {
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
export const addColorToClippedMesh = (
  scene,
  group,
  planesNegated,
  planes,
  negatedClick
) => {
  let object = new THREE.Group();
  object.name = "ClippingGroup";
  scene.add(object);

  let y = 0;

  group.children.map((mesh) => {
    for (let i = 0; i < planesNegated.length; i++) {
      const planeObj = planesNegated[i];
      const stencilGroup = createPlaneStencilGroup(
        mesh.name,
        mesh.position,
        mesh.geometry,
        planeObj,
        y
      );

      object.add(stencilGroup);

      const cap = createPlaneColored(
        planes,
        planeObj,
        mesh.material.color,
        y + 0.1,
        negatedClick
      );
      cap.name = "Clipping" + mesh.name;
      scene.add(cap);

      planeObj.coplanarPoint(cap.position);
      cap.lookAt(
        cap.position.x - planeObj.normal.x,
        cap.position.y - planeObj.normal.y,
        cap.position.z - planeObj.normal.z
      );
      y++;
    }

    mesh.material.clippingPlanes = planesNegated;
  });
};

const createPlaneColored = (
  planes,
  plane,
  color,
  renderOrder,
  negatedClick
) => {
  const capMat = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.1,
    roughness: 0.75,
    clippingPlanes: planes.filter((p) => p !== plane),
    clipIntersection: negatedClick,
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

const getCenterPoint = (mesh) => {
  var geometry = mesh.geometry;
  geometry.computeBoundingBox();
  var center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  mesh.localToWorld(center);
  return center;
};

const getCenter = (object) => {
  const center = new THREE.Vector3();

  const box3 = new THREE.Box3().setFromObject(object);
  box3.getCenter(center);

  return center;
};
