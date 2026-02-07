"use client";

import { useRef, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import PhotoPlane from "./photo-plane";
import type { PhotoData } from "./gallery";
import * as THREE from "three";

type Props = {
  photos: PhotoData[];
  onFocusChange: (index: number) => void;
};

export const DEPTH_PER_PHOTO = 5;
const FOCUS_THRESHOLD = 3;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function KeyboardNavigator({ photoCount }: { photoCount: number }) {
  const scroll = useScroll();
  const targetOffset = useRef<number | null>(null);

  const navigateTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, photoCount - 1));
      const offset = (clamped * DEPTH_PER_PHOTO) / (photoCount * DEPTH_PER_PHOTO);
      targetOffset.current = offset;
    },
    [photoCount]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const currentIndex = Math.round(
          (scroll.offset * photoCount * DEPTH_PER_PHOTO) / DEPTH_PER_PHOTO
        );
        navigateTo(currentIndex + 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const currentIndex = Math.round(
          (scroll.offset * photoCount * DEPTH_PER_PHOTO) / DEPTH_PER_PHOTO
        );
        navigateTo(currentIndex - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photoCount, navigateTo, scroll]);

  useFrame(() => {
    if (targetOffset.current === null) return;
    const el = scroll.el;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const targetScroll = targetOffset.current * maxScroll;
    const currentScroll = el.scrollTop;

    const diff = targetScroll - currentScroll;
    if (Math.abs(diff) < 1) {
      el.scrollTop = targetScroll;
      targetOffset.current = null;
      return;
    }

    el.scrollTop += diff * 0.08;
  });

  return null;
}

export default function GalleryScene({ photos, onFocusChange }: Props) {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  const lastFocusedIndex = useRef(-1);
  const totalDepth = photos.length * DEPTH_PER_PHOTO;

  useFrame(() => {
    if (!groupRef.current) return;

    const offset = scroll.offset;
    const cameraZ = 5 - offset * totalDepth;
    groupRef.current.position.z = -cameraZ + 5;

    let closestIndex = -1;
    let closestDist = Infinity;

    for (let i = 0; i < photos.length; i++) {
      const photoZ = -(i * DEPTH_PER_PHOTO);
      const worldZ = photoZ + groupRef.current.position.z;
      const dist = Math.abs(worldZ);
      if (dist < closestDist && dist < FOCUS_THRESHOLD) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    if (closestIndex !== lastFocusedIndex.current) {
      lastFocusedIndex.current = closestIndex;
      onFocusChange(closestIndex);
    }
  });

  return (
    <>
      <KeyboardNavigator photoCount={photos.length} />
      <group ref={groupRef}>
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 2, 5]} intensity={50.0} color="#ffffff" />
        {photos.map((photo, i) => {
          const xSpread = 6;
          const ySpread = 1.5;
          const xOffset = (seededRandom(i * 3 + 1) - 0.5) * xSpread;
          const yOffset = (seededRandom(i * 7 + 2) - 0.5) * ySpread;
          const rotY = (seededRandom(i * 13 + 3) - 0.5) * 0.4;
          const rotX = (seededRandom(i * 17 + 4) - 0.5) * 0.15;

          return (
            <PhotoPlane
              key={photo.id}
              photo={photo}
              position={[xOffset, yOffset, -(i * DEPTH_PER_PHOTO)]}
              rotation={[rotX, rotY, 0]}
            />
          );
        })}
      </group>
    </>
  );
}
