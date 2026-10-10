import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import type { Vote, PostUser, User } from "@prisma/client";

export type ExtendedPost = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: PostUser[];
  followers: User[];
  votes: Vote[];
};

type Post = ExtendedPost;

const VoteResult = () => {
  const [results, setResults] = useState<Post[]>([]);
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true); // ローディング状態を管理する
  const name = session?.user;

  useEffect(() => {
    async function getResult() {
      try {
        const post = await fetch("api/voteResult", {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify(name),
        });
        if (!post.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await post.json();
        setResults(data);
      } catch (error) {
        console.error("Error fetching vote results:", error);
      }
      setLoading(false);
    }

    getResult();
  }, [name]); // useEffectを空の依存リストで初回のみ実行するようにする

  return (
    <div className="max-w-4xl mx-auto mt-10">
      {loading ? (
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
            投票数: <span className="text-3xl">{data.followers.length}</span>
            <span className="text-end cursor-pointer">
              <details>
                <summary> 投票者:</summary>
                {data.followers.map((follower) => (
                  <span key={follower.id} className="pr-3">
                    {follower.name}
                  </span>
                ))}
              </details>
            </span>
          </p>
        </div>
      ))}
    </div>
  );
};

export default VoteResult;
