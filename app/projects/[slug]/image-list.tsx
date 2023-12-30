"use client";

import { X } from "@phosphor-icons/react";
import { useState } from "react";


// idk, I guess TODO is have arrows/carousel or whatever for the images
// when I have time I swear I'll do it but I my friends are online rn and I wanna play fortnite with them
const ImageList = ({ images }: { images: string[] }) => {
    return <div className="flex flex-col gap-2">
        {images.map(image => <ClickableImage image={image} alt={image} key={image} className="w-full rounded-lg h-full" />)}
    </div>;
};


const ClickableImage = ({ image, alt, className }: { image: string, alt: string, className: string }) => {
    const [showModal, setShowModal] = useState(false);

    return <>
        <img src={image} alt={alt} className={className} onClick={() => setShowModal(true)} />
        {showModal && <Modal onClose={() => setShowModal(false)}>
            <img src={image} alt={alt} className="w-full max-w-4/5 rounded-lg h-full object-cover" />
        </Modal>}
    </>;
}

const Modal = ({ onClose, children }: { onClose: () => void, children: React.ReactNode }) => {
    return <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 dark:bg-white dark:bg-opacity-50 flex flex-col justify-center items-center">
        <div className="bg-white rounded-lg">
            <button onClick={onClose} className="absolute top-4 right-4 p-2">
                <X weight="bold" className="w-8 h-8 text-white dark:text-black" />
            </button>
            {children}
        </div>
    </div>;
}

export default ImageList;