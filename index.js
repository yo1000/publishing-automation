const fs = require(`fs`);
const path = require(`path`);
const {JSDOM} = require('jsdom');
const {Marked} = require('marked');
const {gfmHeadingId} = require(`marked-gfm-heading-id`);
const {markedHighlight} = require(`marked-highlight`);
const {markedSmartypants} = require(`marked-smartypants`);
const hljs = require(`highlight.js`);
const puppeteer = require('puppeteer');
const config = require(`./config`);

(async () => {
    try {
        const debug = process.env.DEBUG === `true`;
        const title = process.env.TITLE ?? config.title;
        const author = process.env.AUTHOR ?? config.author;
        const tableOfContentHeading = process.env.TOC_HEAD ?? `Table of content`;
        const srcDir = process.env.SRC_DIR ?? `./demo`;
        const dstDir = process.env.DST_DIR ?? `./dst`;
        const srcDirName = path.parse(srcDir).name;

        fs.mkdirSync(srcDir, {recursive: true});
        fs.mkdirSync(dstDir, {recursive: true});

        const mergedMdContent = fs.readdirSync(srcDir)
            .filter(resource => path.parse(resource).ext?.toLowerCase() === `.md`)
            .map(file => fs.readFileSync(`${srcDir}/${file}`, {encoding: `utf8`})
                .trim()
                .replace(/\r\n/, `\n`)
                .replace(/\r/, `\n`))
            .join(`\n\n`)
            .trim();

        config.stylesheets = [...new Set([...config.stylesheets, path.resolve(
            path.dirname(require.resolve(`highlight.js`)),
            `..`,
            `styles`,
            `${config.highlight_style ?? `github`}.css`,
        )])];

        const marked = new Marked();

        marked.use(gfmHeadingId());
        marked.use(markedSmartypants());
        marked.use(markedHighlight({
            langPrefix: 'hljs language-',
            highlight: (code, lang, _info) => {
                const language = hljs.getLanguage(lang) ? lang : `plaintext`;
                return hljs.highlight(code, {language}).value;
            },
        }));

        const html = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
            <meta charset="utf-8">
            <title>${title}</title>
            ${config?.fonts?.proportional?.length ? `
                <style>
                @font-face {
                    font-family: "Proportional";
                    src: ${config.fonts.proportional
                        .map(fontPath => (
                            `url(data:font/ttf;base64,${fs.readFileSync(
                            path.resolve(fontPath), {encoding: 'base64'}
                            )})`))
                        .join(`,`)};
                }
                </style>
            ` : ``}
            ${config?.fonts?.monospace?.length ? `
                <style>
                @font-face {
                    font-family: "Monospace";
                    src: ${config.fonts.monospace
                        .map(fontPath => (
                            `url(data:font/ttf;base64,${fs.readFileSync(
                            path.resolve(fontPath), {encoding: 'base64'}
                            )})`))
                        .join(`,`)};
                }
              </style>
            ` : ``}
            ${config?.fonts?.emoji?.length ? `
                <style>
                @font-face {
                    font-family: "Emoji";
                    src: ${config.fonts.emoji
                        .map(fontPath => (
                            `url(data:font/ttf;base64,${fs.readFileSync(
                            path.resolve(fontPath), {encoding: 'base64'}
                            )})`))
                        .join(`,`)};
                }
                </style>
            ` : ``}
            <style>
            html {
                font-family: "Proportional", "Emoji", sans-serif;
            }
            code {
                font-family: "Monospace", "Proportional", "Emoji", monospace;
            }
            .page-break {
                page-break-after: always;
            }
            </style>
            ${config?.stylesheets?.map(css => `<style>${fs.readFileSync(css)}</style>`).join(``)}
            </head>
            <body>
                ${marked.parse(mergedMdContent)}
            </body>
        </html>
    `;

        const dom = new JSDOM(html);
        const doc = dom.window.document;

        //// Code class
        const codeElements = doc.querySelectorAll(`code`);
        for (const codeElement of codeElements) {
            if ((codeElement.getAttribute(`class`) ?? ``).indexOf(`hljs`) < 0) {
                codeElement.classList.add(`hljs`);
                codeElement.classList.add(`plaintext`);
            }
        }

        //// Image path
        const ImgElements = doc.querySelectorAll(`img`);
        for (const imgElement of ImgElements) {
            const ext = path.extname(imgElement.getAttribute(`src`)).toLowerCase();
            if (ext === `.png`) {
                imgElement.setAttribute(`src`, `data:image/png;base64,${fs.readFileSync(
                    path.resolve(`${srcDir}/${imgElement.getAttribute(`src`)}`), {encoding: 'base64'}
                )}`);
            } else if (ext === `.jpg` || ext === `.jpeg`) {
                imgElement.setAttribute(`src`, `data:image/jpg;base64,${fs.readFileSync(
                    path.resolve(`${srcDir}/${imgElement.getAttribute(`src`)}`), {encoding: 'base64'}
                )}`);
            } else if (ext === `.gif`) {
                imgElement.setAttribute(`src`, `data:image/gif;base64,${fs.readFileSync(
                    path.resolve(`${srcDir}/${imgElement.getAttribute(`src`)}`), {encoding: 'base64'}
                )}`);
            }
        }

        //// Table of content
        const tocTitleElement = doc.createElement(`h1`);
        tocTitleElement.textContent = tableOfContentHeading;

        const tocHeadings = doc.querySelectorAll(`h1, h2`);
        let tocElement = doc.createElement(`ul`);
        for (const tocHeading of tocHeadings) {
            const liElement = doc.createElement(`li`);
            const aElement = doc.createElement(`a`);

            aElement.setAttribute(`href`, `#${tocHeading.getAttribute(`id`)}`);
            aElement.textContent = tocHeading.textContent;

            liElement.append(aElement);
            tocElement.append(liElement);
        }
        let firstElement = doc.querySelector(`body > *:first-child`);
        firstElement.parentNode.insertBefore(tocTitleElement, firstElement);
        firstElement.parentNode.insertBefore(tocElement, firstElement);

        //// Page break
        const h1Elements = doc.querySelectorAll(`h1:not(:first-child)`);
        for (const h1Element of h1Elements) {
            const pageBreakElement = doc.createElement(`div`);
            pageBreakElement.setAttribute(`class`, `page-break`);

            h1Element.parentNode.insertBefore(pageBreakElement, h1Element);
        }

        //// Cover page
        const coverDivElement = doc.createElement(`div`);
        coverDivElement.classList.add(`cover`);
        coverDivElement.style.height = `calc(8in - ${config.pdfOptions.margin.top})`
        coverDivElement.style.top = `calc(1.2in - ${config.pdfOptions.margin.top})`
        const coverH1Element = coverDivElement.appendChild(doc.createElement(`h1`));
        coverH1Element.classList.add(`title`);
        coverH1Element.textContent = title;
        const coverAuthorDivElement = coverDivElement.appendChild(doc.createElement(`div`));
        coverAuthorDivElement.classList.add(`author`);
        const coverH2Element = coverAuthorDivElement.appendChild(doc.createElement(`h2`));
        coverH2Element.textContent = author;
        const coverParagraphElement = coverAuthorDivElement.appendChild(doc.createElement(`p`));
        coverParagraphElement.textContent = new Date().toDateString();

        const pageBreakElement = doc.createElement(`div`);
        pageBreakElement.setAttribute(`class`, `page-break`);

        firstElement = doc.querySelector(`body > *:first-child`);
        firstElement.parentNode.insertBefore(coverDivElement, firstElement);
        firstElement.parentNode.insertBefore(pageBreakElement, firstElement);

        //// Output
        const outputHtml = dom.serialize();

        if (debug) {
            fs.writeFileSync(`${dstDir}/${srcDirName}.html`, outputHtml);
        }

        const browser = await puppeteer.launch();

        const page = await browser.newPage();
        await page.setContent(outputHtml);
        await page.pdf({
            ...config.pdfOptions,
            path: `${dstDir}/${srcDirName}.pdf`,
        });

        await browser.close();
    } catch (err) {
        console.error(err);
    }
})();
