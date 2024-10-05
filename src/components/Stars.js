import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { glitchShader, calculateGlitchIntensity } from '../utils/glitchEffect';

// Add a new blur shader
const blurShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "resolution": { value: new THREE.Vector2() },
    "blurRadius": { value: 4.0 },
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
    uniform vec2 resolution;
    uniform float blurRadius;
    varying vec2 vUv;

    void main() {
      vec4 sum = vec4(0.0);
      vec2 texelSize = vec2(1.0 / resolution.x, 1.0 / resolution.y);
      
      for(float x = -blurRadius; x <= blurRadius; x++) {
        for(float y = -blurRadius; y <= blurRadius; y++) {
          vec2 offset = vec2(x, y) * texelSize;
          sum += texture2D(tDiffuse, vUv + offset);
        }
      }
      
      gl_FragColor = sum / pow(blurRadius * 2.0 + 1.0, 2.0);
    }
  `
};

function Stars({ isPlaying, volume, audioAnalysis }) {
  const mountRef = useRef(null);
  const starsRef = useRef(null);
  const trailsRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, width, 0, height, 0.1, 1000);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const blurPass = new ShaderPass(blurShader);
    blurPass.uniforms["resolution"].value = new THREE.Vector2(width, height);
    blurPass.uniforms["blurRadius"].value = 4.0;
    composer.addPass(blurPass);

    const glitchPass = new ShaderPass(glitchShader);
    composer.addPass(glitchPass);

    const starMaterial = new THREE.PointsMaterial({
      size: 5,
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.4,
      depthTest: false,
    });

    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    const starCount = 40;
    const positions = new Float32Array(starCount * 3);
    const speeds = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = Math.random() * width;
      positions[i * 3 + 1] = Math.random() * height;
      positions[i * 3 + 2] = 0;
      speeds[i] = Math.random() * 0.5 + 0.5; // Varied speed for each star
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    starsRef.current = new THREE.Points(starGeometry, starMaterial);
    scene.add(starsRef.current);

    // Initialize trails
    for (let i = 0; i < starCount; i++) {
      const trailGeometry = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(3 * 3); // 30 points per trail
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      const trail = new THREE.Line(trailGeometry, trailMaterial);
      scene.add(trail);
      trailsRef.current.push(trail);
    }

    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      const positions = starsRef.current.geometry.attributes.position.array;

      for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        const speed = speeds[i] * (isPlaying ? volume * 2 : 0.2); // Use individual speed, affected by volume when playing

        // Move stars from top to bottom
        positions[i3 + 1] += speed;
        if (positions[i3 + 1] > height) {
          positions[i3 + 1] = 0;
        }

        // Update trail
        const trailPositions = trailsRef.current[i].geometry.attributes.position.array;
        for (let j = trailPositions.length - 1; j > 2; j -= 3) {
          trailPositions[j] = trailPositions[j - 3];
          trailPositions[j - 1] = trailPositions[j - 4];
          trailPositions[j - 2] = trailPositions[j - 5];
        }
        trailPositions[0] = positions[i3];
        trailPositions[1] = positions[i3 + 1];
        trailPositions[2] = positions[i3 + 2];
        trailsRef.current[i].geometry.attributes.position.needsUpdate = true;

        // Vary trail opacity based on speed
        trailsRef.current[i].material.opacity = speed / 2;
      }

      starsRef.current.geometry.attributes.position.needsUpdate = true;

      const glitchIntensity = calculateGlitchIntensity(audioAnalysis, elapsedTime, isPlaying, true);

      glitchPass.uniforms.time.value = elapsedTime;
      glitchPass.uniforms.glitchIntensity.value = glitchIntensity * 0.3; // Reduced glitch intensity

      composer.render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.right = newWidth;
      camera.bottom = newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      composer.setSize(newWidth, newHeight);
      blurPass.uniforms["resolution"].value.set(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      mount.removeChild(renderer.domElement);
    };
  }, [isPlaying, volume, audioAnalysis]);

  return <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }} />;
}

export default Stars;