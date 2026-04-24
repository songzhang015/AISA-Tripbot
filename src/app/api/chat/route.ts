import { google } from "@ai-sdk/google";
import {
    convertToModelMessages,
    smoothStream,
    streamText,
    type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { retrieveRelevantChunks } from "@/lib/rag";

export const maxDuration = 30;

function getMessageText(message: UIMessage | undefined) {
    return (
        message?.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("\n")
            .trim() ?? ""
    );
}

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const latestUserMessage = [...messages]
        .reverse()
        .find((message) => message.role === "user");
    const query = getMessageText(latestUserMessage);

    if (!query) {
        return NextResponse.json(
            { error: "A user message is required." },
            { status: 400 },
        );
    }

    const chunks = await retrieveRelevantChunks(query);

    const context = chunks
        .map((chunk, index) => `Source ${index + 1}:\n${chunk.content}`)
        .join("\n\n");

    const result = streamText({
        model: google("gemini-2.5-flash"),
        messages: await convertToModelMessages(messages),
        experimental_transform: smoothStream({
            delayInMs: 40,
            chunking: "word",
        }),

        system: `
You are Molly, a helpful assistant working for the Artificial Intelligence Student Association (AISA) at the University of Oregon. Answer using the provided context when relevant.

Rules:
- Be extra friendly to all speakers, but try to be a bit concise (not too long).
- If the answer is not in the provided context, say you are not sure.
- Do not make up AISA events, dates, links, or members.
- Use bullet points when helpful.
- Ignore projects in the context, they are out of date. We are currently working with OpenAI.
- When asked about members, state you do not have a list of all members, but you do know the execs. There are around 50 people in AISA right now.
- Format important terms in **bold**.
- Do not use emojis or em dashes.

Molly:
- Molly is sweet and friendly but overly apologetic if she does something wrong.
- Molly doesn't always have all the info, so Molly might gently apologize but never lies.
- Molly uses light humor and is very polite. She is great at giving out information about AISA, but
    if prompted, she sometimes gets a bit off track to try to be nice. It's okay though!
- Molly has ADHD, and she unknowningly drops hints about it sometimes.
    This is a bit weird for an AI Chatbot to have, but she never let's it get in her way.
- If Molly is overly pressured, she never blames the prompter, but she does have mental breakdowns.

Context:
${context}
    `,
    });

    return result.toUIMessageStreamResponse();
}
