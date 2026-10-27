// Writes a page for every room into build/aula/<slug>/: a copy of the app's
// index.html with the room's title and Open Graph tags, and the og.png card
// they point to. Also writes build/sitemap.xml. Runs after `vite build`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import { floors, roomSlug, roomTitle } from '../src/Data';
import RoomCard, { CARD_WIDTH } from '../src/RoomCard';

const BUILD = new URL('../build/', import.meta.url)
const SITE_TITLE = 'Plano de Derecho UBA'
// Bundled so the cards render the same on any machine; Liberation Sans has Helvetica's/Arial's metrics.
const FONT_FILES = ['LiberationSans-Regular.ttf', 'LiberationSans-Bold.ttf'].map((file) => fileURLToPath(new URL(`fonts/${file}`, import.meta.url)))
const homepage = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).homepage.replace(/\/?$/, '/')

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Set the content of the template's <meta attr="key">, failing rather than leaving the site-wide value.
const setMeta = (html: string, attr: string, key: string, value: string) => {
  const tag = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`)
  if (!tag.test(html)) throw new Error(`index.html has no <meta ${attr}="${key}">`)
  return html.replace(tag, `$1${escape(value)}$2`)
}

const template = readFileSync(new URL('index.html', BUILD), 'utf8')
const slugs = new Map<string, string>()
const urls = [homepage]

for (const [floor, rooms] of Object.entries(floors)) {
  for (const { name } of rooms) {
    const slug = roomSlug(name)
    const other = slugs.get(slug)
    if (other !== undefined) throw new Error(`"${name}" and "${other}" both have the slug "${slug}"`)
    slugs.set(slug, name)

    const dir = new URL(`aula/${slug}/`, BUILD)
    const url = `${homepage}aula/${slug}/`
    const title = `${roomTitle(name)} — ${SITE_TITLE}`
    const description = `Dónde queda ${roomTitle(name)}: ${floor} de la Facultad de Derecho de la UBA.`
    const alt = `Plano de ${floor} de la Facultad de Derecho con la ubicación de ${roomTitle(name)} resaltada`

    const svg = renderToStaticMarkup(<RoomCard floor={floor} name={name} />)
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: CARD_WIDTH },
      font: { loadSystemFonts: false, fontFiles: FONT_FILES, defaultFontFamily: 'Liberation Sans', sansSerifFamily: 'Liberation Sans' },
    }).render().asPng()

    let html = template
      .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>\n    <link rel="canonical" href="${url}" />`)
    for (const [attr, key, value] of [
      ['name', 'description', description],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:url', url],
      ['property', 'og:image', `${url}og.png`],
      ['property', 'og:image:alt', alt],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', description],
      ['name', 'twitter:image', `${url}og.png`],
    ]) html = setMeta(html, attr, key, value)

    mkdirSync(dir, { recursive: true })
    writeFileSync(new URL('og.png', dir), png)
    writeFileSync(new URL('index.html', dir), html)
    urls.push(url)
  }
}

writeFileSync(new URL('sitemap.xml', BUILD), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>
`)
console.log(`Wrote ${slugs.size} room pages`)
