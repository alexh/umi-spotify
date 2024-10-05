import React, { useRef, useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useLoader, useThree, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, PerspectiveCamera, Text, Instances, Instance } from '@react-three/drei';
import { EffectComposer, ColorDepth, Pixelation } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Effect } from 'postprocessing';
import { Uniform } from 'three';
import { debounce } from 'lodash';  // Add this import at the top of the file
import { RetroWindow, NowPlayingOverlay, OrangeSlider } from './SharedComponents';
import CRTEffect from './CRTEffect';
import ViewSwitcher from './ViewSwitcher';

class OrangeFilterEffect extends Effect {
  constructor({ intensity = 1.0 } = {}) {
    super('OrangeFilterEffect', `
      uniform float intensity;
      
      vec3 orangeRamp(vec3 color) {
        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        vec3 darkOrange = vec3(0.5, 0.2, 0.0);
        vec3 lightOrange = vec3(1.0, 0.6, 0.2);
        return mix(darkOrange, lightOrange, luminance);
      }

      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 orangeColor = orangeRamp(inputColor.rgb);
        outputColor = vec4(mix(inputColor.rgb, orangeColor, intensity), inputColor.a);
      }
    `, {
      uniforms: new Map([['intensity', new Uniform(intensity)]])
    });
  }
}

function OrangeFilter({ intensity = 1 }) {
  const effect = new OrangeFilterEffect({ intensity });
  return <primitive object={effect} />;
}

function PixelationEffect({ pixelSize }) {
  return <Pixelation granularity={pixelSize} />;
}

// Create a shared animation state
const useAnimationState = () => {
  const ref = useRef({ y: 0, rotX: 0, rotZ: 0 });
  
  useFrame((_, delta) => {
    const time = Date.now() * 0.001;
    ref.current.y = Math.sin(time * 0.5) * 0.05;
    ref.current.rotX = Math.sin(time * 0.4) * 0.01;
    ref.current.rotZ = Math.sin(time * 0.3) * 0.01;
  });

  return ref;
};

function CarModel({ token, currentSong, isPlaying, onPlayPause, onNext, onPrevious }) {
  const gltf = useLoader(GLTFLoader, '/models/Flying_Car-.gltf');
  const modelRef = useRef();
  const animationState = useAnimationState();

  useEffect(() => {
    console.log("CarModel rendered, gltf:", gltf);
    if (gltf.scene) {
      console.log("GLTF scene loaded, traversing children:");
      gltf.scene.traverse((child) => {
        console.log("Child:", child.name, child.type);
        if (child.isMesh) {
          console.log("Mesh found:", child.name);
          if (child.name === "Windshield" || child.name.toLowerCase().includes('glass')) {
            console.log("Found windshield or glass:", child.name);
            child.material = new THREE.MeshPhysicalMaterial({
              transparent: true,
              opacity: 0.3,
              side: THREE.DoubleSide,
              clearcoat: 1,
              clearcoatRoughness: 0,
              metalness: 0.1,
              roughness: 0.1,
            });
          }
        }
      });
    }
  }, [gltf]);

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.position.y = -1.70 + animationState.current.y;
      modelRef.current.rotation.x = animationState.current.rotX;
      modelRef.current.rotation.z = animationState.current.rotZ;
    }
  });

  if (!gltf.scene) {
    console.log("GLTF scene not loaded");
    return null;
  }

  return (
    <primitive 
      object={gltf.scene} 
      ref={modelRef} 
      position={[-0.70, -1.70, -0.80]} 
      rotation={[0, 0, 0]} 
    />
  );
}

function CameraController({ zoom }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.lerp(new THREE.Vector3(0, 0.7 * zoom, -2.1 * zoom), 0.1);
    camera.updateProjectionMatrix();
  });
  return null;
}

function ViewToggle({ viewMode, setViewMode, position, onPositionChange }) {
  return (
    <RetroWindow title="Camera View Selector" position={position} onPositionChange={onPositionChange}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label>
          <input 
            type="radio" 
            checked={viewMode === 'firstPerson'} 
            onChange={() => setViewMode('firstPerson')}
          /> First Person
        </label>
        <label>
          <input 
            type="radio" 
            checked={viewMode === 'thirdPerson'} 
            onChange={() => setViewMode('thirdPerson')}
          /> Third Person
        </label>
      </div>
    </RetroWindow>
  );
}

function RotatingSongText({ song, radius, height, scale }) {
  const textRef = useRef();
  const [rotation, setRotation] = useState(0);

  useFrame((state, delta) => {
    setRotation((prev) => prev + delta * 0.8); // Adjust the multiplier to change rotation speed
    if (textRef.current) {
      const x = Math.sin(rotation) * radius;
      const z = Math.cos(rotation) * radius;
      textRef.current.position.set(x, height, z);
      textRef.current.lookAt(0, height, 0);
    }
  });

  return (
    <Text
      ref={textRef}
      scale={scale}
      fontSize={0.5}
      color="white"
      anchorX="center"
      anchorY="middle"
      fontWeight={400}
    >
      {song || "No song playing"}
      <meshNormalMaterial />
    </Text>
  );
}

