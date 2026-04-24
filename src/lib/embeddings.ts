import { google } from "@ai-sdk/google";
import { embed } from "ai";

const embeddingModel = google.textEmbeddingModel("gemini-embedding-001");

export async function embedText(text: string) {
    const { embedding } = await embed({
        model: embeddingModel,
        value: text,
        providerOptions: {
            google: {
                outputDimensionality: 768,
            },
        },
    });

    return embedding;
}
