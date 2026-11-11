import gsap from 'gsap';
import { ease } from './lib/ease';
import { inOutCubic, prefersReducedMotion } from './lib/dom';
import { smoothing } from './smooth-scroll';

export function initHeroMeta() {
  gsap.fromTo(
    '[data-hero-meta]',
    { opacity: 0.001, y: 12 },
    { opacity: 1, y: 0, duration: 1, delay: 2, stagger: 0.1, ease: ease.expo },
  );
}

const FRAG = `precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uEnergy;uniform vec3 uTint;uniform float uWobble;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float sdEll(vec3 p,vec3 r){float k0=length(p/r);float k1=length(p/(r*r));return k0*(k0-1.)/k1;}
float map(vec3 p){
  p.xz*=rot(uMouse.x*.9+uTime*.12);
  p.yz*=rot(-uMouse.y*.55+.25);
  float t=uTime;
  float d=sdEll(p,vec3(1.3,.62,.85));
  float w=(.06+.05*uEnergy)*uWobble;
  d+=w*sin(3.1*p.x+t*.9)*sin(2.6*p.y+t*1.3)*sin(3.4*p.z+t*.7);
  d+=.018*uWobble*sin(7.3*p.x-t*1.7)*sin(6.1*p.z+t*1.1)*sin(5.2*p.y+t);
  d+=(.002+.004*uEnergy)*uWobble*sin(17.*p.x+11.*p.z-t*2.)*sin(15.*p.y-9.*p.x+t*1.4);
  return d*.7;
}
vec3 nrm(vec3 p){vec2 e=vec2(.0015,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
vec3 env(vec3 d){
  float y=d.y;
  vec3 c=mix(vec3(.64,.65,.68),vec3(.98),smoothstep(-.9,.45,y));
  c+=.85*smoothstep(.82,1.,sin(d.x*5.+d.z*2.+.6))*smoothstep(-.2,.7,y);
  c+=.55*smoothstep(.9,1.,sin(d.z*7.-d.x*3.));
  c=mix(c,vec3(.12,.125,.14),smoothstep(.55,.95,sin(d.x*3.1-d.y*2.4+1.2))*.7*smoothstep(-.6,.35,y));
  c=mix(c,uTint*1.35,smoothstep(.35,.95,-d.x+d.z*.3)*smoothstep(.3,-.5,y)*.9);
  c+=vec3(1.,.97,.92)*pow(max(0.,dot(d,normalize(vec3(.4,.8,.5)))),20.)*1.4;
  return c;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec3 ro=vec3(0.,0.,3.6);vec3 rd=normalize(vec3(uv,-1.75));
  float t=0.;float hit=0.;float dm=1e9;float tm=0.;
  for(int i=0;i<64;i++){vec3 p=ro+rd*t;float d=map(p);if(d<dm){dm=d;tm=t;}if(d<.0008){hit=1.;break;}t+=d;if(t>7.)break;}
  float px=1.6*tm/(uRes.y*1.75);
  float a=hit>.5?1.:1.-smoothstep(0.,px,dm);
  if(a<=0.){gl_FragColor=vec4(0.);return;}
  vec3 p=ro+rd*(hit>.5?t:tm);vec3 n=nrm(p);vec3 r=reflect(rd,n);
  float ndv=max(0.,dot(n,-rd));
  float fr=pow(1.-ndv,4.);
  vec3 col=env(r)*(.86+.14*fr);
  col+=fr*.16;
  col+=vec3(1.)*pow(max(0.,dot(r,normalize(vec3(-.5,.6,.6)))),48.)*.9;
  col=clamp(col,0.,1.);
  col=col*col*(3.-2.*col)*.35+col*.65;
  gl_FragColor=vec4(col*a,a);
}`;

