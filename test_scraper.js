const url = "https://www.alibaba.com/product-detail/Blender-Heavy-Duty-Commercial-2-in_1600979137134.html";
const scraperApiKey = "3565fc05ecea04a4dc89191a4eeab263";
const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}&premium=true`;

function isValidImageUrl(imgUrl) {
  const url = imgUrl.toLowerCase();
  return url.startsWith('http') &&
    !url.includes('sprite') &&
    !url.includes('icon') &&
    !url.includes('logo') &&
    !url.includes('avatar') &&
    !url.includes('flag') &&
    !url.includes('search') &&
    !url.includes('loading') &&
    !url.includes('placeholder') &&
    !url.includes('data:image') &&
    url.length > 30 &&
    !url.includes('50x50') &&
    !url.includes('100x100') &&
    !url.includes('64x64');
}

function extractFromHtml(pageHtml) {
  const titleMatch = pageHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const text = pageHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  const imgRegex = /src=["']([^"']+\.(jpg|jpeg|png|webp)(\?[^"']*)?)\s*["']/gi;
  const images = [];
  let imgMatch;
  while ((imgMatch = imgRegex.exec(pageHtml)) !== null) {
    let imgUrl = imgMatch[1];
    if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
    if (isValidImageUrl(imgUrl)) images.push(imgUrl);
  }

  const rawUrlRegex = /(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?)/gi;
  let rawMatch;
  while ((rawMatch = rawUrlRegex.exec(pageHtml)) !== null) {
    if (isValidImageUrl(rawMatch[1])) images.push(rawMatch[1]);
  }

  const videoRegex = /(?:src|data-src|data-video-url|poster)=["']([^"']+\.(mp4|webm|ogg)(\?[^"']*)?)\s*["']/gi;
  const videos = [];
  let videoMatch;
  while ((videoMatch = videoRegex.exec(pageHtml)) !== null) {
    let videoUrl = videoMatch[1];
    if (videoUrl.startsWith('//')) videoUrl = 'https:' + videoUrl;
    if (videoUrl.startsWith('http') && videoUrl.length > 20) {
      videos.push(videoUrl);
    }
  }

  return { textLength: text.length, title, images: images.length, videos: videos.length };
}

async function test() {
  console.log("Fetching...", scraperUrl);
  try {
    const res = await fetch(scraperUrl);
    const html = await res.text();
    console.log("Status:", res.status);
    console.log("Extracted:", extractFromHtml(html));
  } catch (e) {
    console.error(e);
  }
}
test();
