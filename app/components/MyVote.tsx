import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

const MyVote = () => {
  const [userData, setUserData] = useState<any>();
  const { data: session, status } = useSession();
  const name = session?.user;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("api/getUserDetail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(name), // emailDataではなくemailを直接使用
        });

        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [name]); // emailを依存リストから削除

  if (!userData) {
    return <div>Loading...</div>;
  }
  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{userData.title}</h2>
      <div className="flex items-center">
        <span className="font-semibold mr-2">フォロワー:</span>
        <div className="flex flex-wrap">
          {userData.followers.map((follower: any) => (
            <span
              key={follower.id}
              className="mr-2 mb-2 px-3 py-1 bg-gray-300 rounded-full"
            >
              {follower.name}
            </span>
          ))}
        </div>
      </div>
      <span className="pl-3">人数:{userData.followers.length}</span>
    </div>
  );
};

export default MyVote;
