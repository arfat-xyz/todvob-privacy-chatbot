"use client";
import React, { useState } from "react";

const MainPage = () => {
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; content: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: any) => {
    setLoading(true);
    e.preventDefault();
    const input = e.target.userInput.value;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    e.target.userInput.value = "";
    const answer = await fetch("/api/chat-3", {
      method: "POST",
      body: JSON.stringify({ input, messages: messages }),
    })
      .then((data) => data.json())
      .then((result) => result.answer)
      .finally(() => {
        setLoading(false);
      });
    setMessages((prev) => [...prev, { role: "ai", content: answer }]);
    setLoading(false);
  };
  return (
    <main className="flex justify-center items-center w-full h-[100vh-30px] overflow-hidden">
      <section className="border p-2 rounded-lg shadow-black shadow-sm w-96">
        <div className="">
          <img src="/next.svg" className="logo" />
          <p className="sub-heading">Knowledge Bank</p>
        </div>
        <div className="h-96 overflow-y-auto w-full">
          {messages.map((message, i) => (
            <div
              className={`w-full text-wrap ${
                message.role === "user" ? "bg-pink-600" : "bg-gray-500"
              }`}
              key={i}
            >
              {message.content}
            </div>
          ))}
          {loading && <div className="w-full ">thinking....</div>}
        </div>
        <form id="form" onSubmit={handleSubmit} className="flex w-full">
          <input
            name="userInput"
            type="text"
            className="p-2 border border-gray-600 rounded-l-lg flex-1 dark:bg-white dark:text-black"
            required
          />
          <button
            id="submit-btn"
            type="submit"
            disabled={loading}
            className="text-white px-11 bg-green-600 rounded-r-lg"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
};

export default MainPage;
