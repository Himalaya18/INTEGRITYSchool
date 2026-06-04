// Path: app/api/generate-material/route.ts
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY1 || "",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quickPrompt, config } = body;

    if (!process.env.GROQ_API_KEY1) {
      return NextResponse.json({ reply: "SERVER ERROR: GROQ_API_KEY1 is missing." }, { status: 500 });
    }

    let userMessage = "";
    if (quickPrompt && quickPrompt.trim() !== "") {
      userMessage = quickPrompt;
    } else {
      userMessage = `Please create a ${config.type} for ${config.grade} students studying ${config.subject}. 
      The core topic is: "${config.topic}". 
      ${config.type === 'Quiz' ? `Make the difficulty level ${config.difficulty} and include exactly ${config.questions} questions.` : ''}
      Format the entire output beautifully in Markdown.`;
    }

    // FIX 1: Add 'as const' to force TypeScript to recognize exact literal types
    const systemPrompt = {
      role: "system" as const,
      content: "You are an expert teacher. Generate high-quality, pedagogically sound educational materials. Always format your output in clean, readable Markdown."
    };

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        systemPrompt,
        { role: "user" as const, content: userMessage }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 800, // FIX 2: Limit the tokens to control length and cost
    });

    const botReply = chatCompletion.choices[0]?.message?.content || "Generation failed. Please try again.";
    
    return NextResponse.json({ reply: botReply });

  } catch (error: any) {
    console.error("Groq Generation Error:", error);
    return NextResponse.json({ reply: `API ERROR: ${error.message}` }, { status: 500 });
  }
}