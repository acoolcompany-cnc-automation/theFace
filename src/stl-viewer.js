import React from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import pathToStl from "./assets/Eiffel_tower_sample.STL";
import matcapPorcelainWhite from "../src/assets/world-environment.jpeg";
// import TreeSTLLoader from "three-stl-loader";
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as dat from "dat.gui";

// const STLLoader = STLLoader(THREE);

const loader = new STLLoader();
const textureLoader = new THREE.TextureLoader();
const imageLoader = new THREE.ImageLoader();

const gui = new dat.GUI();

// @ts-ignore
function initEnvironment({ scene, imageSrc }) {
  const sphere = new THREE.SphereGeometry(750, 64, 64);
  sphere.scale(-1, 1, 1);

  const texture = new THREE.Texture();

  const material = new THREE.MeshBasicMaterial({
    map: texture
  });

  imageLoader.load(imageSrc, (image) => {
    texture.image = image;
    texture.needsUpdate = true;
  });

  scene.add(new THREE.Mesh(sphere, material));
}

function createAnimate({ scene, camera, renderer }) {
  const triggers = [];

  function animate() {
    requestAnimationFrame(animate);

    triggers.forEach((trigger) => {
      trigger();
    });

    renderer.render(scene, camera);
  }
  function addTrigger(cb) {
    if (typeof cb === "function") triggers.push(cb);
  }
  function offTrigger(cb) {
    const triggerIndex = triggers.indexOf(cb);
    if (triggerIndex !== -1) {
      triggers.splice(triggerIndex, 1);
    }
  }

  return {
    animate,
    addTrigger,
    offTrigger
  };
}

export class StlViewer extends React.Component {
  componentDidMount() {

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);

    const renderer = new THREE.WebGLRenderer(); // Create renderer here

    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog( 0xa0a0a0, ); //  10, 500

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(- 0, 40, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = - 25;
    dirLight.shadow.camera.left = - 25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);

    const animate = createAnimate({ scene, camera, renderer }); // Pass renderer here

    loader.load("http://tserver.serverpit.com:8000/getmodel/", (geometry) => {
      const material = new THREE.MeshStandardMaterial({
        color: 0xe4e4e4,
        metalness: 0.8,
        roughness: 0.8,
      });
      // mesh.geometry.castShadow = true;
      const mesh = new THREE.Mesh(geometry, material);

      mesh.geometry.computeVertexNormals(true);
      mesh.geometry.center();

      scene.add(mesh);

      mesh.rotation.x = -1.2;

      animate.addTrigger(() => {
        // mesh.rotation.x += 0.05;
        // mesh.rotation.y += 0.05;
      });

      animate.animate();
    });

    // const renderer = new THREE.WebGLRenderer();

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.maxDistance = 700;
    controls.minDistance = 0;

    /**
     * Light set
     */
    const secondaryLight = new THREE.PointLight(0xff0000, 1, 100);
    secondaryLight.position.set(5, 5, 5);
    scene.add(secondaryLight);

    gui.add(secondaryLight.position, "y").min(-10).max(10).step(0.1);

    renderer.setSize(window.innerWidth, window.innerHeight);
    this.mount.appendChild(renderer.domElement);

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", onWindowResize, false);

    camera.position.z = 500;

    // animate.animate();
  }
  render() {
    return <main>
      <div ref={(ref) => (this.mount = ref)} />
    </main>;
  }
}
