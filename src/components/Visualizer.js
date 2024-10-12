import React, { useRef, useEffect, useState, useContext } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { glitchShader, calculateGlitchIntensity } from '../utils/glitchEffect';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { ThemeContext, themes } from '../themes';

const phrases = [
  "Gears Turning, Time Burning",
  "Maximum Torque, Minimum Talk",
  "Metal And Mettle",
  "Decibels And Deadlines",
  "Calibrated Chaos",
  "Wrenching Reality",
  "Forged Under Pressure",
  "Precision And Grit",
  "Machined Monotony",
  "Fuel For The Grind",
  "Hard Hat Zone",
  "Cutting Through The Static",
  "Music For Work",
  "Designed With Thought"
];

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
  uniform vec3 themeColor;
  
  varying vec3 vNormal;

  void main() {
    // Use the theme color instead of a hard-coded color
    vec3 baseColor = themeColor;
    
    // Directional light
    vec3 light = normalize(vec3(1.0, 1.0, 1.0));
    float dProd = max(0.0, dot(vNormal, light));

    // Ambient light
    float ambientStrength = 0.3;
    vec3 ambient = ambientStrength * baseColor;

    // Combine directional and ambient light
    vec3 result = (ambient + dProd) * baseColor;

    // Enhance the edges with a fresnel-like effect
    float fresnelStrength = 0.5;
    float fresnel = fresnelStrength * (1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)));
    result += fresnel * baseColor;

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

