"use client";

import React, { useState, useEffect } from "react";
import { Transition } from "@headlessui/react";

const AnimatedText = () => {
  const [showText, setShowText] = useState(false);
  const text = "Welcome To fast-vote!";

  useEffect(() => {
    setShowText(true);
  }, []);

  return (
    <div className="text-center">
      <p>The project has been completed.</p>
      <p>
        For inquiries about the new project, please contact Naoki Kimura, the
        developer and administrator.
      </p>
      {/* <Transition
        show={showText}
        as="h1"
        enter="transition-opacity duration-1000"
        enterFrom="opacity-0"
        enterTo="opacity-100"
      >
        {text.split("").map((char, index) => (
          <Transition.Child
            key={index}
            as="span"
            enter="transition-opacity duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
          >
            {char}
          </Transition.Child>
        ))}
      </Transition> */}
    </div>
  );
};

export default AnimatedText;
