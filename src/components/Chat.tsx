import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ChatOpenAI , OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RunnableSequence } from '@langchain/core/runnables';
import { formatDocumentsAsString } from 'langchain/util/document';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('message, response, sources')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          const formattedMessages = data.map((item) => [
            { role: 'user' as const, content: item.message },
            { role: 'assistant' as const, content: item.response, source: item.sources },
          ]).flat();
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
        alert('Failed to load chat history.');
      }
    };

    fetchChatHistory();
  }, []);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {

        // 1. Initialize ChatOpenAI with environment variable
        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
          modelName: "text-embedding-3-small"
        });

        const llm = new ChatOpenAI({
          openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY!,
          modelName: 'gpt-3.5-turbo'
        });

         // 2. Create retriever 
        const vectorStore = new SupabaseVectorStore(embeddings, {
          client: supabase,
          tableName: "documents",
          queryName: "match_documents",

        });

        const retriever = vectorStore.asRetriever({
          filter: { min_similarity: 0.8 }
        });

        // Sanity check to verify your sql function
        /*
         const { data } = await supabase
         .rpc('match_documents', {
           query_embedding: embeddings,
           min_similarity: 0.1,
           match_count: 3
         });
		
	       console.log("data:", data);
         */

        // 3. Define the prompt template
        // const SYSTEM_TEMPLATE = `You are a helpful AI assistant. Use the following context to help answer the question. Be concise.

        // Context: {context}

        // Question: {question}
        
        // try first to answer the question using the context then your general knowledge.
        // `;
        const SYSTEM_TEMPLATE = `You are a helpful AI assistant. Use the following context to help answer the question. Be concise.

          Context: {context}

          Question: {question}

          First try to answer the question using the provided context. If the context doesn't contain enough information to answer the question, clearly state "CONTEXT_INSUFFICIENT" at the beginning of your response, then provide your best answer based on general knowledge.

          Remember to be concise in your responses.`;

        // 4. prepare the Chain Sequence
        const ragChain = RunnableSequence.from([
          // Step 1: Extract the question
          (input: { question: string }) => input.question,
          
          // Step 2: Retrieve documents
          async (question: string) => {
            const docs = await retriever.invoke(question);
            return {
              question,
              context: formatDocumentsAsString(docs),
              sources: [...new Set(docs.map(doc => doc.metadata.source))].join(', ')
            };
          },
          
          // Step 3: Generate response using LLM
          async ({ context, question, sources }) => {
            const prompt = SYSTEM_TEMPLATE.replace('{context}', context).replace('{question}', question);
            const response = await llm.invoke(prompt);
            return { 
              question,
              content: response.content.toString(), 
              sources 
            };
          },
          // Step 4: Handle unanswered queries
          async ({ content, sources, question }) => {
            // Check if the response indicates insufficient context
            if (content.includes("CONTEXT_INSUFFICIENT")) {
              try {
                // Call Supabase function to handle the unanswered query
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { data, error } = await supabase.functions.invoke('fn_handle_unanswered_query', 
                  {
                    body: {query: question }
                  });
                
                if (error) {
                  console.error('Error calling Supabase function:', error);
                } 
              } catch (error) {
                console.error('Failed to call Supabase fallback:', error);
              }
            }
            
            // Return original response
            return { content, sources, fallbackUsed: content.includes("CONTEXT_INSUFFICIENT") };
          }
        ]);
        
        // 5. Ask a question by invoking the Chain
        const result = await ragChain.invoke({
          question: userMessage.content, 
        });
        
        console.log('✅ Answer:', result);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: result.content.replace("CONTEXT_INSUFFICIENT", ""), source: result.fallbackUsed ? '' : result.sources },
        ]);

        // 6. Store the conversation in Supabase
        const { error } = await supabase.from('conversations').insert([
        {
          user_id: (await supabase.auth.getUser()).data.user?.id,
          message: input,
          response: result.content.replace("CONTEXT_INSUFFICIENT", ""),
          sources: result.fallbackUsed ? '' : result.sources,
        },
        ]);

        if (error) throw error;

    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {message.role === 'assistant' && (
                  <Bot className="h-5 w-5 text-blue-600" />
                )}
                <span className="font-medium">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
              {message.source && (
                <p className="text-xs text-gray-400 mt-2">
                  <span className="italic">
                    <b>Source:</b> {message.source}
                  </span>
                </p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="border-t bg-white p-4 shadow-sm"
      >
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}