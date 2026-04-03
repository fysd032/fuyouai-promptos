import { NextResponse } from "next/server";

  export const revalidate = 3600;

  function extract(content: string, tag: string): string {
    const m = content.match(
      new RegExp(`<${tag}><\\!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([\\s\\S]*?)<\\/${tag}>`)
    );
    return (m?.[1] ?? m?.[2] ?? "").trim();
  }

  export async function GET() {
    try {
      const res = await fetch("https://blog.fuyouai.com/rss.xml", { next: { revalidate: 3600 } });
      const xml = await res.text();

      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 3);

      const posts = items.map((item) => {
        const content = item[1];
        const title = extract(content, "title");
        const description = extract(content, "description");
        const category = extract(content, "category");
        const pubDate = extract(content, "pubDate");
        const link = content.match(/<link>(.*?)<\/link>/)?.[1]?.trim() ||
                     content.match(/<link\s*\/?>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";

        return {
          title,
          href: link,
          summary: description.slice(0, 120) + "...",
          date: new Date(pubDate).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          }),
          category,
        };
      });

      return NextResponse.json(posts);
    } catch (e) {
      console.error(e);
      return NextResponse.json([]);
    }
  }