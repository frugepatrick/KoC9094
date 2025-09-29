// Carousel that can be used anywhere

import { useEffect, useState } from "react";

//creating the imageItem to pass later into an Array
type ImageItem = {
    src: string;
    alt: string;
    caption: string;
}

type HeroCarouselProps = {
    images: ImageItem[];
    autoPlay?: boolean;
    intervalMs?: number;
    className?: string;
}

//creating default function and passing props and assigning them to HeroCarouselProps

export default function HeroCarousel ({images, autoPlay = true, intervalMs = 4000, className = '',} : HeroCarouselProps) {
    //Check to make sure there are images:
    if(!images?.length) {
        console.log("no images to display");
        return null;
    }
    //creating stateIndex variable and a setter. Initialized to a useState of 0 for index 0
    const [stateIndex, setIndex] = useState(0);
    const total = images.length;
    
    // next and prev arrow function. set to i (current useState). when used, add 1 and take that and mod the total. when incremented useState = total, it 
    //will mod to 0 and reset the useState to 0 or first photo.
    const next = () => setIndex((i) => (i + 1) % total );
    const prev = () => setIndex((i) => (i - 1 + total) % total );     //add total to not get neg indexes

    useEffect(() => {
        if (!autoPlay) return;
        //create action that uses setInterval function. Takes function and a time value as a number.
        const id = setInterval(next, intervalMs);
        return () => clearInterval(id); //Clear after using to keep from having time leaks
    }, [autoPlay, intervalMs, images]);

    return (
        <div className={`hero-carousel position-relative ${className}`} aria-roledescription="carousel">
            {images.map((img, i) => (
                <img
                key={img.src}
                src={img.src}
                alt={img.alt ?? ''}
                className={`hero-slide ${i === stateIndex ? 'active' : ''}`}
                />
            ))}

            {images[stateIndex]?.caption && (
                <div className="hero-caption">{images[stateIndex].caption}</div>
            )}

            <style jsx>{`
                .hero-carousel {
                height: 360px;
                overflow: hidden;
                border-radius: 12px;
                background: #000;
                }

                .hero-slide {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                background: #000;
                opacity: 0;
                transition: opacity 400ms ease;
                }
                .hero-slide.active { opacity: 1; }

                .hero-caption {
                position: absolute;
                left: 12px;
                bottom: 44px;
                background: rgba(0,0,0,0.45);
                color: #fff;
                padding: 6px 10px;
                border-radius: 8px;
                font-size: 0.95rem;
                }

                @media (min-width: 1024px) {
                .hero-carousel { height: 480px; }
                }
                
            `}</style>

        </div>
    );
}