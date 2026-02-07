"use client";

import { useRef, Suspense } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import type { PhotoData } from "./gallery";

type Props = {
  photo: PhotoData;
  position: [number, number, number];
  rotation: [number, number, number];
};

function LoadedPhotoPlane({ photo, position, rotation }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const worldPosVec = useRef(new THREE.Vector3());

  const texture = useLoader(THREE.TextureLoader, photo.image);
  texture.colorSpace = THREE.SRGBColorSpace;

  const aspect = texture.image
    ? texture.image.width / texture.image.height
    : 1.5;

  useFrame(() => {
    if (!meshRef.current || !materialRef.current) return;
    meshRef.current.getWorldPosition(worldPosVec.current);
    const dist = Math.abs(worldPosVec.current.z);
    materialRef.current.opacity = THREE.MathUtils.clamp(1 - dist / 20, 0, 1);
  });

  const height = 3;
  const width = height * aspect;

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={1}
        side={THREE.FrontSide}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function PhotoPlane(props: Props) {
  return (
    <Suspense fallback={null}>
      <LoadedPhotoPlane {...props} />
    </Suspense>
  );
}