export function initChromeBlob() {
  const host = document.querySelector<HTMLElement>('[data-blob]');
  if (!host) return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block';
  host.append(canvas);
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!gl) return;
  const reduced = prefersReducedMotion();
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');
  const uEnergy = gl.getUniformLocation(prog, 'uEnergy');
  gl.uniform3f(gl.getUniformLocation(prog, 'uTint'), 241 / 255, 88 / 255, 34 / 255);
  gl.uniform1f(gl.getUniformLocation(prog, 'uWobble'), 1);

  const resize = () => {
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    const max = 1.6e6;
    const area = canvas.clientWidth * canvas.clientHeight * dpr * dpr;
    if (area > max) dpr *= Math.sqrt(max / area);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
  };
  resize();

  let tx = 0;
  let ty = 0;
  let mx = 0;
  let my = 0;
  let energy = 0;
  window.addEventListener(
    'pointermove',
    (e) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const y = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      const d = Math.hypot(x - tx, y - ty);
      tx = Math.max(-1.2, Math.min(1.2, x));
      ty = Math.max(-1.2, Math.min(1.2, y));
      energy = Math.min(1, energy + d * 2.5);
    },
    { passive: true },
  );

  let raf = 0;
  let onScreen = false;
  const start = performance.now();
  let last = start;
  let lastDraw = 0;
  const frame = (now: number) => {
    raf = 0;
    if (now - lastDraw < 32 && onScreen && !document.hidden) {
      raf = requestAnimationFrame(frame);
      return;
    }
    lastDraw = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    mx += (tx - mx) * Math.min(1, dt * 3.2);
    my += (ty - my) * Math.min(1, dt * 3.2);
    energy *= 0.25 ** dt;
    gl.uniform1f(uTime, reduced ? 0 : (now - start) / 1000);
    gl.uniform2f(uMouse, mx, my);
    gl.uniform1f(uEnergy, energy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (onScreen && !document.hidden && !reduced) raf = requestAnimationFrame(frame);
  };
  const run = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen) run();
  }).observe(canvas);
  new ResizeObserver(() => {
    resize();
    if (!raf) requestAnimationFrame(frame);
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => !document.hidden && onScreen && run());
  requestAnimationFrame(frame);
}

export function initExpandMedia() {
  document.querySelectorAll<HTMLElement>('[data-expand]').forEach((root) => {
    const frame = root.querySelector<HTMLElement>('[data-expand-frame]')!;
    const media = root.querySelector<HTMLElement>('[data-expand-media]')!;
    const START = 0.35;
    const RISE = 5;
    const SCALE = 1.12;
    const reduced = prefersReducedMotion();
    const inset = (w: number) => {
      const gutter = Math.max(w >= 1200 ? 40 : w >= 810 ? 24 : 16, (w - 1600) / 2);
      return Math.max(gutter, (w * (1 - START)) / 2);
    };
    let target = 0;
    let p = 0;
    let raf = 0;
    let w = frame.offsetWidth;
    let h = frame.offsetHeight;

    const render = () => {
      const e = inOutCubic(p);
      const x = inset(w) * (1 - e);
      const boxH = Math.min(h, (w - 2 * inset(w)) * (h / Math.max(1, w)) * 1.15);
      const y = (Math.max(0, h - boxH) / 2) * (1 - e);
      frame.style.clipPath = `inset(${y.toFixed(2)}px ${x.toFixed(2)}px ${y.toFixed(2)}px ${x.toFixed(2)}px)`;
      media.style.transform = `translate3d(0, ${(RISE * (1 - p)).toFixed(3)}%, 0) scale(${(SCALE + (1 - SCALE) * p).toFixed(4)})`;
    };
    const measure = () => {
      const r = frame.getBoundingClientRect();
      w = r.width;
      h = r.height;
      const vh = window.innerHeight;
      target = reduced ? 1 : Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height * 0.15)));
    };
    const tick = () => {
      raf = 0;
      p += (target - p) * smoothing(0.12);
      if (Math.abs(target - p) < 5e-4) p = target;
      render();
      if (p !== target) raf = requestAnimationFrame(tick);
    };
    const update = () => {
      const r = frame.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      measure();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    measure();
    p = target;
    render();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    const video = root.querySelector('video');
    if (video) {
      new IntersectionObserver(([e]) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause())).observe(frame);
    }
  });
}
