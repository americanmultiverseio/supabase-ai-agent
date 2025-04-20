import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

// Knowledge base documents
const documents = [
  {
    content: "Supabase will have a meetup in Chicago on the 25th of April. The event will focus on discussing the latest features and best practices in building applications with Supabase.",
  	metadata: { source: "American Multiverse" },
  },
  {
    content: "Supabase will host the meeting with American Multiverse a Chicago based company.",
	  metadata: { source: "American Multiverse" },
  },
  {
    content: "American Multiverse (AMV) is a full-service digital marketing agency providing Ai solutions, Website Design & Development, Web & Mobile App Development services to individual businesses as well as medium and large-sized enterprises across the globe.",
	  metadata: { source: "American Multiverse" },
  },
  // Add more documents as needed
];

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}
/* push bulk 

await vectorStore.addDocuments(documents, { ids: ["1", "2", "3", "4"] });

const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabaseClient,
  tableName: "documents",
  queryName: "match_documents",
});
*/
async function ingestDocuments() {
  try {
    for (const doc of documents) {
      const embedding = await generateEmbedding(doc.content);

      const { error } = await supabase
        .from('documents')
        .insert({
          content: doc.content,
		  metadata: doc.metadata,
          embedding: embedding,
        });

      if (error) throw error;
      console.log('✅ Inserted:', doc.content.substring(0, 50) + '...');
    }
    console.log('🚀 All documents ingested successfully!');
  } catch (error) {
    console.error('❌ Error ingesting documents:', error);
  }
}

ingestDocuments();
