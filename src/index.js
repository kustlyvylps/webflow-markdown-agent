import { NodeHtmlMarkdown } from 'node-html-markdown';

export default {
  async fetch(request, env, ctx) {
    try {
      const acceptHeader = request.headers.get('Accept') || '';
      const wantsMarkdown = acceptHeader.includes('text/markdown');

      // If no markdown requested, pass through to Webflow untouched
      if (!wantsMarkdown) {
        return fetch(request);
      }

      // Build a clean request for the origin, asking for HTML
      const originHeaders = new Headers(request.headers);
      originHeaders.set('Accept', 'text/html,application/xhtml+xml,*/*');

      const originRequest = new Request(request.url, {
        method: request.method,
        headers: originHeaders,
        redirect: 'follow'
      });

      const response = await fetch(originRequest);
      const contentType = response.headers.get('Content-Type') || '';

      // Only convert HTML responses
      if (!contentType.includes('text/html')) {
        return response;
      }

      const html = await response.text();

      // Strip non-content elements before converting
      const cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
        .replace(/<svg[\s\S]*?<\/svg>/gi, '');

      // Convert to Markdown (no DOM required)
      const markdown = NodeHtmlMarkdown.translate(cleaned);

      return new Response(markdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Vary': 'Accept'
        }
      });
    } catch (err) {
      return new Response(
        `Error: ${err.message}\n\nStack: ${err.stack}`,
        {
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        }
      );
    }
  },
};
