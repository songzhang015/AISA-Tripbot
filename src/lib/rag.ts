import { sql } from "./db";
import { embedText } from "./embeddings";

export async function retrieveRelevantChunks(query: string) {
    const queryEmbedding = await embedText(query);

    const result = await sql`
    SELECT 
      content,
      metadata,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity
    FROM documents
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT 5;
  `;

    return result.rows;
}
