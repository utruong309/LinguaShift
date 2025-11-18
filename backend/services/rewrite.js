import dotenv from "dotenv";
dotenv.config();

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

const prompt = PromptTemplate.fromTemplate(`
You are a communication expert helping rewrite technical messages for better clarity.

ORGANIZATION GLOSSARY (Company-specific terms - use these definitions):
{glossary}

INSTRUCTIONS:
- Target audience: {audience}
- Desired tone: {tone}
- When you encounter glossary terms, replace them with the plain-language versions provided
- Keep the meaning accurate while making it clearer
- Don't remove important technical details, just explain them better
- If a term is in the glossary, prefer that explanation over a generic one

ORIGINAL MESSAGE:
{message}

REWRITTEN VERSION (follow all instructions above):
`);

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.4,
  apiKey: process.env.OPENAI_API_KEY,   
});

export async function runRewrite({
  text,
  audience = "PMs",
  tone = "Neutral",
  glossary = [],
}) {
  // Format glossary for the prompt
  const glossaryText = glossary.length > 0
    ? glossary
        .map((g) => `• ${g.term}: ${g.plainLanguage}${g.explanation ? ` (${g.explanation})` : ''}`)
        .join("\n")
    : "No company-specific terms defined yet.";

  const chain = prompt.pipe(model);

  const response = await chain.invoke({
    message: text,
    audience,
    tone,
    glossary: glossaryText,
  });

  return response.content; 
}