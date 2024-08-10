import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
 
export const runtime = 'edge';
 
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;

    const subtitle = params.get("subtitle");

    return new ImageResponse((
        <div tw="w-full flex h-full bg-[#f5f5f5] p-16">
            <div tw="mx-auto flex flex-col justify-center nowrap items-start">
                <p tw='text-3xl text-[#707070]'>
                    {params.get("info")}
                </p>
                <div tw="flex flex-col justify-center items-end">
                    <p tw="text-8xl font-bold text-dark-background m-0" style={{}}>
                        {params.get("title") || "Boris Nezlobin"}
                    </p>
                    <p tw='text-3xl text-[#707070]'>
                        {subtitle}{subtitle ? " / " : ""}{params.get("title") ? "Boris Nezlobin" : ""}
                    </p>
                </div>
            </div>
        </div>
    ));
}