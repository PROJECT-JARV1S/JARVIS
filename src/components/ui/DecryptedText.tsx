import { useState, useEffect } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number; // ms per step
  maxIterations?: number; // how many cycles per character
  delay?: number; // start delay in ms
}

const GLYPHS = '01_X[]{}!@#$%&*?<>▲▼◀▶';

export const DecryptedText = ({
  text,
  speed = 35,
  maxIterations = 4,
  delay = 0,
}: DecryptedTextProps) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout;

    const startAnimation = () => {
      const length = text.length;
      let iterations = Array(length).fill(0);
      let revealed = Array(length).fill(false);

      const intervalId = setInterval(() => {
        if (!isMounted) {
          clearInterval(intervalId);
          return;
        }

        let allDone = true;
        const currentResult = text.split('').map((char, index) => {
          // Keep spaces and newlines unchanged
          if (char === ' ' || char === '\n') {
            revealed[index] = true;
            return char;
          }

          // If already stabilized, return correct character
          if (revealed[index]) {
            return char;
          }

          allDone = false;

          // Increment iteration
          iterations[index] += 1;

          // Once it exceeds maximum cycles, stabilize
          if (iterations[index] >= maxIterations + Math.floor(index / 1.5)) {
            revealed[index] = true;
            return char;
          }

          // Otherwise return random glyph
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        });

        setDisplayText(currentResult.join(''));

        if (allDone) {
          clearInterval(intervalId);
        }
      }, speed);

      return () => clearInterval(intervalId);
    };

    if (delay > 0) {
      timer = setTimeout(() => {
        if (isMounted) startAnimation();
      }, delay);
    } else {
      startAnimation();
    }

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [text, speed, maxIterations, delay]);

  return <span className="font-mono">{displayText}</span>;
};