function Dust({ count, size, speed }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 20,  // x: wider spread
        (Math.random() - 0.5) * 10,  // y: good vertical spread
        Math.random() * 20 + 10      // z: start further away
      );
      const velocity = new THREE.Vector3(0, 0, -speed);
      temp.push({ position, velocity });
    }
    return temp;
  }, [count, speed]);

  useFrame((state, delta) => {
    particles.forEach((particle, i) => {
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));
      if (particle.position.z < -5) {
        particle.position.set(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10,
          Math.random() * 20 + 10
        );
      }
      dummy.position.copy(particle.position);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <boxGeometry args={[size, size, size]} />
      <meshBasicMaterial color="#CC4C19" transparent opacity={0.3} />
    </instancedMesh>
  );
}

function DustControls({ dustSize, setDustSize, dustCount, setDustCount, dustSpeed, setDustSpeed, position, onPositionChange }) {
  return (
    <RetroWindow title="Dust Controls" position={position} onPositionChange={onPositionChange}>
      <div>
        <label>Size: {dustSize.toFixed(3)}</label>
        <input
          type="range"
          min="0.01"
          max="0.1"
          step="0.001"
          value={dustSize}
          onChange={(e) => setDustSize(parseFloat(e.target.value))}
          style={{ width: '100%', margin: '5px 0' }}
        />
      </div>
      <div>
        <label>Count: {dustCount}</label>
        <input
          type="range"
          min="100"
          max="2000"
          step="100"
          value={dustCount}
          onChange={(e) => setDustCount(parseInt(e.target.value))}
          style={{ width: '100%', margin: '5px 0' }}
        />
      </div>
      <div>
        <label>Speed: {dustSpeed.toFixed(1)}</label>
        <input
          type="range"
          min="1"
          max="20"
          step="0.1"
          value={dustSpeed}
          onChange={(e) => setDustSpeed(parseFloat(e.target.value))}
          style={{ width: '100%', margin: '5px 0' }}
        />
      </div>
    </RetroWindow>
  );
}

function Scene({ token, currentSong, setCurrentSong, children, orbitControlsRef, pixelSize, dustSize, dustCount, dustSpeed, isInteractingWithUI }) {
  useEffect(() => {
    console.log("Scene rendered with dust parameters:", { dustSize, dustCount, dustSpeed });
  }, [dustSize, dustCount, dustSpeed]);

  return (
    <Suspense fallback={null}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, 5, 5]} intensity={0.5} />
      {children}
      <RotatingSongText 
        song={currentSong} 
        radius={12.80}
        height={0.80}
        scale={8.40}
      />
      <OrbitControls 
        ref={orbitControlsRef} 
        enableZoom={false} 
        enablePan={false} 
        enableRotate={!isInteractingWithUI} 
      />
      <Dust count={dustCount} size={dustSize} speed={dustSpeed} />
      <CarModel 
        token={token}
        currentSong={currentSong}
        isPlaying={false}
        onPlayPause={() => {}}
        onNext={() => {}}
        onPrevious={() => {}}
      />
      <EffectComposer>
        <OrangeFilter intensity={0.8} />
        <Pixelation granularity={pixelSize * 30} />
      </EffectComposer>
    </Suspense>
  );
}

function CarView3D({ token, currentSong, isPlaying, onPlayPause, onNext, onPrevious, viewMode, zoom, pixelSize, dustSize, dustCount, dustSpeed, isInteractingWithUI }) {
  const orbitControlsRef = useRef();

  return (
    <Scene 
      token={token}
      currentSong={currentSong}
      orbitControlsRef={orbitControlsRef}
      pixelSize={pixelSize}
      dustSize={dustSize}
      dustCount={dustCount}
      dustSpeed={dustSpeed}
      isInteractingWithUI={isInteractingWithUI}
    >
      <PerspectiveCamera makeDefault fov={75} />
      <CameraController zoom={zoom} />
      <CarModel 
        token={token}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    </Scene>
  );
}

function MusicControls({ isPlaying, onPlayPause, onNext, onPrevious, position, onPositionChange }) {
  const debouncedPlayPause = useCallback(
    debounce(() => {
      onPlayPause();
    }, 300, { leading: true, trailing: false }),
    [onPlayPause]
  );

  const debouncedNext = useCallback(
    debounce(() => {
      onNext();
    }, 300, { leading: true, trailing: false }),
    [onNext]
  );

  const debouncedPrevious = useCallback(
    debounce(() => {
      onPrevious();
    }, 300, { leading: true, trailing: false }),
    [onPrevious]
  );

  return (
    <RetroWindow title="Music Controls" position={position} onPositionChange={onPositionChange}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={debouncedPrevious} style={{ flex: 1 }}>◀◀</button>
        <button onClick={debouncedPlayPause} style={{ flex: 1 }}>{isPlaying ? '||' : '▶'}</button>
        <button onClick={debouncedNext} style={{ flex: 1 }}>▶▶</button>
      </div>
    </RetroWindow>
  );
}

