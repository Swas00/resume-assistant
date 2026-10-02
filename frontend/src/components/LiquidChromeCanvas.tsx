import { useEffect, useRef, useState } from 'react';

const VERTEX_SHADER_SOURCE = `
  precision mediump float;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  varying vec2 vUv;

  #define MAX_STEPS 52
  #define MAX_DIST 35.0
  #define SURF_DIST 0.002

  // Fast Smooth Union for fluid merging
  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  // Optimized SDF Scene - High-Performance Mercury Fluid
  float getSceneSDF(vec3 p) {
    float t = uTime * 0.12;
    vec2 mPos = (uMouse - 0.5) * 6.5;
    
    // Smooth attractor tracking the mouse
    float d = length(p - vec3(mPos.x, mPos.y, 1.2)) - 0.92;
    
    // Large Fluid Bodies (6 bodies for optimal 60-120fps throughput)
    for(int i = 0; i < 6; i++) {
        float fi = float(i);
        vec3 pos = vec3(
            sin(t * 0.7 + fi * 1.5) * 3.8,
            cos(t * 0.5 + fi * 2.2) * 2.2,
            sin(t * 0.9 + fi * 0.8) * 1.0
        );
        vec3 p_str = p - pos;
        p_str.y *= 0.82 + 0.28 * sin(t + fi);
        float r = 0.52 + 0.28 * sin(t * 0.8 + fi);
        d = smin(d, length(p_str) - r, 1.15); 
    }
    
    // Floating Micro Beads (8 density nodes)
    for(int j = 0; j < 8; j++) {
        float fj = float(j);
        vec3 pos = vec3(
            sin(t * 1.2 + fj * 3.8) * 5.0,
            cos(t * 0.9 + fj * 2.6) * 3.4,
            sin(t * 1.5 + fj * 0.7) * 0.8
        );
        float r = 0.12 + 0.18 * abs(cos(t * 1.6 + fj * 1.2));
        d = smin(d, length(p - pos) - r, 0.45); 
    }
    
    d += sin(p.x * 2.2 + t) * sin(p.y * 2.2 + t) * 0.055;
    return d;
  }

  // Fast Tetrahedral Gradient Normal (4 samples instead of 6)
  vec3 getNormal(vec3 p) {
    vec2 e = vec2(0.002, -0.002);
    return normalize(
      vec3(e.x, e.y, e.y) * getSceneSDF(p + vec3(e.x, e.y, e.y)) +
      vec3(e.y, e.y, e.x) * getSceneSDF(p + vec3(e.y, e.y, e.x)) +
      vec3(e.y, e.x, e.y) * getSceneSDF(p + vec3(e.y, e.x, e.y)) +
      vec3(e.x, e.x, e.x) * getSceneSDF(p + vec3(e.x, e.x, e.x))
    );
  }

  // Studio Lighting Environment (Ultra-Chrome High-Key Studio)
  vec3 getEnvironment(vec3 r) {
    vec3 col = vec3(1.0, 1.0, 1.0);
    
    // Softbox Overhead
    float overhead = smoothstep(-0.5, 0.5, r.y);
    col = mix(vec3(0.85, 0.90, 0.96), vec3(1.0, 1.0, 1.0), overhead);
    
    // Sharp Side Light Bars
    float bar1 = pow(max(0.0, dot(r, normalize(vec3(1.5, 0.2, -0.8)))), 24.0);
    float bar2 = pow(max(0.0, dot(r, normalize(vec3(-1.2, 0.1, -0.4)))), 32.0);
    col += vec3(1.8, 1.8, 1.8) * bar1 * overhead;
    col += vec3(1.2, 1.2, 1.2) * bar2 * (1.0 - overhead);
    
    // Deep Studio Occluders (Mirror Edge Contrast)
    float panelA = smoothstep(0.4, 0.9, abs(r.x));
    float panelB = smoothstep(0.2, 0.7, abs(r.z));
    col = mix(col, vec3(0.0, 0.0, 0.0), panelA * 0.85 * (1.0 - overhead));
    col = mix(col, vec3(0.01, 0.01, 0.01), panelB * 0.65);
    
    // Crisp Secondary Gloss
    float strips = pow(abs(cos(r.x * 2.5 + r.z * 1.5 + uTime * 0.05)), 48.0);
    col = mix(col, vec3(1.5, 1.5, 1.5), strips * 0.35 * overhead);
    
    return col;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    
    // Macro Camera Setup
    vec3 ro = vec3(0.0, 0.0, -8.2);
    vec3 rd = normalize(vec3(uv, 3.2)); 
    
    float dTotal = 0.0;
    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * dTotal;
        float dS = getSceneSDF(p);
        dTotal += dS;
        if(dTotal > MAX_DIST || abs(dS) < SURF_DIST) break;
    }
    
    // Clean Pure White Background
    vec3 col = vec3(1.0, 1.0, 1.0);
    
    if(dTotal < MAX_DIST) {
        vec3 p = ro + rd * dTotal;
        vec3 n = getNormal(p);
        vec3 v = -rd;
        vec3 r = reflect(rd, n);
        
        // Mirror Reflection
        vec3 reflection = getEnvironment(r);
        col = reflection * vec3(0.98, 0.99, 1.0);
        
        // Dynamic Light Direction
        vec3 lightPos = normalize(vec3((uMouse.x - 0.5) * 14.0, (uMouse.y - 0.5) * 14.0 + 5.0, -3.5));
        
        // Specular Glint
        float dotRefl = max(0.0, dot(reflect(-lightPos, n), v));
        float specPeak = dotRefl > 0.0 ? pow(dotRefl, 800.0) : 0.0;
        col += vec3(3.2, 3.2, 3.2) * specPeak;
        
        // Anisotropic Rim Glow
        float fres = pow(1.0 - max(0.0, dot(n, v)), 5.5);
        col = mix(col, vec3(1.0, 1.0, 1.0), fres * 0.72);
        
        // Pearlescent metallic interference
        col += fres * vec3(0.6, 0.8, 1.2) * 0.55;
        
        // Studio Specular Bloom
        float specSoft = dotRefl > 0.0 ? pow(dotRefl, 48.0) : 0.0;
        col += vec3(0.4, 0.6, 1.0) * specSoft * 0.32;
        
        // Ambient Occlusion
        float curve = 1.0 - abs(dot(n, vec3(0.0, 0.0, 1.0)));
        col *= mix(1.0, 0.72, pow(curve, 3.0));
    }
    
    // Toning
    col = pow(col, vec3(0.86, 0.86, 0.86));
    col = clamp(col, 0.0, 1.0);
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

interface LiquidChromeCanvasProps {
  className?: string;
}

export default function LiquidChromeCanvas({ className = '' }: LiquidChromeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglActive, setWebglActive] = useState<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fast WebGL context creation with high-performance power preference
    const gl = (canvas.getContext('webgl2', {
      alpha: false,
      antialias: false, // Raymarching shader handles its own smoothing; disabling canvas MSAA saves 4x fillrate
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    }) ||
      canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
      })) as WebGLRenderingContext | null;

    if (!gl) {
      setWebglActive(false);
      return;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vs || !fs) {
      setWebglActive(false);
      return;
    }

    const program = createProgram(gl, vs, fs);
    if (!program) {
      setWebglActive(false);
      return;
    }

    gl.useProgram(program);

    // Quad geometry covering [-1, 1] screen space
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uResolutionLoc = gl.getUniformLocation(program, 'uResolution');
    const uMouseLoc = gl.getUniformLocation(program, 'uMouse');

    // Smooth mouse coordinates with inertia
    const currentMouse = { x: 0.5, y: 0.5 };
    const targetMouse = { x: 0.5, y: 0.5 };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.x = e.clientX / window.innerWidth;
      targetMouse.y = 1.0 - e.clientY / window.innerHeight;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetMouse.x = e.touches[0].clientX / window.innerWidth;
        targetMouse.y = 1.0 - e.touches[0].clientY / window.innerHeight;
      }
    };

    const updateSize = () => {
      // Scale resolution to balanced 1.0 - 1.25 DPR for rock-solid 60-120fps performance
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    let animationFrameId: number;
    let isVisible = true;
    const startTime = performance.now();

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (isVisible) {
        // Fluid, viscous lerp for silky smooth mouse tracking
        currentMouse.x += (targetMouse.x - currentMouse.x) * 0.05;
        currentMouse.y += (targetMouse.y - currentMouse.y) * 0.05;

        const elapsedSeconds = (performance.now() - startTime) * 0.001;

        gl.useProgram(program);
        gl.uniform1f(uTimeLoc, elapsedSeconds);
        gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
        gl.uniform2f(uMouseLoc, currentMouse.x, currentMouse.y);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      if (program) gl.deleteProgram(program);
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`webgl-canvas ${className}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
          display: 'block',
          transform: 'translateZ(0)', // Force GPU hardware layer
        }}
      />
      {!webglActive && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              left: '-12%',
              width: '45vw',
              height: '120vh',
              borderRadius: '45% 55% 65% 35% / 40% 50% 60% 50%',
              background: 'linear-gradient(135deg, #111111 0%, #3a3a3a 30%, #a6a6a6 55%, #ffffff 75%, #222222 100%)',
              filter: 'blur(2px) contrast(1.3)',
              boxShadow: 'inset 0 0 80px rgba(255,255,255,0.7), 20px 20px 60px rgba(0,0,0,0.3)',
              opacity: 0.95,
              animation: 'morphLeft 18s ease-in-out infinite alternate',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '5%',
              right: '-14%',
              width: '48vw',
              height: '115vh',
              borderRadius: '55% 45% 40% 60% / 50% 60% 40% 50%',
              background: 'linear-gradient(225deg, #0d0d0d 0%, #444444 32%, #b5b5b5 58%, #ffffff 78%, #1f1f1f 100%)',
              filter: 'blur(2px) contrast(1.3)',
              boxShadow: 'inset 0 0 90px rgba(255,255,255,0.75), -20px 20px 60px rgba(0,0,0,0.3)',
              opacity: 0.95,
              animation: 'morphRight 20s ease-in-out infinite alternate',
            }}
          />
        </div>
      )}
    </>
  );
}
