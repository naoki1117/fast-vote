import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import type { Vote, PostUser, User } from "@prisma/client";

// Prisma が提供する型を使用して、Post オブジェクトの型定義を拡張する
export type ExtendedPost = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: PostUser[]; // Post に関連する著者の配列
  followers: User[]; // Post をフォローしているユーザーの配列
  votes: Vote[]; // Post に関連する投票の配列
};

// 上記の型を使って、Post オブジェクトの型を定義する
type Post = ExtendedPost;

const VoteResult = () => {
  const [flag, setFlag] = useState(false);
  setFlag(!flag);
  const session = useSession();
  const user = session.data?.user?.name;
  const [results, setResults] = useState<Post[]>([]);
  const [loadingFlag, setLoadingFlag] = useState(false);
  useEffect(() => {
    async function getResult() {
      const post = await fetch("api/voteResult");
      const data = await post.json();
      setResults(data);
      setLoadingFlag(!loadingFlag);
    }
    getResult();
  }, [flag]); // user が変更されたときにのみ useEffect が再実行される

  return (
    <div className="max-w-4xl mx-auto mt-10">
      {!loadingFlag ? (
        <div>Loading...</div>
      ) : (
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white py-2 px-4 rounded-full inline-block shadow-lg">
            <h1 className="text-3xl font-bold"> TOP 5 </h1>
          </div>
        </div>
      )}
      {results.map((data: Post) => (
        <div
          key={data.id}
          className="p-5 border-2 border-gray-300 mb-5 rounded-lg"
        >
          <h2 className="text-xl font-semibold">{data.title}</h2>
          <p className="text-gray-600 underline">
            得票: <span className="text-3xl">{data.followers.length} </span>
          </p>
        </div>
      ))}
    </div>
  );
};

export default VoteResult;
