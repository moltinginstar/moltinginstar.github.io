import parser from "node-html-parser";

export const animate = (eleventyConfig) => {
  eleventyConfig.addTransform("animate", function (content) {
    if ((this.page.outputPath || "").endsWith(".html")) {
      const root = parser.parse(content);
      const elements = root.querySelectorAll(".animate");

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        let elementStyle = element.getAttribute("style") ?? "";

        // Allow per-element overrides
        if (elementStyle.includes("--i:")) {
          continue;
        }

        if (elementStyle && !elementStyle.trimEnd().endsWith(";")) {
          elementStyle += "; ";
        }

        elementStyle += `--i: ${i};`;
        element.setAttribute("style", elementStyle);
      }

      return root.toString();
    }

    return content;
  });
};
