"use server";

export const GistEmbed = async ({ gistId }: { gistId: string }) => {
    const url = `https://gist.github.com/${gistId}.js`;
    console.log("Fetching gist", url);

    const js = await fetch(url).then((res) => res.text());
    // format is `document.write('{css}');\ndocument.write('{gist_html}');`
    const writes = js.split("document.write('");
    console.log(writes);
    const gistHtml = writes[writes.length - 1].split("')")[0]
        .replace(/(?<!\\)\\n/g, "")
        .replace(/\\\\/g, "\\")
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\//g, "/")
    console.log(gistHtml);

    return (
        <div className="gist-embed">
            <div dangerouslySetInnerHTML={{ __html: gistHtml}} />
        </div>
    );
}