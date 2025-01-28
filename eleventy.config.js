import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import markdownIt from "markdown-it";
import markdownItFootnote from "markdown-it-footnote";
import hljs from "highlight.js";
import parser from "node-html-parser";

export default (eleventyConfig) => {
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

  eleventyConfig.addPassthroughCopy("styles");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("public");

  const md = markdownIt({
    xhtmlOut: true,
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return (
            '<pre><code class="hljs">' +
            hljs.highlight(str, { language: lang, ignoreIllegals: true })
              .value +
            "</code></pre>"
          );
        } catch (__) {}
      }

      return (
        '<pre><code class="hljs">' + md.utils.escapeHtml(str) + "</code></pre>"
      );
    },
  }).use(markdownItFootnote);

  md.renderer.rules.footnote_block_open = () =>
    "<div></div>\n" +
    '<div class="footnotes">\n' +
    '<ol class="footnotes-list">\n';
  md.renderer.rules.footnote_block_close = () => "</ol>\n" + "</div>\n";

  const defaultRender =
    md.renderer.rules.link_open ??
    ((tokens, idx, options, _env, self) => {
      return self.renderToken(tokens, idx, options);
    });
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    tokens[idx].attrSet("target", "_blank");

    return defaultRender(tokens, idx, options, env, self);
  };

  eleventyConfig.setLibrary("md", md);

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
