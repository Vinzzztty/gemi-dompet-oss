'use client';

import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../../../public/animations/Loading-rocket.json';

interface LoadingProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeMap = {
  sm: 80,
  md: 120,
  lg: 200,
};

export const Loading: React.FC<LoadingProps> = ({
  fullScreen = false,
  size = 'md',
  text,
}) => {
  const animationSize = sizeMap[size];

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-content">
          <Lottie
            animationData={loadingAnimation}
            loop={true}
            autoplay={true}
            style={{ width: animationSize, height: animationSize }}
          />
          {text && <p className="loading-text">{text}</p>}
        </div>

        <style jsx>{`
          .loading-fullscreen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.95);
            z-index: 9999;
          }

          .loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-4);
          }

          .loading-text {
            font-size: 0.938rem;
            color: var(--text-secondary);
            margin: 0;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <Lottie
        animationData={loadingAnimation}
        loop={true}
        autoplay={true}
        style={{ width: animationSize, height: animationSize }}
      />
      {text && <p className="loading-text">{text}</p>}

      <style jsx>{`
        .loading-inline {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          padding: var(--space-6);
        }

        .loading-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }
      `}</style>
    </div>
  );
};
