"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import MyVote from "../components/MyVote";
import AllProposal from "../components/AllProposal";
import VoteResult from "../components/VoteResult";
import { useRouter } from "next/navigation"; // useRouter を import

const Page = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === "loading";

  // セッションがない場合にTOPページにリダイレクトする
  useEffect(() => {
    if (!loading && !session) {
      router.push("/");
    }
  }, [loading, session, router]);

  const [toggleComponent, setToggleComponent] = useState({
    myVote: false,
    allProposal: false,
    voteResult: false,
  });
  console.log("d");

  return (
    <div className="h-screen">
      <div className="absolute top-1/2 left-1/2">
        {loading && <div>Now loading...</div>}
        <div className="text-red-500">
          {!loading && !session && <div>Session not found.</div>}
        </div>
      </div>
      <div className="grid grid-cols-7 h-full">
        <div className="col-span-1 flex flex-col ">
          <button
            className=" mt-2 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-1 px-1 rounded-full shadow-md transition duration-300 ease-in-out"
            onClick={() =>
              setToggleComponent({
                myVote: true,
                allProposal: false,
                voteResult: false,
              })
            }
          >
            自分の提案を見る
          </button>
          <button
            className="mt-2 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-1 px-1 rounded-full shadow-md transition duration-300 ease-in-out"
            onClick={() =>
              setToggleComponent({
                myVote: false,
                allProposal: true,
                voteResult: false,
              })
            }
          >
            全提案を見る
          </button>
          <button
            className="mt-2 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-1 px-1 rounded-full shadow-md transition duration-300 ease-in-out"
            onClick={() =>
              setToggleComponent({
                myVote: false,
                allProposal: false,
                voteResult: true,
              })
            }
          >
            得票(上位5)
          </button>
        </div>
        <div className="col-span-5">
          {toggleComponent.myVote ? <MyVote /> : ""}
          {toggleComponent.allProposal ? (
            <AllProposal session={user?.email} />
          ) : (
            ""
          )}
          {toggleComponent.voteResult ? <VoteResult /> : ""}
        </div>
        <div className="text-end col-span-1 ">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            ログアウト
          </button>
          <div className="pt-5 bottom-8">
            <p className="text-red-400">最終データテスト済み</p>
            <p className=" text-red-400">データ初期化完了</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
