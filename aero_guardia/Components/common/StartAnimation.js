import React, { useState, useEffect } from "react";

const StarAnimation = ({ durationRange = [10, 24], interval = 150 }) => {
    const [stars, setStars] = useState([]);

    useEffect(() => {
        const createStar = () => {
            const id = Math.random().toString(36).substring(2, 15); // Unique ID for each star
            const size = Math.random() * 5 + 3; // Between 3px and 8px
            const x = Math.random() * window.innerWidth; // Random x position
            const y = Math.random() * window.innerHeight; // Random y position
            const duration = Math.random() * (durationRange[1] - durationRange[0]) + durationRange[0]; // Random duration

            setStars((prevStars) => [
                ...prevStars,
                { id, size, x, y, duration },
            ]);

            // Remove the star after its animation ends
            setTimeout(() => {
                setStars((prevStars) => prevStars.filter((star) => star.id !== id));
            }, duration * 1000);
        };

        const starInterval = setInterval(createStar, interval);

        return () => clearInterval(starInterval); // Cleanup interval on unmount
    }, [interval, durationRange]);

    return (
        <div className="fixed w-full h-screen pointer-events-none">
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="absolute bg-blue-300 rounded-full"
                    style={{
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        left: `${star.x}px`,
                        top: `${star.y}px`,
                        boxShadow: `0 0 ${star.size * 2}px 1px rgba(255, 255, 255, 0.6)`,
                        animation: `moveUp ${star.duration}s linear forwards`,
                    }}
                />
            ))}
            <style>
                {`
                @keyframes moveUp {
            0% {
                transform: translateY(0);
                 opacity: 0;
            }
            20% {
              opacity: 1;
            }
            80% {
              opacity: 1;
            }
            100% {
              transform: translateY(-200vh);
              opacity: 0;
            }
          }
        `}
            </style>
        </div>
    );
};

export default StarAnimation;