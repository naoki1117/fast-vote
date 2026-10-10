"use client";
import { signIn } from "next-auth/react";
import React from "react";

function SignInButton(provider: any) {
  console.log(provider);
  return (
    <div className="text-end">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => signIn(provider.id, { callbackUrl: "/dashboard" })}
      >
        サインイン
      </button>
    </div>
  );
}

export default SignInButton;
