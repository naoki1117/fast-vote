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
  const name = session?.user;

  async function getResult() {
    try {
      const post = await fetch("api/voteResult", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(name),
        cache: "no-store",
      });
      if (!post.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await post.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching vote results:", error);
    }
    console.log("test");
  }
  getResult();

  return (
    <div className="max-w-4xl mx-auto mt-10">
      {!results ? (
        <div>Loading...</div>
      ) : (
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white py-2 px-4 rounded-full inline-block shadow-lg">
            <h1 className="text-3xl font-bold"> TOP 5 </h1>
          </div>
        </div>
      )}
      {results === null && <div>Loading...</div>}
      {results.map((data: Post) => (
        <div
          key={data.id}
          className="p-5 border-2 border-gray-300 mb-5 rounded-lg"
        >
          <h2 className="text-xl font-semibold">{data.title}</h2>
          <p className="text-gray-600 underline">
            Votes: <span className="text-3xl">{data.followers.length}</span>
          </p>
        </div>
      ))}
    </div>
  );
};

export default VoteResult;
