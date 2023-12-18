import Image from 'next/image';
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
 
export const runtime = 'edge';
 
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const title = params.get("title");
    const img = params.get("img");

    if(!title) return new Response("Missing title", { status: 400 });

    console.log(title, img);
    // if(!img) return new Response("Missing img", { status: 400 });


    return new ImageResponse((
        <div tw="w-full flex h-full bg-[#f5f5f5] p-16">
            <div tw="mx-auto flex flex-col justify-center items-center">
                {img && <img src={img} alt={title} tw="h-32 rounded-lg mb-8" />}
                <p tw="text-[#3c3c3c] text-center text-6xl">
                    View all {title} articles
                </p>
            </div>
        </div>
    ));
}