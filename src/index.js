import TurndownService from 'turndown';

export default {
  async fetch(request, env, ctx) {
    const acceptHeader = request.headers.get('Accept') || '';
    const wantsMarkdown = acceptHeader.includes('text/markdown');

    const response = await fetch(request);
    const contentType = response.headers.get('Content-Type') || '';

    // If no markdown requested, or not an HTML page, serve normally
    if (!wantsMarkdown || !contentType.includes('text/html')) {
      return response;
    }

    const html = await response.text();

    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });

    const markdown = turndownService.turndown(html);

    return new Response(markdown, {
      status: response.status,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept'
      }
    });
  },
};
