import { test } from "node:test";
import assert from "node:assert/strict";

import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import rehypeFormat from "rehype-format";
import { h } from "hastscript";

import rehypeComponents from "./dist/components.js";

function processDocument(document, options, useFormat = false) {
  let processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeComponents, options)
    .use(rehypeStringify);

  if (useFormat) {
    processor = processor.use(rehypeFormat);
  }

  return processor.process(document);
}

test("example from readme", async () => {
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

  const CopyrightNotice = properties =>
    h("footer.notice", `© ${properties.year}`);

  const InfoBox = (properties, children) =>
    h(
      ".infobox",
      h(".infobox-title", properties.title || "Info"),
      h(".infobox-body", children)
    );

  const output = await processDocument(
    input,
    {
      components: {
        "documentation-page": DocumentationPage,
        "info-box": InfoBox,
        "copyright-notice": CopyrightNotice,
      },
    },
    true
  );
  assert.deepEqual(String(output), expected);
});

test("component returns an array of nodes", async () => {
  const input = `<wrapper><multiple-nodes></multiple-nodes></wrapper>`;
  const expected = `<div><span>First</span><span>Second</span></div>`;

  const wrapper = (properties, children) => h("div", children);
  const multipleNodes = () => [h("span", "First"), h("span", "Second")];

  const output = await processDocument(input, {
    components: {
      wrapper: wrapper,
      "multiple-nodes": multipleNodes,
    },
  });
  assert.strictEqual(String(output), expected);
});

test("component returns undefined or an empty array", async () => {
  const input = `<wrapper><empty-component></empty-component><undefined-component></undefined-component></wrapper>`;
  const expected = `<div></div>`; // Expect wrapper with no children

  const wrapper = (properties, children) => h("div", children);
  const emptyComponent = () => [];
  const undefinedComponent = () => undefined;

  const output = await processDocument(input, {
    components: {
      wrapper: wrapper,
      "empty-component": emptyComponent,
      "undefined-component": undefinedComponent,
    },
  });
  assert.strictEqual(String(output), expected);
});

test("component returns invalid content", async () => {
  const input = `<wrapper><invalid-content></invalid-content></wrapper>`;

  const wrapper = (properties, children) => h("div", children);
  const invalidContent = () => "This is invalid"; // Should cause an error

  await assert.rejects(
    processDocument(input, {
      components: {
        wrapper: wrapper,
        "invalid-content": invalidContent,
      },
    }),
    err => {
      assert.strictEqual(
        err.message.includes("expected to return ElementContent"),
        true
      );
      return true;
    },
    "Did not throw with expected error message"
  );
});

test("component returns a tree with another component for recursive rendering", async () => {
  const input = `<parent-component></parent-component>`;
  const expected = `<div class="parent"><article class="child">Child content</article></div>`;

  const ParentComponent = () => h("div.parent", h("child-component"));

  const ChildComponent = () => h("article.child", "Child content");

  const output = await processDocument(input, {
    components: {
      "parent-component": ParentComponent,
      "child-component": ChildComponent,
    },
  });
  assert.strictEqual(String(output), expected);
});
