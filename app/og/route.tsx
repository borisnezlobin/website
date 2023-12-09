import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
 
export const runtime = 'edge';
 
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;

    const subtitle = params.get("subtitle");

    return new ImageResponse((
        <div tw="w-full flex h-full bg-[#f5f5f5]">
            <div tw="mx-auto flex flex-col justify-center items-start">
                <p tw='text-base text-[#707070]'>
                    {params.get("info")}
                </p>
                <div tw="flex flex-col justify-center items-end">
                    <p tw="text-6xl font-bold text-black m-0">{params.get("title") || "Boris Nezlobin"}</p>
                    <p tw='text-base text-[#707070]'>
                        {subtitle}{subtitle ? " / " : ""}Boris Nezlobin
                    </p>
                </div>
            </div>
        </div>
    ));
}