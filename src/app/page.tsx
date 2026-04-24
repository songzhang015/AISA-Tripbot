"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "framer-motion";

const INTRO_DURATION_MS = 4200;

function renderBoldText(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((segment, index) => {
        if (segment.startsWith("**") && segment.endsWith("**")) {
            return <strong key={index}>{segment.slice(2, -2)}</strong>;
        }

        return <span key={index}>{segment}</span>;
    });
}

export default function Home() {
    const [input, setInput] = useState("");
    const [showIntro, setShowIntro] = useState(true);
    const { messages, sendMessage, status, error } = useChat({
        transport: new DefaultChatTransport({
            api: "/api/chat",
        }),
    });

    const isLoading = status === "submitted" || status === "streaming";
    const canSend = input.trim().length > 0 && !isLoading;

    useEffect(() => {
        const introTimer = window.setTimeout(() => {
            setShowIntro(false);
        }, INTRO_DURATION_MS);

        return () => window.clearTimeout(introTimer);
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!input.trim()) return;

        await sendMessage({ text: input.trim() });
        setInput("");
    }

    return (
        <main className="min-h-screen bg-neutral-900 text-neutral-100">
            <AnimatePresence>
                {showIntro ? (
                    <motion.div
                        initial={{ opacity: 1, backgroundColor: "#0f0f0f" }}
                        animate={{ opacity: 1, backgroundColor: "#171717" }}
                        exit={{ opacity: 0 }}
                        transition={{
                            backgroundColor: {
                                delay: 0.5,
                                duration: 0.5,
                                ease: "easeOut",
                            },
                            opacity: { duration: 0.6, ease: "easeOut" },
                        }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{
                                delay: 1.3,
                                duration: 0.6,
                                ease: "easeOut",
                            }}
                            className="text-3xl font-bold text-neutral-100"
                        >
                            AISA Chatbot
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showIntro ? 0 : 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mx-auto flex min-h-screen w-full max-w-2xl flex-col p-6"
            >
                <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-neutral-700 p-4 text-sm text-neutral-400">
                            Ask anything about the Artificial Intelligence
                            Student Association.
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.28,
                                        ease: "easeOut",
                                    }}
                                    className="rounded-xl bg-neutral-800 p-3 text-neutral-100"
                                >
                                    <div className="mb-1 text-sm font-semibold text-neutral-300">
                                        {message.role === "user"
                                            ? "You"
                                            : "AISA"}
                                    </div>

                                    <div className="whitespace-pre-wrap">
                                        {message.parts.map((part, index) =>
                                            part.type === "text" ? (
                                                <span key={index}>
                                                    {renderBoldText(part.text)}
                                                </span>
                                            ) : null,
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}

                    <AnimatePresence>
                        {status === "submitted" ? (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="px-1 text-sm text-neutral-400"
                            >
                                Thinking...
                            </motion.div>
                        ) : null}
                    </AnimatePresence>

                    {error ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                            {error.message}
                        </div>
                    ) : null}
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about AISA..."
                        disabled={isLoading}
                        className="min-w-0 flex-1 rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-neutral-200 placeholder:text-neutral-500 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/20 disabled:bg-neutral-900 disabled:text-neutral-500"
                    />

                    <button
                        type="submit"
                        disabled={!canSend}
                        className="w-24 shrink-0 cursor-pointer rounded-2xl bg-neutral-700 px-5 py-3 text-neutral-200 hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Send
                    </button>
                </form>
            </motion.div>
        </main>
    );
}
