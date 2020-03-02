const unistUtilVisit = require("unist-util-visit");

function rehypeComponents(options) {
  const { components = {} } = options;

  return tree =>
    unistUtilVisit(tree, (node, index, parent) => {
      const component = components[node.tagName];
      if (component) {
        const replacedNode = component(node.properties, node.children);
        parent.children[index] = replacedNode;

        // This return value makes sure that the traversal continues by
        // visiting the children of the replaced node (if any)
        return [unistUtilVisit.SKIP, index];
      }
    });
}

module.exports = rehypeComponents;
