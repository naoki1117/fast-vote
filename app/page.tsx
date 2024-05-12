// "use client";

import { getProviders, signIn } from "next-auth/react";
import SignInButton from "./components/SignInButton";
import WelcomeComponent from "./components/WelcomeComponent";

export default async function Home() {
  const providers = await getProviders();

  return (
    <div className=" h-screen">
      {providers &&
        Object.values(providers).map((provider) => {
          return (
            <div key={provider.id}>
              <SignInButton provider={provider} />
              <WelcomeComponent />
            </div>
          );
        })}
    </div>
  );
}
