const fs = require(`fs`);
const path = require(`path`);
const { mdToPdf } = require(`md-to-pdf`);

(async () => {
  try {
    const srcDir = process.env.SRC_DIR ?? `./demo`;
    const dstDir = process.env.DST_DIR ?? `./dst`;
    const srcDirName = path.parse(srcDir).name;

    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(dstDir, { recursive: true });

    let mergedMdContent = ``

    fs.readdirSync(srcDir).forEach(file => {
      mergedMdContent = `${mergedMdContent}\n\n${fs.readFileSync(`${srcDir}/${file}`, { encoding: `utf8` })}`;
    });

    mergedMdContent = mergedMdContent
        .replace(/\r\n/, `\n`)
        .replace(/\r/, `\n`)

    mergedMdContent = mergedMdContent
        .replace(/^(.+\n={4,})$/gm, `<div class="page-break"></div>\n\n$1`)
        .replace(/^(#[ \t]+[^\n]+)$/gm, `<div class="page-break"></div>\n\n$1`)
        .trim()

    if (mergedMdContent.startsWith(`<div class="page-break"></div>\n`)) {
      mergedMdContent = mergedMdContent.slice(mergedMdContent.indexOf(`\n`) + 1)
    }

    const pdf = await mdToPdf({
      content: mergedMdContent
    }, {
      dest: `${dstDir}/${srcDirName}.pdf`
    });

    if (pdf) {
      fs.writeFileSync(pdf.filename, pdf.content);
    } else {
      fs.writeFileSync(`${dstDir}/${srcDirName}.pdf`, ``);
    }
  } catch (err) {
    console.error(err);
  }
})();
