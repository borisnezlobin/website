import { getBlogs } from "../lib/db-caches";
import CONFIG from "../lib/config";

export async function GET() {
    const posts = await getBlogs();
    const baseUrl = CONFIG.API_URL;

    const items = posts.map((post) => `
        <item>
            <title><![CDATA[${post.title}]]></title>
            <description><![CDATA[${post.description}]]></description>
            <link>${baseUrl}/blog/${post.slug}</link>
            <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
            <pubDate>${post.createdAt.toUTCString()}</pubDate>
        </item>`).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Boris Nezlobin</title>
        <link>${baseUrl}/blog</link>
        <description>Sometimes I write things. Sometimes they're wrong; other times they're incredible. It's very hit-or-miss. Interestingly, some people have noted, "I would let Boris hit if I was a girl." Hit or miss?</description>
        <language>en-us</language>
        <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
        ${items}
    </channel>
</rss>`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
