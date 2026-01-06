"use client";

import { useEffect, useState } from 'react';

// Define the type for a single dot
interface Dot {
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    speed: number;
}

const AnimatedBackground = () => {
    const [dots, setDots] = useState<Dot[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    // Hydration guard: only render after client-side mount
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // Only initialize dots after mount to prevent SSR/CSR mismatch
        if (!isMounted) return;

        // Function to create initial dots
        const createDots = (): Dot[] => {
            const newDots: Dot[] = [];
            for (let i = 0; i < 50; i++) {
                newDots.push({
                    id: i,
                    x: Math.random() * 100, // 0 to 100% width
                    y: Math.random() * 100, // 0 to 100% height
                    size: Math.random() * 3 + 1, // 1px to 4px
                    opacity: Math.random() * 0.5 + 0.1, // 0.1 to 0.6 opacity
                    speed: Math.random() * 0.5 + 0.2 // speed of vertical drift
                });
            }
            return newDots;
        };

        setDots(createDots());

        // Animation loop
        const interval = setInterval(() => {
            setDots(prevDots =>
                prevDots.map(dot => {
                    let newY = dot.y - dot.speed;
                    const reset = newY < -5; // Check if dot has moved slightly off the top

                    // If reset is true, teleport the dot back to the bottom (105%) and randomize opacity
                    if (reset) {
                        newY = 105;
                    }

                    return {
                        ...dot,
                        y: newY,
                        // Apply a subtle horizontal wave based on vertical position
                        x: dot.x + Math.sin(dot.y * 0.05) * 0.2,
                        opacity: reset ? Math.random() * 0.5 + 0.1 : dot.opacity,
                    };
                })
            );
        }, 50);

        return () => clearInterval(interval);
    }, [isMounted]);

    // Render static background during SSR and before hydration
    if (!isMounted) {
        return (
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
            </div>
        );
    }

    return (
        // Fixed positioning ensures it covers the entire viewport and stays behind content
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                {dots.map(dot => (
                    <div
                        key={dot.id}
                        className="absolute rounded-full bg-blue-500 transition-opacity duration-500"
                        style={{
                            // Corrected template literal usage for CSS properties
                            left: `${dot.x}%`,
                            top: `${dot.y}%`,
                            width: `${dot.size}px`,
                            height: `${dot.size}px`,
                            opacity: dot.opacity,
                            filter: 'blur(1px)',
                        }}
                    />
                ))}
                {/* Gradient Overlays for soft edges */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-gray-900 opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-gray-900 opacity-80" />
            </div>
        </div>
    );
};

export default AnimatedBackground;
