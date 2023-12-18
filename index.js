const fs = require(`fs`);
const path = require(`path`);
const { mdToPdf } = require(`md-to-pdf`);
const DOMParser = require('xmldom').DOMParser;
const xpath = require('xpath');

const config = require(`./config`);

(async () => {
  try {
    const asHtml = process.env.AS_HTML === `true`;
    const tableOfContentHeading = process.env.TOC_HEAD ?? `Table of content`;
    const srcDir = process.env.SRC_DIR ?? `./demo`;
    const dstDir = process.env.DST_DIR ?? `./dst`;
    const srcDirName = path.parse(srcDir).name;

    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(dstDir, { recursive: true });

    let mergedMdContent = ``;

    fs.readdirSync(srcDir).forEach(file => {
      mergedMdContent = `${mergedMdContent}\n\n${fs.readFileSync(`${srcDir}/${file}`, { encoding: `utf8` })
          .trim()
          .replace(/\r\n/, `\n`)
          .replace(/\r/, `\n`)
          .replace(/^(.+\n=+)\n/, `<div class="page-break"></div>\n\n$1`)
          .replace(/^(#[ \t]+[^\n]+)\n/, `<div class="page-break"></div>\n\n$1`)
      }`;
    });

    mergedMdContent = mergedMdContent.trim();

    const html = await mdToPdf({
      content: mergedMdContent
    }, {
      ...config,
      dest: `${dstDir}/${srcDirName}.${asHtml ? `html` : `pdf`}`,
      as_html: true,
    });

    const document = new DOMParser().parseFromString(html.content);
    const headings = xpath.select(`//*[self::h1 or self::h2]`, document);

    let tableOfContent = headings
        .map((node, index) => (
            node.tagName.toLowerCase() === `h1`
                ? `- [${node.firstChild.nodeValue.trim()}](#${node.attributes[0].nodeValue.trim()})`
                : node.tagName.toLowerCase() === `h2`
                    ? `    - [${node.firstChild.nodeValue.trim()}](#${node.attributes[0].nodeValue.trim()})`
                    : ``
        ))
        .join(`\n`);
    tableOfContent = `# ${tableOfContentHeading}\n\n${tableOfContent}`;

    if (mergedMdContent.startsWith(`<div class="page-break"></div>\n`)) {
      mergedMdContent = `${tableOfContent}\n${mergedMdContent}`;
    } else {
      mergedMdContent = `${tableOfContent}\n<div class="page-break"></div>\n\n${mergedMdContent}`;
    }

    if (mergedMdContent.startsWith(`<div class="page-break"></div>\n`)) {
      mergedMdContent = mergedMdContent.slice(mergedMdContent.indexOf(`\n`) + 1);
    }

    const pdf = await mdToPdf({
      content: mergedMdContent
    }, {
      ...config,
      dest: `${dstDir}/${srcDirName}.${asHtml ? `html` : `pdf`}`,
      as_html: asHtml,
    });

    if (pdf) {
      fs.writeFileSync(pdf.filename, pdf.content);
    } else {
      fs.writeFileSync(`${dstDir}/${srcDirName}.${asHtml ? `html` : `pdf`}`, ``);
    }
  } catch (err) {
    console.error(err);
  }
})();
