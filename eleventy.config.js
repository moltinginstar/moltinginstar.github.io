import markdownIt from "markdown-it";
import hljs from "highlight.js";

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
  });

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
};
