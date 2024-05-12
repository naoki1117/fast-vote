// "use client";

import { getProviders } from "next-auth/react";
import SignInButton from "./components/SignInButton";
import WelcomeComponent from "./components/WelcomeComponent";

export default async function Home() {
  const providers = await getProviders();
  console.log(providers);
  return (
    <div className=" h-screen">
      <div>
        <SignInButton provider="credentials" />
        <WelcomeComponent />
      </div>
    </div>
  );
}
