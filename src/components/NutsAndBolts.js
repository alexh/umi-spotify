import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

const NutsAndBolts = () => {
  const mountRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!mountRef.current || isInitialized) return;

    let scene, camera, renderer, composer, animationFrameId;
    const columns = [];
    let gear;

    const init = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);
      mountRef.current.appendChild(renderer.domElement);

      // Lights setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 1);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
      const pointLight = new THREE.PointLight(0xffffff, 1, 100);
      pointLight.position.set(0, 0, 10);
      scene.add(pointLight);

      camera.position.z = 5;
      camera.position.y = 1;

      const loader = new GLTFLoader();
      const metalMaterial = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        specular: 0x111111,
        shininess: 100,
        emissive: 0x333333,
      });

      const createColumn = (x) => {
        loader.load('/models/column.glb', (gltf) => {
          const model = gltf.scene;
          model.scale.set(0.5, 0.5, 0.5);
          model.position.set(x, -1, 0);

          model.traverse((child) => {
            if (child.isMesh) {
              child.material = metalMaterial;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);
          
          const pivot = new THREE.Group();
          pivot.add(model);
          pivot.position.copy(center);
          pivot.position.setX(x);

          scene.add(pivot);
          columns.push(pivot);
        });
      };

      createColumn(-2.5);
      createColumn(2.5);

      loader.load('/models/GEAR.gltf', (gltf) => {
        gear = gltf.scene;
        gear.scale.set(0.4, 0.4, 0.4);

        const pivot = new THREE.Group();
        scene.add(pivot);
        pivot.position.set(0, 3.75, 0);

        const box = new THREE.Box3().setFromObject(gear);
        const center = box.getCenter(new THREE.Vector3());
        gear.position.sub(center);

        pivot.add(gear);

        gear.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshPhongMaterial({
              color: 0xcccccc,
              specular: 0x111111,
              shininess: 100,
              emissive: 0x333333,
              transparent: true,
              opacity: 0,
            });
          }
        });
      });

      // Custom glitch shader
      const glitchShader = {
        uniforms: {
          "tDiffuse": { value: null },
          "time": { value: 0 },
          "distortion": { value: 0.1 },
          "scale": { value: 0.2 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float time;
          uniform float distortion;
          uniform float scale;
          varying vec2 vUv;
          
          float rand(vec2 co) {
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
          }
          
          void main() {
            vec2 p = vUv;
            float ty = time*scale;
            float yt = p.y - ty;
            
            // Simple glitch effect
            float glitchLine = step(0.9, sin(gl_FragCoord.y * 10.0 + time * 3.0));
            vec2 uv = p + glitchLine * vec2(cos(p.y * 20.0) * 0.01, 0);
            
            // Distortion
            float distortionEffect = sin(yt*40.) * distortion;
            p.x += distortionEffect;
            
            // Pixelation
            float pixels = 200.0;
            vec2 pixelated = floor(p * pixels) / pixels;
            
            vec4 color = texture2D(tDiffuse, pixelated);
            
            // Random color shift
            float r = texture2D(tDiffuse, pixelated + vec2(distortionEffect, 0.0)).r;
            float g = texture2D(tDiffuse, pixelated).g;
            float b = texture2D(tDiffuse, pixelated - vec2(distortionEffect, 0.0)).b;
            
            gl_FragColor = vec4(r, g, b, color.a);
          }
        `
      };

      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const glitchPass = new ShaderPass(glitchShader);
      composer.addPass(glitchPass);

      setIsInitialized(true);
    };

    const animate = () => {
      if (!isInitialized) return;

      animationFrameId = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;
      
      columns.forEach((column, index) => {
        column.rotation.y = time * 0.2 * (index % 2 === 0 ? 1 : -1);
      });

      if (gear) {
        gear.parent.rotation.z = time * 0.5;

        if (gear.material && gear.material.opacity < 1) {
          gear.material.opacity += 0.005;
          gear.material.needsUpdate = true;
        }
      }

      if (composer) {
        composer.passes.forEach(pass => {
          if (pass.uniforms) {
            if (pass.uniforms["time"]) pass.uniforms["time"].value = time;
            if (pass.uniforms["distortion"]) pass.uniforms["distortion"].value = 0.1 + Math.sin(time) * 0.05;
            if (pass.uniforms["scale"]) pass.uniforms["scale"].value = 0.2 + Math.cos(time * 0.7) * 0.1;
          }
        });
        composer.render();
      }
    };

    const handleResize = () => {
      if (camera && renderer && composer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    init();
    animate();
    window.addEventListener('resize', handleResize);

    const currentRef = mountRef.current;

    return () => {
      setIsInitialized(false);
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (composer) {
        composer.dispose();
      }
      if (renderer) {
        renderer.dispose();
      }
      if (scene) {
        scene.clear();
      }
      if (currentRef && renderer) {
        currentRef.removeChild(renderer.domElement);
      }
    };
  }, [isInitialized]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 1,
        mixBlendMode: 'screen',
        opacity: 0.7,
      }} 
    />
  );
};

export default NutsAndBolts;