function PixelationSlider({ pixelSize, setPixelSize, position, onPositionChange }) {
  return (
    <RetroWindow title="Pixelation Control" position={position} onPositionChange={onPositionChange}>
      <OrangeSlider
        value={pixelSize * 100} // Convert to 0-100 range
        onChange={(value) => setPixelSize(value / 100)} // Convert back to 0-1 range
        min={0}
        max={100}
      />
      <div>Value: {pixelSize.toFixed(2)}</div>
    </RetroWindow>
  );
}

function MerchWindow({ position, onPositionChange }) {
  return (
    <RetroWindow title="Merch" position={position} onPositionChange={onPositionChange}>
      <div className="flex flex-col items-center" style={{ width: '200px', height: '350px' }}>
        <div style={{ width: '100%', height: '350px', overflow: 'hidden' }}>
          <img src="/merch.png" alt="Merchandise" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <a 
          href="https://utility.materials.nyc" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-[#CC4C19] text-white px-4 py-2 mt-2 rounded hover:bg-[#FF8C00] transition-colors"
        >
          Buy Now
        </a>
      </div>
    </RetroWindow>
  );
}

export default function CarView({ token, isPlaying, onPlayPause, onNext, onPrevious, currentSong, currentArtist }) {
  const [viewMode, setViewMode] = useState('firstPerson');
  const [zoom, setZoom] = useState(0.47);
  const [pixelSize, setPixelSize] = useState(0.31);
  const [dustSize, setDustSize] = useState(0.02);
  const [dustCount, setDustCount] = useState(1000);
  const [dustSpeed, setDustSpeed] = useState(5);

  const [windowPositions, setWindowPositions] = useState({
    pixelation: { x: 20, y: 80 },
    dust: { x: 20, y: 120 },
    view: { x: 20, y: window.innerHeight - 150 },
    music: { x: window.innerWidth - 200, y: window.innerHeight - 120 },
    merch: { x: window.innerWidth - 250, y: 80 },
    switcher: { x: window.innerWidth - 150, y: 20 }
  });

  const [isInteractingWithUI, setIsInteractingWithUI] = useState(false);

  const updateWindowPosition = (window, newPosition) => {
    setWindowPositions(prev => ({
      ...prev,
      [window]: newPosition
    }));
  };

  useEffect(() => {
    setZoom(viewMode === 'firstPerson' ? 0.47 : 3);
  }, [viewMode]);

  const handleMouseEnterUI = () => setIsInteractingWithUI(true);
  const handleMouseLeaveUI = () => setIsInteractingWithUI(false);

  return (
    <CRTEffect>
      <div className="relative w-screen h-screen">
        <div className="absolute inset-0 z-10">
          <Canvas>
            <CarView3D 
              token={token}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayPause={onPlayPause}
              onNext={onNext}
              onPrevious={onPrevious}
              viewMode={viewMode}
              zoom={zoom}
              pixelSize={pixelSize}
              dustSize={dustSize}
              dustCount={dustCount}
              dustSpeed={dustSpeed}
              isInteractingWithUI={isInteractingWithUI}
            />
          </Canvas>
        </div>
        
        <div className="absolute inset-0 z-20 pointer-events-none">
          <NowPlayingOverlay currentSong={currentSong} artist={currentArtist} />
          <div className="pointer-events-auto">
            <PixelationSlider 
              pixelSize={pixelSize} 
              setPixelSize={setPixelSize} 
              position={windowPositions.pixelation}
              onPositionChange={(newPos) => updateWindowPosition('pixelation', newPos)}
            />
            <ViewToggle 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
              position={windowPositions.view}
              onPositionChange={(newPos) => updateWindowPosition('view', newPos)}
            />
            <MusicControls 
              isPlaying={isPlaying}
              onPlayPause={onPlayPause}
              onNext={onNext}
              onPrevious={onPrevious}
              position={windowPositions.music}
              onPositionChange={(newPos) => updateWindowPosition('music', newPos)}
            />
            <MerchWindow 
              position={windowPositions.merch}
              onPositionChange={(newPos) => updateWindowPosition('merch', newPos)}
            />
            <ViewSwitcher 
              position={windowPositions.switcher}
              onPositionChange={(newPos) => updateWindowPosition('switcher', newPos)}
            />
          </div>
        </div>
      </div>
    </CRTEffect>
  );
}