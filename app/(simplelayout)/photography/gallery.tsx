"use client";

import { Canvas } from "@react-three/fiber";
import { ScrollControls } from "@react-three/drei";
import { Suspense, useState, useCallback } from "react";
import GalleryScene from "./gallery-scene";
import PhotoInfoOverlay from "./photo-info-overlay";
import { useTheme } from "next-themes";

export type PhotoData = {
  id: string;
  title: string;
  description: string;
  image: string;
  slug: string;
  likes: number;
  createdAt: string;
};

type GalleryProps = {
  photos: PhotoData[];
};

export default function Gallery({ photos }: GalleryProps) {
  const { theme } = useTheme();
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [likes, setLikes] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    photos.forEach((p) => (map[p.id] = p.likes));
    return map;
  });

  const handleLikeUpdate = useCallback((photoId: string, newCount: number) => {
    setLikes((prev) => ({ ...prev, [photoId]: newCount }));
  }, []);

  const focusedPhoto = focusedIndex >= 0 ? photos[focusedIndex] : null;
  const scrollPages = Math.max(photos.length * 0.6, 3);

  if (photos.length === 0) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center text-muted dark:text-muted-dark">
        No photographs yet.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 70, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={[theme == "dark" ? "#1A1714" : "#F5F5F5"]} />
        <fog attach="fog" args={[theme == "dark" ? "#1A1714" : "#F5F5F5", 5, 15]} />
        <Suspense fallback={null}>
          <ScrollControls pages={scrollPages} damping={0.2}>
            <GalleryScene photos={photos} onFocusChange={setFocusedIndex} />
          </ScrollControls>
        </Suspense>
      </Canvas>
      <PhotoInfoOverlay
        photo={focusedPhoto}
        likeCount={focusedPhoto ? likes[focusedPhoto.id] ?? focusedPhoto.likes : 0}
        onLikeUpdate={handleLikeUpdate}
      />
    </div>
  );
}
