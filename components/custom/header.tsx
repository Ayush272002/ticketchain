'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import MetaMask from '../scripts/MetaMask';

const Header = () => {
  const [mouseX, setMouseX] = useState(-1);
  const [mouseY, setMouseY] = useState(-1);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMouseX(e.clientX);
    setMouseY(e.clientY);
  };

  const handleMouseLeave = () => {
    setMouseX(-1);
    setMouseY(-1);
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 backdrop-blur-md bg-opacity-60 z-50"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: '1px solid transparent',
          background:
            mouseX >= 0 && mouseY >= 0
              ? `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 0.4), transparent 20%)`
              : 'none',
          backgroundClip: 'padding-box, border-box',
        }}
      ></div>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" legacyBehavior>
          <a
            className="text-2xl font-semibold text-white hover:text-light-purple hover:text-opacity-75 transition-colors duration-300"
            style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}
          >
            TicketChain
          </a>
        </Link>
        <nav className="nav">
          <ul className="flex space-x-6">
            <li>
              <Link href="/" legacyBehavior>
                <a
                  className="text-white hover:text-light-purple hover:text-opacity-75 transition-colors duration-300"
                  style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}
                >
                  Home
                </a>
              </Link>
            </li>
            <li>
              <Link href="/events" legacyBehavior>
                <a
                  className="text-white hover:text-light-purple hover:text-opacity-75 transition-colors duration-300"
                  style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}
                >
                  Events
                </a>
              </Link>
            </li>
            <li>
              <Link href="/host" legacyBehavior>
                <a
                  className="text-white hover:text-light-purple hover:text-opacity-75 transition-colors duration-300"
                  style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}
                >
                  Host Event
                </a>
              </Link>
            </li>
            <li>
              <Link href="/profile" legacyBehavior>
                <a
                  className="text-white hover:text-light-purple hover:text-opacity-75 transition-colors duration-300"
                  style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}
                >
                  Profile
                </a>
              </Link>
            </li>
            <li className="relative bottom-1">
              <MetaMask />
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Header;
