import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const AllProposal = (email: any) => {
  const [proposalData, setProposalData] = useState<any>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewFlag, setViewFlag] = useState(false);
  const { data: session, status } = useSession();
  const name = session?.user;

  const router = useRouter();

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = e.target;
    if (checked) {
      setSelectedItems((prevSelected) => [...prevSelected, value]);
    } else {
      setSelectedItems((prevSelected) =>
        prevSelected.filter((item) => item !== value)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) {
      alert("セッションがタイムアウトしました。再度サインインしてください。");
      router.push("/");
    }
    if (selectedItems.length > 2) {
      alert("3つ以上の選択がされています!!");
      return;
    }
    if (selectedItems.length === 1) {
      alert("1つしか選択されていません!!");
      return;
    }
    if (selectedItems.length === 0) {
      alert("選択されていません!!");
      return;
    }
    alert("投票が完了しました!!");
    console.log("Selected Items:", selectedItems);
    // チェックされた項目の処理を行う

    await fetch("api/postAction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selectedItems, name }),
    });
  };

  useEffect(() => {
    const fetchProposalData = async () => {
      try {
        const res = await fetch("api/allProposal", {});
        if (res.ok) {
          const data = await res.json();
          setProposalData(data);
          setViewFlag(!viewFlag);
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchProposalData();
  }, [email]);
  console.log(proposalData);
  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit}>
        {proposalData.map((data: any) => (
          <div key={data.id} className="p-2">
            <div className="bg-gray-200 p-4 rounded-lg flex justify-between">
              <h3 className="text-lg font-semibold">
                {data?.posts[0]?.post?.title}
                <span className="text-sm underline">({data.name})</span>
              </h3>
              <span>
                <input
                  type="checkbox"
                  name="vote"
                  value={data?.posts[0]?.post?.id}
                  className="h-5 w-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                  onChange={handleCheckboxChange}
                />
              </span>
            </div>
          </div>
        ))}
        {viewFlag ? (
          <div className="text-center">
            <input
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer "
            />
            <span className="underline text-red-500 pl-2">
              投票したいものを2つ選んでから送信して下さい。
            </span>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </form>
    </div>
  );
};

export default AllProposal;
