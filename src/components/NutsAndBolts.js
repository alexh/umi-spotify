import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

const NutsAndBolts = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
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
    const columns = [];
    let gear;

    const metalMaterial = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      specular: 0x111111,
      shininess: 100,
      emissive: 0x333333,
    });

    const createColumn = (x) => {
      loader.load('/models/column.glb', (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
        model.position.set(x, -1, 0);

        model.traverse((child) => {
          if (child.isMesh) {
            child.material = metalMaterial;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Set the rotation pivot to the center of the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        const pivot = new THREE.Group();
        pivot.add(model);
        pivot.position.copy(center);
        pivot.position.setX(x); // Set the X position of the pivot

        scene.add(pivot);
        columns.push(pivot);
      });
    };

    createColumn(-2.5); // Left column
    createColumn(2.5);  // Right column
    // createColumn(0);    // Center column

    // Load and set up the gear
    loader.load('/models/GEAR.gltf', (gltf) => {
      gear = gltf.scene;
      gear.scale.set(0.4, 0.4, 0.4); // Adjust scale as needed

      // Create a pivot point for the gear
      const pivot = new THREE.Group();
      scene.add(pivot);
      pivot.position.set(0, 3.75, 0); // Position the pivot in the top right corner

      // Center the gear on its pivot
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
            opacity: 0, // Start fully transparent
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

    // Set up EffectComposer
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const glitchPass = new ShaderPass(glitchShader);
    composer.addPass(glitchPass);

    let opacity = 0;
    const animate = () => {
      requestAnimationFrame(animate);

      const time = Date.now() * 0.001;
      
      columns.forEach((column, index) => {
        column.rotation.y = time * 0.2 * (index % 2 === 0 ? 1 : -1);
      });

      if (gear) {
        // Rotate the gear's pivot around its Z-axis
        gear.parent.rotation.z = time * 0.5;

        if (opacity < 1) {
          opacity += 0.005;
          gear.traverse((child) => {
            if (child.isMesh) {
              child.material.opacity = opacity;
            }
          });
        }
      }

      // Update shader uniforms
      glitchPass.uniforms["time"].value = time;
      glitchPass.uniforms["distortion"].value = 0.1 + Math.sin(time) * 0.05;
      glitchPass.uniforms["scale"].value = 0.2 + Math.cos(time * 0.7) * 0.1;

      composer.render();
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

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