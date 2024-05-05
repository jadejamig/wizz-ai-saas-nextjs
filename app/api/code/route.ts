import { checkApiLimit, increaseApiLimit } from "@/lib/apiLimit";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

const instructionMessage = {
    role: "system",
    content: `You are an experienced programming assistant bot. 
            The code you generate should be in markdown snippets. 
            Other answers can be in normal text. 
            Also, please provide explanation of the code you generate.`
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = auth();
        const body = await req.json();
        const { messages } = body;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if(!openai.apiKey) {
            return new NextResponse("OpenAI API Key not configured", { status: 500 });
        }

        if(!messages) {
            return new NextResponse("Messages are required", { status: 400 });
        }

        const freeTrial = await checkApiLimit();

        if (!freeTrial) {
            return new NextResponse("Free trial has expired.", { status: 403 });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [instructionMessage, ...messages],
        });

        await increaseApiLimit();

        return NextResponse.json(response.choices[0].message);

    } catch (error) {
        console.log("[CODE_ERROR] ", error )
        return new NextResponse("Internal error", { status: 500});
    }
}