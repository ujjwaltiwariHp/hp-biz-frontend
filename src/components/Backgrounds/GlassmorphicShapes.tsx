"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const GlassmorphicShapes = () => {
    const [isMounted, setIsMounted] = useState(false);

    // Hydration guard: only render animations after client-side mount
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Render static background during SSR and before hydration
    if (!isMounted) {
        return (
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                {/* Static placeholder shapes that match the animated ones */}
                <div className="absolute top-20 left-[20%] w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-3xl" />
                <div className="absolute top-[40%] right-[10%] w-64 h-64 rounded-3xl bg-gradient-to-tr from-purple-500/10 to-pink-500/10 backdrop-blur-3xl" style={{ transform: 'rotate(45deg)' }} />
                <div className="absolute bottom-[30%] left-[15%] w-48 h-48 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-3xl" />
                <div className="absolute top-[20%] right-[25%] w-72 h-40 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-3xl" />
                <div className="absolute bottom-[20%] right-[30%] w-32 h-32 rounded-2xl bg-gradient-to-tr from-blue-500/10 to-purple-500/10 backdrop-blur-3xl" />
            </div>
        );
    }

    return (
        // Fixed positioning ensures it covers the entire viewport and stays behind content
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {/* Large circle */}
            <motion.div
                animate={{
                    y: [0, -30, 0],
                    rotate: [0, 360]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-20 left-[20%] w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-3xl"
            />
            {/* Square */}
            <motion.div
                animate={{
                    x: [0, 30, 0],
                    rotate: [45, 90, 45]
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-[40%] right-[10%] w-64 h-64 rounded-3xl bg-gradient-to-tr from-purple-500/10 to-pink-500/10 backdrop-blur-3xl"
                style={{ transform: 'rotate(45deg)' }}
            />
            {/* Small circle */}
            <motion.div
                animate={{
                    x: [0, -20, 0],
                    y: [0, 20, 0]
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute bottom-[30%] left-[15%] w-48 h-48 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-3xl"
            />
            {/* Rectangle */}
            <motion.div
                animate={{
                    rotate: [0, -360],
                    y: [0, 20, 0]
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-[20%] right-[25%] w-72 h-40 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-3xl"
            />
            {/* Small square */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 0]
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute bottom-[20%] right-[30%] w-32 h-32 rounded-2xl bg-gradient-to-tr from-blue-500/10 to-purple-500/10 backdrop-blur-3xl"
            />
        </div>
    );
};

export default GlassmorphicShapes;
