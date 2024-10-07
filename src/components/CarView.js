import React, { useRef, useState, useEffect, useMemo, useCallback, Suspense, useContext } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, useGLTF } from '@react-three/drei';
import { EffectComposer, Bloom, Pixelation } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Effect } from 'postprocessing';
import { Uniform } from 'three';
import { debounce } from 'lodash';
import { RetroWindow, NowPlayingOverlay, OrangeSlider, MerchWindow } from './SharedComponents';
import CRTEffect from './CRTEffect';
import { themes, ThemeContext } from '../themes';
import { useNavigate } from 'react-router-dom';

// Theme selector component
function ThemeSelector({ position, onPositionChange }) {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <RetroWindow title="Theme Selector" position={position} onPositionChange={onPositionChange}>
      <select 
        value={theme} 
        onChange={(e) => setTheme(e.target.value)}
        style={{
          backgroundColor: themes[theme].secondary,
          color: themes[theme].text
        }}
        className="px-2 py-1 rounded w-full"
      >
        <option value="default">Default</option>
        <option value="monochrome">Monochrome</option>
        <option value="cute">Materials Girl</option>
      </select>
    </RetroWindow>
  );
}

class ThemeFilterEffect extends Effect {
  constructor({ intensity = 1.0, theme = 'default' } = {}) {
    super('ThemeFilterEffect', `
      uniform float intensity;
      uniform vec3 themeColor;
      
      vec3 themeRamp(vec3 color) {
        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        vec3 darkTheme = themeColor * 0.5;
        vec3 lightTheme = themeColor + vec3(0.2);
        return mix(darkTheme, lightTheme, luminance);
      }

      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 themeColor = themeRamp(inputColor.rgb);
        outputColor = vec4(mix(inputColor.rgb, themeColor, intensity), inputColor.a);
      }
    `, {
      uniforms: new Map([
        ['intensity', new Uniform(intensity)],
        ['themeColor', new Uniform(new THREE.Color(themes[theme].primary))]
      ])
    });
  }

  updateTheme(theme) {
    this.uniforms.get('themeColor').value = new THREE.Color(themes[theme].primary);
  }
}

function ThemeFilter({ intensity = 1, theme }) {
  const effect = useMemo(() => new ThemeFilterEffect({ intensity, theme }), [intensity, theme]);
  
  useEffect(() => {
    effect.updateTheme(theme);
  }, [effect, theme]);

  return <primitive object={effect} />;
}

