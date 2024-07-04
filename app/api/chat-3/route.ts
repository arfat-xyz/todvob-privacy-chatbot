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
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
export async function POST(request: Request) {
  const { input, messages } = await request.json();
  const llm = new OpenAI({
    openAIApiKey,
    model: "gpt-4o",
    temperature: 0.7,
  });
  //   Creating 2 template as required
  const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question. 
  conversation history: {conv_history}
question: {question} 
standalone question:`;
  const answerTemplate = `You are a helpful and friendly support bot who can answer a given question based on the context provided and the conversation history. Try to find the answer in the context. Always speak as if you were chatting to a friend.
context: {context}
conversation history: {conv_history}
  question: {question}
  answer: `;
  const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);
  const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
    standaloneQuestionTemplate
  );

  // criating conversation history
  const conv_history = messages
    .map((mess: { role: string; content: any }) => {
      if (mess.role === "user") return `Human: ${mess.content}`;
      else return `AI: ${mess.content}`;
    })
    .join("\n\n");

  //   Creating vectorDB client
  const client = createClient(supabaseUrl!, supabaseApiKey!);

  // Creating OPENAI embeddings to transform text into dimensional array
  const embeddings = new OpenAIEmbeddings();

  // Selecting vector store.
  const vectorStore = new SupabaseVectorStore(embeddings, {
    client,
    tableName: "documents",
    queryName: "match_documents",
  });

  // creating retriever for getting related data from db
  const retriever = vectorStore.asRetriever();

  const standaloneQuestionChain = RunnableSequence.from([
    standaloneQuestionPrompt,
    llm,
  ]);
  const retrieverChain = RunnableSequence.from([
    ({ orginal }) => orginal.question,
    retriever,
    (data) =>
      data.map((d: { pageContent: string }) => d.pageContent).join("\n\n"),
    llm,
  ]);
  const answerChain = RunnableSequence.from([answerPrompt, llm]);
  const chain = RunnableSequence.from([
    {
      question: standaloneQuestionChain,

      //RunnablePassthrough use for adding extra object keys
      orginal: new RunnablePassthrough(),
    },
    {
      context: retrieverChain,
      question: ({ orginal }) => orginal.question,
      conv_history: ({ orginal }) => orginal.conv_history,
    },
    answerChain,
  ]);
  const response = await chain.invoke({
    question: input,
    conv_history,
  });
  return Response.json({ answer: response });
}
