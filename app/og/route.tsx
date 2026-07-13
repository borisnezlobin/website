import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

async function loadFont(origin: string, file: string): Promise<ArrayBuffer | null> {
    try {
        const res = await fetch(`${origin}/${file}`);
        if (!res.ok) return null;
        return await res.arrayBuffer();
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const origin = request.nextUrl.origin;

    const [charter, vectra] = await Promise.all([
        loadFont(origin, "Charter Regular.ttf"),
        loadFont(origin, "antro_vectra.otf"),
    ]);

    // URLSearchParams has already decoded these values. Keeping the raw values
    // also avoids throwing on titles that contain a literal percent sign.
    const title = params.get("title") || "Boris Nezlobin.";
    const info = params.get("info") || "";
    const subtitle = params.get("subtitle") || "";

    const withoutAuthor = (value: string) => value
        .replace(/\s*(?:by\s+)?Boris Nezlobin\.?/gi, "")
        .trim()
        .replace(/[,.—-]+$/, "");
    const eyebrow = withoutAuthor(info) || "Personal site";
    const footerNote = withoutAuthor(subtitle);

    const titleSize = title.length > 90 ? 46 : title.length > 48 ? 56 : 68;

    const fonts = [
        charter && { name: 'Charter', data: charter, style: 'normal' as const },
        vectra && { name: 'Vectra', data: vectra, style: 'normal' as const },
    ].filter(Boolean) as { name: string; data: ArrayBuffer; style: 'normal' }[];

    return new ImageResponse(
        (
            <div
                tw="flex flex-col w-full h-full bg-[#f5f5f5] p-20"
                style={{ fontFamily: 'Charter' }}
            >
                <div tw="flex w-full items-center justify-between text-2xl text-[#707070]">
                    <span>{eyebrow}</span>
                    <span>borisnezlobin.com</span>
                </div>

                <div tw="flex flex-1 flex-col justify-center">
                    <div tw="flex items-stretch">
                        <p
                            tw="flex ml-8 m-0 text-[#232323]"
                            style={{ fontSize: titleSize, lineHeight: 1.14, letterSpacing: -0.5 }}
                        >
                            {title}
                        </p>
                    </div>
                </div>

                <div tw="flex w-full items-end justify-between">
                    <span
                        tw="text-6xl text-[#2b2b2b]"
                        style={{ fontFamily: vectra ? 'Vectra' : 'Charter' }}
                    >
                        Boris Nezlobin
                    </span>
                    <span tw="text-xl text-[#707070]">{footerNote}</span>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            fonts,
        }
    );
}
