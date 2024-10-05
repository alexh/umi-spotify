export const glitchShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "time": { value: 0 },
    "distortion": { value: 0.01 }, // Reduced distortion
    "scale": { value: 0.2 }, // Reduced scale
    "glitchIntensity": { value: 0 },
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
    uniform float glitchIntensity;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
      vec3 pantone165 = vec3(1.0, 0.373, 0.122);
      vec2 p = vUv;
      float xs = floor(gl_FragCoord.x / scale);
      float ys = floor(gl_FragCoord.y / scale);
      
      float spike = step(0.95, rand(vec2(time * 0.1)));
      float spikeIntensity = spike * 0.05;
      
      float distortionX = rand(vec2(ys * time, 0.0)) * 2.0 - 1.0;
      float distortionY = rand(vec2(0.0, xs * time)) * 2.0 - 1.0;
      
      p.x += (distortion + spikeIntensity) * distortionX * glitchIntensity;
      p.y += (distortion + spikeIntensity) * distortionY * glitchIntensity;
      
      vec4 normalColor = texture2D(tDiffuse, p);
      
      float r = texture2D(tDiffuse, p + vec2((distortion + spikeIntensity) * 0.05, 0.0) * glitchIntensity).r;
      float g = texture2D(tDiffuse, p + vec2(0.0, (distortion + spikeIntensity) * 0.05) * glitchIntensity).g;
      float b = texture2D(tDiffuse, p - vec2((distortion + spikeIntensity) * 0.05, 0.0) * glitchIntensity).b;
      
      vec3 color = vec3(r, g, b);
      color = mix(color, pantone165, 0.5);
      color = mix(color, vec3(0.0), 1.0 - normalColor.r);
      
      gl_FragColor = vec4(color, normalColor.a);
    }
  `
};

export const calculateGlitchIntensity = (audioAnalysis, elapsedTime, isPlaying, isStars = false) => {
  let glitchIntensity = isStars ? 0.1 : 0.3; // Lower base intensity for stars
  if (audioAnalysis && audioAnalysis.segments && audioAnalysis.segments.length > 0 && isPlaying) {
    const currentTime = elapsedTime % audioAnalysis.track.duration;
    const currentSegment = audioAnalysis.segments.find(segment => 
      segment.start <= currentTime && segment.start + segment.duration > currentTime
    );
    if (currentSegment) {
      const additionalIntensity = ((currentSegment.loudness_max + 60) / 60) * (isStars ? 0.1 : 0.3);
      glitchIntensity += additionalIntensity;
      
      if (Math.random() < 0.05) {
        glitchIntensity += isStars ? 0.1 : 0.3;
      }
    }
  }
  return Math.min(Math.max(glitchIntensity, isStars ? 0.1 : 0.3), isStars ? 0.5 : 1);
};