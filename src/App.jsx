import { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three-stdlib';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import GUI from 'lil-gui';
import './App.css';
import './index.css';

function App() {
  useEffect(() => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.className = 'webgl';
    document.getElementById('root').appendChild(renderer.domElement);

    // envmap
    new RGBELoader().load('/envmaps/studio.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = texture;
      scene.environment = texture;
    });

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize, false);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const loader = new GLTFLoader();

    let currentModel;

    function loadModel(path) {
      loader.load(
        path,
        function (gltf) {
          if (currentModel) {
            scene.remove(currentModel);
            disposeModel(currentModel);
          }
          currentModel = gltf.scene;
          centerModel(currentModel);
          currentModel.scale.set(2, 2, 2);  
          scene.add(currentModel);
        },
        undefined,
        function (error) {
          console.error('An error happened while loading the model:', error);
        }
      );
    }

    function centerModel(model) {
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
    }

    function disposeModel(model) {
      model.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry.dispose();
        if (object.material.isMaterial) {
          cleanMaterial(object.material);
        } else {
          for (const material of object.material) cleanMaterial(material);
        }
      });
    }

    function cleanMaterial(material) {
      material.dispose();
      for (const key in material) {
        if (material[key] && typeof material[key].dispose === 'function') {
          material[key].dispose();
        }
      }
    }

    // post-processing ( bloom pr l'instant avec envmap studio)
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0,
      0.4, 
      0.85 
    );
    composer.addPass(bloomPass);

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      composer.render();
    }
    animate();

    const models = {
      Dunk: '/models/basket.glb',
      Jordan: '/models/jordan.glb',
    };

    loadModel(models.Dunk);

    const gui = new GUI();
    const params = {
      model: 'Dunk',
      bloomStrength: 0,
      ambientLightIntensity: 0,
      directionalLightIntensity: 0,
    };

    gui.add(params, 'model', Object.keys(models)).onChange((value) => {
      loadModel(models[value]);
    });

    gui.add(params, 'bloomStrength', 0, 3).onChange((value) => {
      bloomPass.strength = value;
    });

    gui.add(params, 'ambientLightIntensity', 0, 2).onChange((value) => {
      ambientLight.intensity = value;
    });

    gui.add(params, 'directionalLightIntensity', 0, 2).onChange((value) => {
      directionalLight.intensity = value;
    });

    return () => {
      renderer.dispose();
      document.getElementById('root').removeChild(renderer.domElement);
      gui.destroy();
      window.removeEventListener('resize', onWindowResize);
    };
  }, []);

  return null;
}

export default App;
