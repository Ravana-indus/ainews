export async function getPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'Accept': 'text/html' } });
    const html = await res.text();
    const bodyMatch = /<body[\s\S]*?>([\s\S]*?)<\/body>/i.exec(html);
    let body = (bodyMatch ? bodyMatch[1] : html)
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!body) return null;
    return body.slice(0, 6000);
  } catch {
    return null;
  }
}

