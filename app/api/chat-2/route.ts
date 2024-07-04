import {
  openAIApiKey,
  supabaseApiKey,
  supabaseUrl,
} from "@/constants/env-import";
import { PromptTemplate } from "@langchain/core/prompts";
import { OpenAI } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { StringOutputParser } from "@langchain/core/output_parsers";
export async function POST(request: Request) {
  const llm = new OpenAI({
    openAIApiKey,
    model: "gpt-3.5-turbo-instruct",
    cache: true,
  });

  //   prompt template
  const promptTemplate = PromptTemplate.fromTemplate(
    `  You are a helpful and enthusiastic support bot who can answer a given question about Scrimba based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I don't know the answer to that.". Don't try to make up an answer. Always speak as if you were chatting to a friend.

    question: {question}
    answer:
    `
  );

  const stringParser = new StringOutputParser();

  //   vector database supabase
  const client = createClient(supabaseUrl!, supabaseApiKey!);
  const embeddings = new OpenAIEmbeddings();
  const vectorStore = new SupabaseVectorStore(embeddings, {
    client,
    tableName: "documents",
    queryName: "match_documents",
  });
  const retriever = vectorStore.asRetriever();

  //   creating chain for LCEL
  const chain = promptTemplate
    .pipe(llm)
    .pipe(stringParser)
    .pipe(retriever)
    .pipe((docs) => docs.map((doc) => doc.pageContent).join(`\n\n`));

  const response = await chain.invoke({
    question: "tell me about all plans",
  });
  console.log(response);

  return Response.json("data");
}
