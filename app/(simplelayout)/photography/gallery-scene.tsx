"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import PhotoPlane from "./photo-plane";
import type { PhotoData } from "./gallery";
import * as THREE from "three";

type Props = {
  photos: PhotoData[];
  onFocusChange: (index: number) => void;
};

const DEPTH_PER_PHOTO = 5;
const FOCUS_THRESHOLD = 3;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
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
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 2, 5]} intensity={0.8} color="#ffffff" />
      {photos.map((photo, i) => {
        const xSpread = 6;
        const ySpread = 3.5;
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
  );
}
