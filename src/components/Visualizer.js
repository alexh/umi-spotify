import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { glitchShader, calculateGlitchIntensity } from '../utils/glitchEffect';

const vertexShader = `
  uniform float u_time;
  uniform float u_frequency;

  varying vec3 vNormal;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

  float pnoise(vec3 P, vec3 rep) {
    vec3 Pi0 = mod(floor(P), rep);
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
  }

  void main() {
    vNormal = normal;
    float noise = 3.0 * pnoise(position + u_time, vec3(10.0));
    float displacement = (u_frequency / 100.0) * (noise / 10.0);
    vec3 newPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  
  varying vec3 vNormal;

  void main() {
    vec3 pantone165 = vec3(1.0, 0.373, 0.122); // Pantone 165 in RGB
    
    // Directional light
    vec3 light = normalize(vec3(1.0, 1.0, 1.0));
    float dProd = max(0.0, dot(vNormal, light));

    // Ambient light
    float ambientStrength = 0.3;
    vec3 ambient = ambientStrength * pantone165;

    // Combine directional and ambient light
    vec3 result = (ambient + dProd) * pantone165;

    // Enhance the edges with a fresnel-like effect
    float fresnelStrength = 0.5;
    float fresnel = fresnelStrength * (1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)));
    result += fresnel * pantone165;

    // Add some time-based color variation
    result += 0.1 * vec3(sin(u_time), cos(u_time), sin(u_time * 0.5));

    gl_FragColor = vec4(result, 1.0);
  }
`;

// Update pixelation shader
const pixelationShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "resolution": { value: new THREE.Vector2() },
    "pixelSize": { value: 1 },
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
    uniform float pixelSize;
    varying vec2 vUv;
    void main() {
      vec2 dxy = pixelSize / resolution;
      vec2 coord = dxy * floor(vUv / dxy);
      gl_FragColor = texture2D(tDiffuse, coord);
    }
  `
};

function Visualizer({ isPlaying, volume, audioAnalysis }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const animationFrameRef = useRef(null);
  const uniformsRef = useRef({
    u_time: { value: 0 },
    u_frequency: { value: 0 },
  });
  const isPlayingRef = useRef(isPlaying);
  const targetRotationRef = useRef({ y: 0, z: 0 });
  const currentRotationRef = useRef({ y: 0, z: 0 });

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    targetRotationRef.current.y = isPlaying ? Math.PI : 0;
  }, [isPlaying]);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: false }); // Disable antialiasing for pixelation effect

    renderer.setSize(width, height);
    renderer.setClearColor(0xFF5F1F, 1); // Set background to Pantone 165
    mountRef.current.appendChild(renderer.domElement);

    camera.position.z = 5;

    // Material setup
    const material = new THREE.ShaderMaterial({
      uniforms: uniformsRef.current,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      wireframe: false, // Change this to false to see the full surface
    });

    // Load the gear model
    const loader = new GLTFLoader();
    loader.load(
      '/models/gear.gltf',
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.material = material;
          }
        });
        
        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        
        model.children.forEach((child) => {
          child.position.sub(center);
        });

        model.scale.set(1.7, 1.7, 1.7); // Fixed scale, no dynamic scaling
        scene.add(model);
        meshRef.current = model;
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('An error happened', error);
      }
    );

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const clock = new THREE.Clock();

    // Post-processing setup
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const glitchPass = new ShaderPass(glitchShader);
    composer.addPass(glitchPass);

    const pixelPass = new ShaderPass(pixelationShader);
    pixelPass.uniforms["resolution"].value = new THREE.Vector2(width, height);
    pixelPass.uniforms["pixelSize"].value = 1;
    composer.addPass(pixelPass);

    // Animation
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      uniformsRef.current.u_time.value = elapsedTime;
      
      if (meshRef.current) {
        // Smoothly interpolate rotation
        currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.1;
        meshRef.current.rotation.y = currentRotationRef.current.y;

        if (isPlayingRef.current) {
          targetRotationRef.current.z += 0.005;
        }
        currentRotationRef.current.z += (targetRotationRef.current.z - currentRotationRef.current.z) * 0.1;
        meshRef.current.rotation.z = currentRotationRef.current.z;
      }

      const glitchIntensity = calculateGlitchIntensity(audioAnalysis, elapsedTime, isPlayingRef.current, false);

      glitchPass.uniforms.time.value = elapsedTime;
      glitchPass.uniforms.glitchIntensity.value = glitchIntensity;

      // Pulsing pixelation effect
      const pulseFrequency = 0.1; // 1 / 10 seconds
      const pulseMagnitude = 15; // Maximum pixel size
      const pixelSize = 1 + Math.abs(Math.sin(elapsedTime * Math.PI * pulseFrequency)) * pulseMagnitude;
      pixelPass.uniforms["pixelSize"].value = pixelSize;

      composer.render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      composer.setSize(newWidth, newHeight);
      pixelPass.uniforms["resolution"].value.set(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [audioAnalysis, isPlaying]);

  console.log("Visualizer render", { isPlaying, volume, hasAudioAnalysis: !!audioAnalysis });

  return <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />;
}
export default React.memo(Visualizer);
