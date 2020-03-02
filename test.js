const unified = require("unified");
const rehypeParse = require("rehype-parse");
const rehypeStringify = require("rehype-stringify");
const rehypeFormat = require("rehype-format");
const h = require("hastscript");
const assert = require("assert");
const rehypeComponents = require(".");

function processDocument(document) {
  return unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeComponents, {
      components: {
        "documentation-page": DocumentationPage,
        "info-box": InfoBox,
        "copyright-notice": CopyrightNotice
      }
    })
    .use(rehypeStringify)
    .use(rehypeFormat)
    .process(document);
}

const input = `
<documentation-page title="Welcome">
  <info-box title="Reminder">Don't forget to run npm install</info-box>
  <p>Lorem ipsum...</p>
  <copyright-notice year="2020"></copyright-notice>
</documentation-page>
`;

const expected = `
<article class="documentation">
  <h1>Welcome</h1>
  <div class="infobox">
    <div class="infobox-title">Reminder</div>
    <div class="infobox-body">Don't forget to run npm install</div>
  </div>
  <p>Lorem ipsum...</p>
  <footer class="notice">© 2020</footer>
</article>
`;

const DocumentationPage = (properties, children) =>
  h("article.documentation", [h("h1", properties.title), ...children]);

const CopyrightNotice = (properties, children) =>
  h("footer.notice", `© ${properties.year}`);

const InfoBox = (properties, children) =>
  h(
    ".infobox",
    h(".infobox-title", properties.title || "Info"),
    h(".infobox-body", children)
  );

async function test() {
  const output = await processDocument(input);
  assert.equal(output.contents, expected, "output equals expected");
}

test().catch(error => {
  console.error(error);
  process.exit(1);
});
