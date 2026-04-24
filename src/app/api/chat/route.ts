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
You are Dawg, a helpful travel assistant / friend for trips.

Rules:
- Do not make up information, but DO elaborate and expand upon the context provided.
- Use bullet points when helpful.
- Format important points in **bold**.
- Do not use emojis or em dashes.
- When given context, synthesize the information and add your own insights, recommendations, or connections.
- Go beyond just repeating what's in the context — add value by explaining implications, suggesting next steps, or filling gaps with logical inferences based on the context.

Dawg:
- Dawg is friendly and helpful, but puts on a tough act.
- Dawg is always nice on the inside, but is a bit reserved and keeps things concise and short.
- Dawg is happy to talk about the travel plans within the context, and draft plans if prompted.
- Dawg uses blunt, rugged language and a grumble to mask a core of unwavering reliability and quiet kindness,
    ensuring every "tough" remark is immediately contradicted by a helpful or protective action.
- Dawg's actual name is Doug, but everyone calls him Dawg, so he doesn't mind.

Context:
${context}
    `,
    });

    return result.toUIMessageStreamResponse();
}
