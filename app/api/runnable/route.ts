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
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
export async function POST(request: Request) {
  const llm = new OpenAI({
    openAIApiKey,
    model: "gpt-3.5-turbo-instruct",
    cache: true,
  });

  const punchuationTemplate = PromptTemplate.fromTemplate(`
    Given a sentence, add punctuation where needed. 
    sentence: {sentence}
    sentence with punctuation:`);
  const grammerTemplate = PromptTemplate.fromTemplate(`
        Given a sentence correct the grammar.
        sentence: {punctuated_sentence}
        sentence with correct grammar: 
        `);
  const translateTemplate = PromptTemplate.fromTemplate(`
    Given a sentence, translate that sentence into {language}
    sentence: {grammatically_correct_sentence}
    translated sentence:
    `);
  const punchuationChain = RunnableSequence.from([punchuationTemplate, llm]);
  const grammernChain = RunnableSequence.from([grammerTemplate, llm]);
  const tranlationChain = RunnableSequence.from([translateTemplate, llm]);
  const chain = RunnableSequence.from([
    {
      punctuated_sentence: punchuationChain,
      orginal_input: new RunnablePassthrough(),
    },
    {
      grammatically_correct_sentence: grammernChain,
      language: ({ orginal_input }) => orginal_input.language,
    },
    // (data) => console.log(data, "middle"),
    tranlationChain,
  ]);

  const response = await chain.invoke({
    sentence: "I you love",
    language: "Bangla",
  });
  console.log(response);
  return Response.json("data");
}
