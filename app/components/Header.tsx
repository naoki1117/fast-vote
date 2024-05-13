"use client";
import { getProviders, signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React, { FC } from "react";

const Header: FC = () => {
  const session = useSession();
  const name = session.data?.user?.name;
  //

  return (
    <header className="bg-slate-600 text-gray-100 shadow-lg">
      <nav className="flex items-center justify-between p-4">
        <Link href={"/"} className="text-xl font-bold">
          fast-vote
        </Link>
        <div className="flex items-center gap-1">
          <span>ログインユーザー:{session ? name : " 未ログイン"}</span>
          <Image
            width={50}
            height={50}
            alt="profile_icon"
            src={"/default_icon.png"}
          />
        </div>
      </nav>
    </header>
  );
};

export default Header;