function create3DText(scene, camera, updateScore, currentTheme) {
  const textMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(themes[currentTheme].secondary) },
      pulseColor: { value: new THREE.Color(themes[currentTheme].primary) },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform vec3 pulseColor;
      uniform float time;
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
        float pulse = (sin(time * 2.0) + 1.0) * 0.5;
        vec3 finalColor = mix(color, pulseColor, pulse * 0.3);
        gl_FragColor = vec4(mix(finalColor, vec3(1.0), intensity), 1.0);
      }
    `,
  });

  let textMesh = null;
  const maxSpeed = 0.01;
  let speed = { 
    x: (Math.random() * 2 - 1) * maxSpeed, 
    y: (Math.random() * 2 - 1) * maxSpeed 
  };
  const boundaryPadding = 0.1;
  let cornerHits = 0;

  // Add ambient light to the scene
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  function animatePlusText(plusMesh) {
    let animationFrames = 0;
    function animate() {
      plusMesh.position.y += 0.01;
      plusMesh.material.opacity -= 0.02;
      animationFrames++;

      if (animationFrames < 50) {
        requestAnimationFrame(animate);
      } else {
        scene.remove(plusMesh);
      }
    }
    animate();
  }

  function updateText(previousPosition = null, previousSpeed = null) {
    if (textMesh) scene.remove(textMesh);

    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    // Use the FontLoader to load the local font file
    const loader = new FontLoader();
    loader.load('/Receipt_Narrow_Regular.json', function(font) {
      const textGeometry = new TextGeometry(phrase, {
        font: font,
        size: 0.5,
        height: 0.1,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
      });

      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
      const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;

      // Center the geometry
      textGeometry.translate(-textWidth / 2, -textHeight / 2, 0);

      textMesh = new THREE.Mesh(textGeometry, textMaterial);
      if (previousPosition) {
        textMesh.position.copy(previousPosition);
        speed = previousSpeed;
      } else {
        textMesh.position.set(0, 0, -5);
      }
      scene.add(textMesh);

      // Use window dimensions for boundary
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Convert window dimensions to 3D space coordinates
      const aspectRatio = windowWidth / windowHeight;
      const vFov = camera.fov * Math.PI / 180;
      const height = 2 * Math.tan(vFov / 2) * Math.abs(textMesh.position.z) + 6;
      const width = height * aspectRatio;

      console.log('Window dimensions:', { width: windowWidth, height: windowHeight });
      console.log('3D space dimensions:', { width, height });
      console.log('Text dimensions:', { width: textWidth, height: textHeight });

      function animateText() {
        if (!textMesh) return;

        textMesh.position.x += speed.x;
        textMesh.position.y += speed.y;

        // Update the time uniform for pulsing effect
        textMaterial.uniforms.time.value += 0.016;

        const leftBound = -width / 2 + textWidth / 2 + boundaryPadding;
        const rightBound = width / 2 - textWidth / 2 - boundaryPadding;
        const topBound = height / 2 - textHeight / 2 - boundaryPadding;
        const bottomBound = -height / 2 + textHeight / 2 + boundaryPadding;

        let hitCorner = false;

        // Increase the threshold for corner detection
        const cornerThreshold = 0.1; // Increased from 0.1 to 0.2

        if (textMesh.position.x <= leftBound || textMesh.position.x >= rightBound) {
          speed.x *= -1;
          textMesh.position.x = Math.max(leftBound, Math.min(rightBound, textMesh.position.x));
          // console.log('Horizontal bounce at:', textMesh.position.x);
          hitCorner = Math.abs(textMesh.position.y - topBound) < cornerThreshold || 
                      Math.abs(textMesh.position.y - bottomBound) < cornerThreshold;
        }
        if (textMesh.position.y <= bottomBound || textMesh.position.y >= topBound) {
          speed.y *= -1;
          textMesh.position.y = Math.max(bottomBound, Math.min(topBound, textMesh.position.y));
          // console.log('Vertical bounce at:', textMesh.position.y);
          hitCorner = hitCorner || 
                      Math.abs(textMesh.position.x - leftBound) < cornerThreshold || 
                      Math.abs(textMesh.position.x - rightBound) < cornerThreshold;
        }

        // Enforce max speed after bounces
        speed.x = Math.sign(speed.x) * Math.min(Math.abs(speed.x), maxSpeed);
        speed.y = Math.sign(speed.y) * Math.min(Math.abs(speed.y), maxSpeed);

        // Check if it hit a corner
        if (hitCorner) {
          cornerHits++;
          console.log(`Corner hit! Total hits: ${cornerHits}`);
          
          // Update the score
          updateScore(cornerHits * 100);
          
          // Create and animate +100 text
          const plusGeometry = new TextGeometry('+100', {
            font: font,
            size: 0.2,
            height: 0.05,
          });
          const plusMesh = new THREE.Mesh(plusGeometry, textMaterial);
          plusMesh.position.copy(textMesh.position);
          plusMesh.position.y += 0.5;
          scene.add(plusMesh);

          // Animate the +100 text
          animatePlusText(plusMesh);
        }

        textMesh.lookAt(camera.position);

        requestAnimationFrame(animateText);
      }

      animateText();
    });
  }

  // Modify the interval to use a callback
  function scheduleNextUpdate() {
    setTimeout(() => {
      if (textMesh) {
        const previousPosition = textMesh.position.clone();
        const previousSpeed = { ...speed };
        updateText(previousPosition, previousSpeed);
      } else {
        updateText();
      }
      scheduleNextUpdate();
    }, 10000);
  }

  updateText();
  scheduleNextUpdate();
}

function Visualizer({ isPlaying, _volume, audioAnalysis, updateScore, isMobile, isInverted, _theme }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const textSceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const composerRef = useRef(null);
  const meshRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const targetRotationRef = useRef({ y: 0, z: 0 });
  const currentRotationRef = useRef({ y: 0, z: 0 });
  const [font, setFont] = useState(null);
  const { theme: currentTheme } = useContext(ThemeContext);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    targetRotationRef.current.y = isPlaying ? Math.PI : 0;
  }, [isPlaying]);

  useEffect(() => {
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const textScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(64, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: false });

    renderer.setSize(width, height);
    renderer.setClearColor(themes[currentTheme].primary, 1);
    mountRef.current?.appendChild(renderer.domElement);

    camera.position.z = 5;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    sceneRef.current = scene;
    textSceneRef.current = textScene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_frequency: { value: 0 },
        themeColor: { value: new THREE.Color(themes[currentTheme].primary) }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      wireframe: false,
    });

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
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        
        model.position.sub(center);
        
        const modelGroup = new THREE.Group();
        modelGroup.add(model);
        
        modelGroup.scale.set(1.7, 1.7, 1.7);
        scene.add(modelGroup);
        meshRef.current = modelGroup;
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('An error happened', error);
      }
    );

    const clock = new THREE.Clock();

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const glitchPass = new ShaderPass(glitchShader);
    composer.addPass(glitchPass);

    const pixelPass = new ShaderPass(pixelationShader);
    pixelPass.uniforms["resolution"].value = new THREE.Vector2(width, height);
    pixelPass.uniforms["pixelSize"].value = 1;
    composer.addPass(pixelPass);

    composerRef.current = composer;

    if (!isMobile) {
      const fontLoader = new FontLoader();
      fontLoader.load('/Receipt_Narrow_Regular.json', (loadedFont) => {
        setFont(loadedFont);
      });
    }

    const handleResize = () => {
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
      composer.setSize(newWidth, newHeight);

      pixelPass.uniforms["resolution"].value.set(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      material.uniforms.u_time.value = elapsedTime;
      
      if (meshRef.current) {
        // Smooth rotation for play/pause (y-axis flip)
        currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.1;
        meshRef.current.rotation.y = currentRotationRef.current.y;

        // Continuous rotation on z-axis when playing
        if (isPlayingRef.current) {
          targetRotationRef.current.z += 0.02;
        }
        currentRotationRef.current.z += (targetRotationRef.current.z - currentRotationRef.current.z) * 0.1;
        meshRef.current.rotation.z = currentRotationRef.current.z;

        material.uniforms.themeColor.value.set(themes[currentTheme].primary);
      }

      const glitchIntensity = calculateGlitchIntensity(audioAnalysis, elapsedTime, isPlayingRef.current, false);

      glitchPass.uniforms.time.value = elapsedTime;
      glitchPass.uniforms.glitchIntensity.value = glitchIntensity;

      const pulseFrequency = 0.1;
      const pulseMagnitude = 15;
      const pixelSize = 1 + Math.abs(Math.sin(elapsedTime * Math.PI * pulseFrequency)) * pulseMagnitude;
      pixelPass.uniforms["pixelSize"].value = pixelSize;

      composer.render();

      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(textSceneRef.current, camera);

      renderer.setClearColor(themes[currentTheme].primary, 1);

      if (isInverted) {
        renderer.domElement.style.filter = 'invert(100%)';
      } else {
        renderer.domElement.style.filter = 'none';
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [audioAnalysis, isPlaying, updateScore, isMobile, isInverted, currentTheme]);

  useEffect(() => {
    if (!isMobile && font && textSceneRef.current && cameraRef.current) {
      create3DText(textSceneRef.current, cameraRef.current, updateScore, currentTheme);
    }
  }, [font, updateScore, isMobile, currentTheme]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}

export default React.memo(Visualizer);