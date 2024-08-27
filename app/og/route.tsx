import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;

    const fontUrl = `${request.nextUrl.origin}/Charter Regular.ttf`;
    const fontResponse = await fetch(fontUrl);
    const fontData = await fontResponse.arrayBuffer();

    const title = decodeURIComponent(params.get("title") || "Boris Nezlobin.");
    const info = decodeURIComponent(params.get("info") || "404");
    const subtitle = decodeURIComponent(params.get("subtitle") || "");
    

    return new ImageResponse(
        (
            <div tw="w-full flex h-full bg-[#f5f5f5] p-16">
                <div tw="mx-auto flex flex-col justify-center items-center">
                    <p tw='text-3xl text-[#707070]'>
                        {info}
                    </p>
                    <div tw="flex flex-col justify-center items-center">
                        <p tw="text-8xl text-center font-bold text-[#3c3c3c] m-0 mb-2" style={{ fontFamily: 'Charter', lineHeight: "10rem" }}>
                            {title}
                        </p>
                        <p tw='text-3xl text-[#707070]' style={{ fontFamily: 'CustomFont' }}>
                            {subtitle}{subtitle ? " / " : ""}{title}
                        </p>
                    </div>
                </div>
            </div>
        ),
        {
            fonts: [
                {
                    name: 'Charter',
                    data: fontData,
                    style: 'normal',
                },
            ],
        }
    );
}