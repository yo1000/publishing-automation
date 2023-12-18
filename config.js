module.exports = {
    stylesheet: [`./style.css`],
    marked_options: {
        headerIds: false,
        smartypants: true,
    },
    pdf_options: {
        format: `A4`,
        margin: `0.4in`,
        printBackground: true,
    },
    stylesheet_encoding: `utf-8`,
    body_class: `markdown-body`,
};
