module.exports = {
    title: `Demo title`,
    author: `Demo Author`,
    revision: `1.0.0`,
    stylesheets: [`./style.css`],
    fonts: {
        proportional: [`./fonts/NotoSansJP-VariableFont_wght.ttf`],
        monospace: [`./fonts/NotoSansMono-VariableFont_wdth,wght.ttf`],
        emoji: [`./fonts/NotoColorEmoji-Regular.ttf`],
    },
    pdfOptions: {
        format: `A4`,
        margin: {
            top: `0.5in`,
            right: `0.4in`,
            bottom: `1.2in`,
            left: `0.4in`
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `<div></div>`,
        footerTemplate: `
            <div style="
                    position: relative; width: 100%; padding: 0 0.4in 0.4in;
                    font-size: 9px; color: rgb(101, 109, 118);
            ">
                <div style="
                        position: relative; width: 100%; padding: 5px 0;
                        border-top: solid 1px rgb(216, 222, 228); 
                ">
                    <div style="position: absolute; left: 5px; top: 5px;">
                        <span>rev: </span><span class="revision"></span>
                    </div>
                    <div style="position: absolute; right: 5px; top: 5px;">
                        <span class="pageNumber"></span>/<span class="totalPages"></span>
                    </div>
                </div>
            </div>
        `,
    },
};
