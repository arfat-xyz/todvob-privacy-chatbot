import {
    openAIApiKey,
    supabaseApiKey,
    supabaseUrl,
  } from "@/constants/env-import";
  import { OpenAI } from "@langchain/openai";
  import { PromptTemplate, ChatPromptTemplate } from "@langchain/core/prompts";
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
    const embeddings = new OpenAIEmbeddings({ openAIApiKey });
    const client = createClient(supabaseUrl!, supabaseApiKey!);
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client,
      tableName: "documents",
      queryName: "match_documents",
    });
    const retriever = vectorStore.asRetriever();
    //   const tweetTemplate = `Generate a promotional tweet for a product, from this product description: {productDesc}`;
    //   const tweetPrompt = PromptTemplate.fromTemplate(tweetTemplate);
    //   const promptTemplate = PromptTemplate.fromTemplate(
    //     `Tell me a joke about {topic}`
    //   );
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful assistant just answer the user {input}"],
      ["user", "{input}"],
    ]);
    const parser = new StringOutputParser();
    const chain = promptTemplate.pipe(llm).pipe(parser).pipe(retriever);
    const response = await chain.invoke({
      input: "What is todvob", 
    });
    console.log(response);
    return Response.json("data");
  }
  