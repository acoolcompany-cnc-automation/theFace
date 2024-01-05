import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as dat from "dat.gui";

const loader = new STLLoader();
const imageLoader = new THREE.ImageLoader();

const gui = new dat.GUI();

function initEnvironment({ scene, imageSrc }) {
  const sphere = new THREE.SphereGeometry(750, 64, 64);
  sphere.scale(-1, 1, 1);

  const texture = new THREE.Texture();

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
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
    offTrigger,
  };
}

export const StlViewer = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let renderer;
    if (typeof window === "undefined") {
      return; // Don't proceed on the server side
    } else {
      renderer = new THREE.WebGLRenderer(); // Create renderer here
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(0, 40, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);

    const animate = createAnimate({ scene, camera, renderer });

    // Load the first model
    loader.load("http://tserver.serverpit.com:8000/getmodelinverse/", (geometry1) => {
      // Load the second model
      loader.load("http://tserver.serverpit.com:8000/getmodel/", (geometry2) => {
        const material1 = new THREE.MeshStandardMaterial({
          color: 0xff0000, // Set the color for the first model
          metalness: 0.8,
          roughness: 0.8,
          side: THREE.DoubleSide,
        });

        const material2 = new THREE.MeshStandardMaterial({
          color: 0x00ff00, // Set the color for the second model
          metalness: 0.8,
          roughness: 0.8,
          side: THREE.DoubleSide,
        });

        const mesh1 = new THREE.Mesh(geometry1, material1);
        const mesh2 = new THREE.Mesh(geometry2, material2);

        mesh1.geometry.computeVertexNormals();
        // mesh1.geometry.center();

        mesh2.geometry.computeVertexNormals();
        // mesh2.geometry.center();

        scene.add(mesh1, mesh2);

        mesh1.rotation.x = mesh2.rotation.x = -1.2;

        gui.addColor({ color: material1.color.getHex() }, "color").onChange((color) => {
          material1.color.set(color);
        });

        gui.addColor({ color: material2.color.getHex() }, "color").onChange((color) => {
          material2.color.set(color);
        });

        animate.addTrigger(() => {
          // mesh1.rotation.x += 0.05;
          // mesh2.rotation.x += 0.05;
        });

        animate.animate();
      });
    });

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.maxDistance = 700;
    controls.minDistance = 0;

    const secondaryLight = new THREE.PointLight(0xff0000, 1, 100);
    secondaryLight.position.set(5, 5, 5);
    scene.add(secondaryLight);

    gui.add(secondaryLight.position, "y").min(-10).max(10).step(0.1);

    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", onWindowResize, false);

    camera.position.z = 5;
  }, []);

  return (
    <main>
      <div ref={mountRef} />
    </main>
  );
};