function CarModel({ _token, _currentSong, _isPlaying, _onPlayPause, _onNext, _onPrevious }) {
  const { scene } = useGLTF('/models/Flying_Car-.gltf', true);
  const modelRef = useRef();
  const [carTurnAngle, setCarTurnAngle] = useState(0);
  const targetTurnAngle = useRef(0);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    if (scene) {
      console.log("Updating car model with theme:", theme);
      scene.traverse((child) => {
        if (child.isMesh) {
          if (child.name === "Windshield" || child.name.toLowerCase().includes('glass')) {
            child.material = new THREE.MeshPhysicalMaterial({
              transparent: true,
              opacity: 0.3,
              side: THREE.DoubleSide,
              clearcoat: 1,
              clearcoatRoughness: 0,
              metalness: 0.1,
              roughness: 0.1,
            });
          } else {
            // Update existing material or create a new one
            if (!child.material.isMeshStandardMaterial) {
              child.material = new THREE.MeshStandardMaterial();
            }
            child.material.color.set(themes[theme].primary);
            child.material.metalness = 0.5;
            child.material.roughness = 0.5;
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [scene, theme]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          targetTurnAngle.current = 0.1;
          break;
        case 'ArrowRight':
          targetTurnAngle.current = -0.1;
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        targetTurnAngle.current = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, _delta) => {
    if (modelRef.current) {
      // Smooth car turning
      const turnDifference = targetTurnAngle.current - carTurnAngle;
      setCarTurnAngle(prev => prev + turnDifference * 0.1);

      modelRef.current.position.y = -1.70 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      modelRef.current.rotation.y = carTurnAngle + Math.sin(state.clock.elapsedTime * 0.3) * 0.01;
      
      // Add slight roll when turning
      modelRef.current.rotation.z = -carTurnAngle * 0.2;
    }
  });

  if (!scene) {
    return null;
  }

  return (
    <primitive 
      object={scene} 
      ref={modelRef} 
      position={[-0.70, -1.70, -0.80]} 
      rotation={[0, 0, 0]} 
    />
  );
}

function CameraController({ zoom, fov, carTurnAngle, viewMode }) {
  const { camera } = useThree();
  const basePosition = useMemo(() => {
    return viewMode === 'firstPerson'
      ? new THREE.Vector3(0, 0.7 * zoom, -2.1 * zoom)
      : new THREE.Vector3(0, 5 * zoom, -25 * zoom); // Moved further back for third-person view
  }, [zoom, viewMode]);
  
  const currentPosition = useRef(new THREE.Vector3().copy(basePosition));
  const lookAtTarget = useRef(new THREE.Vector3(0, 1, 5));

  useFrame((state) => {
    // Update position based on car turn angle
    const swayAmount = -carTurnAngle * (viewMode === 'firstPerson' ? 4 : 2);
    currentPosition.current.x = basePosition.x + swayAmount;
    
    // Add a slight vertical movement
    currentPosition.current.y = basePosition.y + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;

    // Smoothly interpolate camera position
    camera.position.lerp(currentPosition.current, 0.1);

    if (viewMode === 'thirdPerson') {
      // Look at a point slightly ahead of and above the car
      lookAtTarget.current.set(swayAmount, 1, 5);
      camera.lookAt(lookAtTarget.current);
      
      // Apply a slight upward tilt
      camera.rotateX(-Math.PI / 12); // Tilt up by 15 degrees
    } else {
      // First-person view
      lookAtTarget.current.set(camera.position.x, camera.position.y, 0);
      camera.lookAt(lookAtTarget.current);
    }

    // Update camera properties
    camera.fov = fov;
    camera.updateProjectionMatrix();
  });

  return null;
}

function ViewToggle({ viewMode, setViewMode, position, onPositionChange }) {
  const { theme } = useContext(ThemeContext);
  const toggleView = () => {
    setViewMode(viewMode === 'firstPerson' ? 'thirdPerson' : 'firstPerson');
  };

  return (
    <RetroWindow title="Camera View" position={position} onPositionChange={onPositionChange}>
      <button 
        onClick={toggleView}
        style={{
          backgroundColor: themes[theme].secondary,
          color: themes[theme].text
        }}
        className="px-4 py-2 rounded transition-colors duration-300 hover:opacity-80 w-full"
      >
        Switch to {viewMode === 'firstPerson' ? 'Third Person' : 'First Person'}
      </button>
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

function Dust({ count, size, speed, color }) {
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
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </instancedMesh>
  );
}

function Scene({ token, currentSong, children, orbitControlsRef, pixelSize, dustSize, dustCount, dustSpeed, isInteractingWithUI }) {
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    console.log("Scene rendered with dust parameters:", { dustSize, dustCount, dustSpeed });
  }, [dustSize, dustCount, dustSpeed]);

  return (
    <Suspense fallback={null}>
      <ambientLight intensity={0.5} color={new THREE.Color(themes[theme].primary)} />
      <directionalLight position={[5, 5, 5]} intensity={1} color={new THREE.Color(themes[theme].primary)} />
      <directionalLight position={[-5, 5, 5]} intensity={0.5} color={new THREE.Color(themes[theme].secondary)} />
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
      <Dust count={dustCount} size={dustSize} speed={dustSpeed} color={themes[theme].secondary} />
      <CarModel 
        token={token}
        currentSong={currentSong}
        isPlaying={false}
        onPlayPause={() => {}}
        onNext={() => {}}
        onPrevious={() => {}}
      />
      <EffectComposer>
        <ThemeFilter intensity={0.8} theme={theme} />
        <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
        <Pixelation granularity={pixelSize * 30} />
      </EffectComposer>
    </Suspense>
  );
}

function CarView3D({ token, currentSong, isPlaying, onPlayPause, onNext, onPrevious, zoom, pixelSize, dustSize, dustCount, dustSpeed, isInteractingWithUI, fov, viewMode }) {
  const orbitControlsRef = useRef();
  const [carTurnAngle, setCarTurnAngle] = useState(0);
  const [currentFov, setCurrentFov] = useState(fov);
  const [currentDustSpeed, setCurrentDustSpeed] = useState(dustSpeed);

  // Fallback for keyboard controls
  const [keys, setKeys] = useState({ ArrowLeft: false, ArrowRight: false, ArrowUp: false });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        setKeys(prevKeys => ({ ...prevKeys, [event.key]: true }));
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        setKeys(prevKeys => ({ ...prevKeys, [event.key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    // Update car turn angle smoothly
    const turnSpeed = 0.5;
    if (keys.ArrowLeft) {
      setCarTurnAngle(angle => Math.max(angle - turnSpeed * delta, -0.1));
    } else if (keys.ArrowRight) {
      setCarTurnAngle(angle => Math.min(angle + turnSpeed * delta, 0.1));
    } else {
      setCarTurnAngle(angle => {
        if (Math.abs(angle) < 0.01) return 0;
        return angle * 0.9; // Gradually return to center
      });
    }

    // Increase FOV and dust speed when ArrowUp is pressed
    if (keys.ArrowUp) {
      setCurrentFov(prevFov => Math.min(prevFov + 30 * delta, 120)); // Max FOV of 120
      setCurrentDustSpeed(prevSpeed => Math.min(prevSpeed + 10 * delta, 20)); // Max speed of 20
    } else {
      setCurrentFov(prevFov => Math.max(prevFov - 30 * delta, fov)); // Return to original FOV
      setCurrentDustSpeed(prevSpeed => Math.max(prevSpeed - 10 * delta, dustSpeed)); // Return to original speed
    }
  });

  return (
    <Scene 
      token={token}
      currentSong={currentSong}
      orbitControlsRef={orbitControlsRef}
      pixelSize={pixelSize}
      dustSize={dustSize}
      dustCount={dustCount}
      dustSpeed={currentDustSpeed}
      isInteractingWithUI={isInteractingWithUI}
    >
      <PerspectiveCamera makeDefault fov={currentFov} />
      <CameraController zoom={zoom} fov={currentFov} carTurnAngle={carTurnAngle} viewMode={viewMode} />
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

function MusicControls({ isPlaying, onPlayPause, onNext, onPrevious, volume, onVolumeChange, position, onPositionChange }) {
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
      <div className="music-controls min-w-60">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <button onClick={debouncedPrevious} style={{ flex: 1 }}>◀◀</button>
          <button onClick={debouncedPlayPause} style={{ flex: 1 }}>{isPlaying ? '||' : '▶'}</button>
          <button onClick={debouncedNext} style={{ flex: 1 }}>▶▶</button>
        </div>
        <div>
          <label htmlFor="volume" style={{ display: 'block', marginBottom: '5px' }}>Volume: </label>
          <OrangeSlider
            value={volume}
            onChange={onVolumeChange}
            min={0}
            max={100}
          />
        </div>
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

function ViewSwitcher({ position, onPositionChange }) {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  const handleViewSwitch = () => {
    navigate('/visualizer');
  };

  return (
    <RetroWindow title="View Switcher" position={position} onPositionChange={onPositionChange}>
      <div className="flex flex-col items-center">
        <button 
          onClick={handleViewSwitch}
          style={{
            backgroundColor: themes[theme].secondary,
            color: themes[theme].text
          }}
          className="px-4 py-2 rounded transition-colors duration-300 hover:opacity-80 w-full text-center"
        >
          Switch to Visualizer View
        </button>
      </div>
    </RetroWindow>
  );
}

export default function CarView({ token, isPlaying, onPlayPause, onNext, onPrevious, currentSong, currentArtist, playerControls }) {
  const [viewMode, setViewMode] = useState('firstPerson');
  const [zoom, setZoom] = useState(0.47);
  const [pixelSize, setPixelSize] = useState(0.3); // Change initial value to 0.01
  const [dustSize] = useState(0.02);
  const [dustCount] = useState(1000);
  const [dustSpeed] = useState(5);
  const [volume, setVolume] = useState(50);  // Initial volume set to 50%
  const fov = 75;
  const [theme, setTheme] = useState('default');

  const [windowPositions, setWindowPositions] = useState({
    pixelation: { x: 20, y: 80 },
    dust: { x: 20, y: 120 },
    view: { x: 20, y: window.innerHeight - 150 },
    music: { x: window.innerWidth - 300, y: window.innerHeight - 160 },
    merch: { x: window.innerWidth - 300, y: 200 },
    switcher: { x: window.innerWidth - 300, y: 80 },
    fov: { x: 20, y: window.innerHeight - 220 },
    themeSelector: { x: 20, y: window.innerHeight - 280 },
  });

  const [isInteractingWithUI, setIsInteractingWithUI] = useState(false);

  const updateWindowPosition = (window, newPosition) => {
    setWindowPositions(prev => ({
      ...prev,
      [window]: newPosition
    }));
  };

  useEffect(() => {
    setZoom(viewMode === 'firstPerson' ? 0.47 : 1.5); // Adjusted zoom for third-person view
  }, [viewMode]);

  const handleMouseEnterUI = useCallback(() => setIsInteractingWithUI(true), []);
  const handleMouseLeaveUI = useCallback(() => setIsInteractingWithUI(false), []);

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    // Assuming you have a method to set volume in your Spotify player
    // If not, you'll need to implement this
    // playerControls.setVolume(newVolume / 100);
  }, []);

  const [tempo, setTempo] = useState(null);

  useEffect(() => {
    const updateTempo = () => {
      if (playerControls && typeof playerControls.getTempo === 'function') {
        setTempo(playerControls.getTempo());
      }
    };

    updateTempo();
    const intervalId = setInterval(updateTempo, 1000);

    return () => clearInterval(intervalId);
  }, [playerControls]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      console.log("Key pressed:", event.key);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <CRTEffect isPlaying={isPlaying} tempo={tempo}>
        <div className="relative w-screen h-screen" style={{ backgroundColor: themes[theme].background }}>
          <div className="absolute inset-0 z-10">
            <Canvas>
              <Suspense fallback={null}>
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
                  fov={fov}
                />
              </Suspense>
            </Canvas>
          </div>
          
          <div className="absolute inset-0 z-20 pointer-events-none">
            <NowPlayingOverlay currentSong={currentSong} artist={currentArtist} />
            <div className="pointer-events-auto" onMouseEnter={handleMouseEnterUI} onMouseLeave={handleMouseLeaveUI}>
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
                volume={volume}
                onVolumeChange={handleVolumeChange}
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
              <ThemeSelector 
                position={windowPositions.themeSelector}
                onPositionChange={(newPos) => updateWindowPosition('themeSelector', newPos)}
              />
            </div>
          </div>
        </div>
      </CRTEffect>
    </ThemeContext.Provider>
  );
}

// Preload the model
useGLTF.preload('/models/Flying_Car-.gltf');