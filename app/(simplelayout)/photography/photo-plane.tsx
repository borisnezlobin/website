"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { PhotoData } from "./gallery";
import { useTheme } from "next-themes";

type Props = {
  photo: PhotoData;
  position: [number, number, number];
  rotation: [number, number, number];
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString("default", { month: "long" });
  const year = d.getFullYear();
  const suffixes = ["th", "st", "nd", "rd"];
  const suffix = day >= 11 && day <= 13 ? "th" : suffixes[day % 10] || "th";
  return `${month} ${day}${suffix}, ${year}`;
}

const LOAD_DISTANCE = 15;

export default function PhotoPlane({ photo, position, rotation }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const titleRef = useRef<THREE.Mesh>(null);
  const descRef = useRef<THREE.Mesh>(null);
  const dateRef = useRef<THREE.Mesh>(null);
  const worldPosVec = useRef(new THREE.Vector3());
  const [dims, setDims] = useState<[number, number]>([3 * 1.5, 3]);
  const [photoWidth, setPhotoWidth] = useState(3 * 1.5);
  const textureLoaded = useRef(false);

  const { theme } = useTheme();

  const textOnLeft = position[0] > 0;
  const textX = textOnLeft ? -(photoWidth / 2 + 0.4) : photoWidth / 2 + 0.4;
  const textAnchor = textOnLeft ? "right" : "left";

  const loadTexture = useRef(() => {
    if (textureLoaded.current) return;
    textureLoaded.current = true;

    const mat = materialRef.current;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;

      if (mat) {
        mat.map = tex;
        mat.needsUpdate = true;
      }

      const aspect = img.naturalWidth / img.naturalHeight;
      const w = 3 * aspect;
      setDims([w, 3]);
      setPhotoWidth(w);
    };
    img.src = photo.image;
  }).current;

  useEffect(() => {
    return () => {
      if (materialRef.current?.map) {
        materialRef.current.map.dispose();
      }
    };
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.getWorldPosition(worldPosVec.current);
    const dist = Math.abs(worldPosVec.current.z);

    if (dist < LOAD_DISTANCE && !textureLoaded.current) {
      loadTexture();
    }

    const photoOpacity = THREE.MathUtils.clamp(1 - dist / 20, 0, 1);
    if (materialRef.current) {
      materialRef.current.opacity = photoOpacity;
    }

    const textOpacity = THREE.MathUtils.clamp(1 - dist / 4, 0, 1);
    const textMeshes = [titleRef.current, descRef.current, dateRef.current];
    for (const mesh of textMeshes) {
      if (mesh) {
        (mesh.material as THREE.MeshBasicMaterial).opacity = textOpacity;
      }
    }
  });

  const headerColor = theme === "dark" ? "#D0D0D0" : "#3C3C3C";
  const descColor = theme === "dark" ? "#949494" : "#707070";

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={dims} />
        <meshStandardMaterial
          ref={materialRef}
          transparent
          opacity={1}
          side={THREE.FrontSide}
          toneMapped={false}
        />
      </mesh>

      {/* <Text
        ref={titleRef}
        position={[textX, 0.0, 0.01]}
        fontSize={0.5}
        maxWidth={3.5}
        anchorX={textAnchor}
        anchorY="middle"
        color={headerColor}
        fontWeight={900}
        font="/antro_vectra.otf"
      >
        {photo.title}
        <meshBasicMaterial transparent opacity={0} />
      </Text> */}
{/* 
      {photo.description && (
        <Text
          ref={descRef}
          position={[textX, 0.35, 0.01]}
          fontSize={0.12}
          maxWidth={3.5}
          anchorX={textAnchor}
          anchorY="top"
          font="/Charter Regular.ttf"
          color={descColor}
          lineHeight={1.4}
        >
          {photo.description}
          <meshBasicMaterial transparent opacity={0} />
        </Text>
      )}

      <Text
        ref={dateRef}
        position={[textX, photo.description ? -0.3 : 0.3, 0.01]}
        fontSize={0.12}
        font="/Charter Regular.ttf"
        anchorX={textAnchor}
        anchorY="top"
        color={descColor}
      >
        {formatDate(photo.createdAt)}
        <meshBasicMaterial transparent opacity={0} />
      </Text> */}
    </group>
  );
}
