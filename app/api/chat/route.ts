// Path: app/api/chat/route.ts
import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ reply: "SERVER ERROR: GROQ_API_KEY is missing." }, { status: 500 });
    }

    // 1. Resolve the exact path to the public folder
    const txtPath = path.join(process.cwd(), "public", "Integrity_School_Parent_Info.txt");
    
    // Debugging: This will print in your VS Code terminal so you can see exactly where it looks
    console.log("--> Next.js is looking for the file here:", txtPath);
    
    if (!fs.existsSync(txtPath)) {
       return NextResponse.json({ 
         reply: `FILE ERROR: Could not find Integrity_School_Parent_Info.txt. Please ensure it is inside the 'public' folder. Looked at: ${txtPath}` 
       }, { status: 500 });
    }

    // 2. Read the actual text content of your school brochure
    const schoolContext = fs.readFileSync(txtPath, "utf-8");

    // 3. Format messages for Groq
    const formattedMessages = history.map((msg: any) => ({
      role: msg.role === 'bot' ? 'assistant' : 'user',
      content: msg.text,
    }));

    // 4. System Prompt
    const systemPrompt = {
      role: "system",
      content: `You are the official AI assistant for Integrity S & E School. 
      Answer all questions warmly, professionally, and accurately using ONLY the verified context provided below.
      
      Verified School Context:
      """
      ${schoolContext}
      """
      
      Guidelines:
      - If the context does not contain the answer, politely ask the parent to contact the school administration directly at +91 7828741586. Do not invent details.
      - Respond using the exact same language or style the parent uses (English, Hindi, or Hinglish).`
    };

    // 5. Call Groq Llama 3
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        systemPrompt,
        ...formattedMessages,
        { role: "user", content: message }
      ],
      model: "llama-3.1-8b-instant", 
      temperature: 0.2, // Low temperature forces strict compliance to the text file
    });

    const botReply = chatCompletion.choices[0]?.message?.content || "I couldn't process that response.";
    return NextResponse.json({ reply: botReply });

  } catch (error: any) {
    console.error("Groq API Server Error:", error);
    return NextResponse.json({ reply: `API ERROR: ${error.message}` }, { status: 500 });
  }
}