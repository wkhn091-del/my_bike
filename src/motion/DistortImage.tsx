"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "./gsap";

const VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

/** object-fit: cover in UV space, then a lens bulge with a slight chromatic split around the pointer. */
const FRAGMENT = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uMouse;
uniform float uHover;
varying vec2 vUv;

vec2 cover(vec2 uv) {
  vec2 ratio = vec2(
    min((uRes.x / uRes.y) / (uImg.x / uImg.y), 1.0),
    min((uRes.y / uRes.x) / (uImg.y / uImg.x), 1.0)
  );
  return vec2(uv.x * ratio.x + (1.0 - ratio.x) * 0.5, uv.y * ratio.y + (1.0 - ratio.y) * 0.5);
}

void main() {
  vec2 delta = vUv - uMouse;
  delta.x *= uRes.x / uRes.y;
  float dist = length(delta);
  float lens = uHover * smoothstep(0.42, 0.0, dist);
  vec2 dir = dist > 0.0001 ? delta / dist : vec2(0.0);
  vec2 uv = vUv - dir * lens * 0.06;
  float split = lens * 0.008;
  float r = texture2D(tMap, cover(uv + dir * split)).r;
  float g = texture2D(tMap, cover(uv)).g;
  float b = texture2D(tMap, cover(uv - dir * split)).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}`;

/**
 * Desktop-only WebGL lens on hover. The library loads lazily and only for a fine pointer without
 * reduced motion; touch screens never download it. The canvas is shown only while hovering, so the
 * real <img> underneath stays the visible, accessible picture the rest of the time.
 */
export function DistortImage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const host = canvasHostRef.current;
    if (!wrap || !host || prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      const img = wrap.querySelector("img");
      if (!img) return;
      if (!img.complete) await new Promise((resolve) => img.addEventListener("load", resolve, { once: true }));
      const { Renderer, Program, Mesh, Triangle, Texture } = await import("ogl");
      if (disposed) return;

      const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: false });
      const gl = renderer.gl;
      const canvas = gl.canvas as HTMLCanvasElement;
      canvas.className = "absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300";
      host.appendChild(canvas);

      const source = new Image();
      source.crossOrigin = "anonymous";
      source.src = img.currentSrc || img.src;
      await source.decode().catch(() => undefined);
      if (disposed) return;

      const texture = new Texture(gl, { image: source, generateMipmaps: false });
      const uniforms = {
        tMap: { value: texture },
        uRes: { value: [1, 1] },
        uImg: { value: [source.naturalWidth || 1, source.naturalHeight || 1] },
        uMouse: { value: [0.5, 0.5] },
        uHover: { value: 0 },
      };
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program: new Program(gl, { vertex: VERTEX, fragment: FRAGMENT, uniforms }) });

      const render = () => renderer.render({ scene: mesh });
      const resize = () => {
        const rect = wrap.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height);
        uniforms.uRes.value = [rect.width, rect.height];
        render();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(wrap);
      resize();

      const mouse = { x: 0.5, y: 0.5 };
      const xTo = gsap.quickTo(mouse, "x", { duration: 0.6, ease: "power3.out", onUpdate: () => ((uniforms.uMouse.value = [mouse.x, mouse.y]), render()) });
      const yTo = gsap.quickTo(mouse, "y", { duration: 0.6, ease: "power3.out", onUpdate: () => ((uniforms.uMouse.value = [mouse.x, mouse.y]), render()) });
      const hover = { value: 0 };

      const onEnter = () => {
        canvas.style.opacity = "1";
        gsap.to(hover, { value: 1, duration: 0.9, ease: "expo.out", onUpdate: () => ((uniforms.uHover.value = hover.value), render()) });
      };
      const onMove = (event: PointerEvent) => {
        const rect = wrap.getBoundingClientRect();
        xTo((event.clientX - rect.left) / rect.width);
        yTo(1 - (event.clientY - rect.top) / rect.height);
      };
      const onLeave = () => {
        gsap.to(hover, {
          value: 0,
          duration: 0.9,
          ease: "elastic.out(1, 0.45)",
          onUpdate: () => ((uniforms.uHover.value = hover.value), render()),
          onComplete: () => {
            canvas.style.opacity = "0";
          },
        });
      };

      wrap.addEventListener("pointerenter", onEnter);
      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerleave", onLeave);
      cleanup = () => {
        wrap.removeEventListener("pointerenter", onEnter);
        wrap.removeEventListener("pointermove", onMove);
        wrap.removeEventListener("pointerleave", onLeave);
        observer.disconnect();
        gsap.killTweensOf([hover, mouse]);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        canvas.remove();
      };
    };

    const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 200));
    idle(() => {
      if (!disposed) start().catch(() => undefined);
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`relative ${className}`} data-cursor="צפו">
      {children}
      <div ref={canvasHostRef} className="pointer-events-none absolute inset-0" />
    </div>
  );
}
