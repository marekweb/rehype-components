import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import rehypeFormat from "rehype-format";
import { h } from "hastscript";
import { test } from "node:test";
import assert from "node:assert/strict";

import rehypeComponents from "./dist/components.js";

function processDocument(document) {
  return unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeComponents, {
      components: {
        "documentation-page": DocumentationPage,
        "info-box": InfoBox,
        "copyright-notice": CopyrightNotice,
      },
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

const InfoBox = (properties, children, context) =>
  h(
    ".infobox",
    h(".infobox-title", properties.title || "Info"),
    h(".infobox-body", children)
  );

test("example", async () => {
  const output = await processDocument(input);
  assert.deepEqual(String(output), expected);
});
