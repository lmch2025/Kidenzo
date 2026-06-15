const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\Administrateur\\.gemini\\antigravity\\brain\\30041eb3-50ac-4d0f-bbf5-d28dfc484fa9\\scratch';

if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

const defs = `
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f97316"/><stop offset="100%" stop-color="#ec4899"/></linearGradient>
    <linearGradient id="g2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#ec4899"/></linearGradient>
    <linearGradient id="g3" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#f97316"/></linearGradient>
  </defs>
`;

const logos = [
  `<circle cx="26" cy="32" r="18" fill="none" stroke="url(#g1)" stroke-width="8" opacity="0.9"/><circle cx="38" cy="32" r="18" fill="none" stroke="url(#g2)" stroke-width="8" opacity="0.9"/><circle cx="32" cy="32" r="6" fill="url(#g3)"/>`,
  `<path d="M16 32 C16 16, 32 16, 32 32 C32 48, 48 48, 48 32 C48 16, 32 16, 32 32 C32 48, 16 48, 16 32 Z" fill="none" stroke="url(#g1)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  `<rect x="16" y="16" width="8" height="32" rx="4" fill="url(#g1)"/><rect x="28" y="24" width="8" height="24" rx="4" fill="url(#g2)"/><rect x="40" y="12" width="8" height="36" rx="4" fill="url(#g3)"/>`,
  `<circle cx="32" cy="32" r="28" fill="url(#g1)"/><path d="M32 12 Q32 32 12 32 Q32 32 32 52 Q32 32 52 32 Q32 32 32 12 Z" fill="#0f172a"/>`,
  `<polygon points="32,8 54,20 54,44 32,56 10,44 10,20" fill="none" stroke="url(#g2)" stroke-width="6" stroke-linejoin="round"/><circle cx="32" cy="32" r="8" fill="url(#g1)"/><line x1="32" y1="32" x2="54" y2="20" stroke="url(#g2)" stroke-width="4"/>`,
  `<rect x="12" y="36" width="24" height="12" rx="6" fill="url(#g1)" transform="rotate(-30 24 42)"/><rect x="24" y="24" width="24" height="12" rx="6" fill="url(#g2)" transform="rotate(-30 36 30)"/><rect x="36" y="12" width="24" height="12" rx="6" fill="url(#g3)" transform="rotate(-30 48 18)"/>`,
  `<path d="M32 8 C48 8, 56 24, 56 40 C56 52, 44 60, 32 60 C20 60, 8 52, 8 40 C8 24, 16 8, 32 8 Z" fill="url(#g1)" opacity="0.2"/><circle cx="32" cy="44" r="8" fill="url(#g1)"/><circle cx="20" cy="28" r="5" fill="url(#g2)"/><circle cx="44" cy="28" r="5" fill="url(#g3)"/><path d="M20 28 L32 44 L44 28" fill="none" stroke="url(#g1)" stroke-width="4" stroke-linecap="round"/>`,
  `<path d="M32 12 L52 24 L32 36 L12 24 Z" fill="url(#g3)"/><path d="M12 24 L32 36 L32 56 L12 44 Z" fill="url(#g1)"/><path d="M52 24 L32 36 L32 56 L52 44 Z" fill="url(#g2)"/>`,
  `<path d="M16 26 C16 14, 32 14, 32 26 C32 14, 48 14, 48 26 C48 42, 32 54, 32 54 C32 54, 16 42, 16 26 Z" fill="none" stroke="url(#g1)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="26" r="6" fill="url(#g3)"/>`,
  `<rect x="16" y="12" width="10" height="40" rx="5" fill="url(#g1)"/><rect x="32" y="12" width="10" height="22" rx="5" fill="url(#g2)"/><rect x="32" y="38" width="10" height="14" rx="5" fill="url(#g3)"/><circle cx="48" cy="32" r="6" fill="url(#g3)"/>`
];

logos.forEach((content, index) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="200" height="200">${defs}${content}</svg>`;
  fs.writeFileSync(path.join(scratchDir, `logo_prop_${index + 1}.svg`), svg);
});

console.log('Successfully generated 10 SVG files for preview.');
