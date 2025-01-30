import markdownItFootnote from "markdown-it-footnote";
import hljs from "highlight.js";
import embedYouTube from "eleventy-plugin-youtube-embed";
import implicitFigures from "markdown-it-implicit-figures";

export const mdFootnotes = (eleventyConfig) => {
  eleventyConfig.amendLibrary("md", (md) => {
    md.use(markdownItFootnote);

    md.renderer.rules.footnote_block_open = () =>
      "<div></div>\n" +
      '<div class="footnotes">\n' +
      '<ol class="footnotes-list">\n';
    md.renderer.rules.footnote_block_close = () => "</ol>\n" + "</div>\n";

    const mdFootnoteRef = md.renderer.rules.footnote_ref;
    md.renderer.rules.footnote_ref = (...args) => " " + mdFootnoteRef(...args);
  });
};

export const mdCodeHighlighting = (eleventyConfig) => {
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({
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
          '<pre><code class="hljs">' +
          md.utils.escapeHtml(str) +
          "</code></pre>"
        );
      },
    });
  });
};

export const mdLinksInNewTab = (eleventyConfig) => {
  eleventyConfig.amendLibrary("md", (md) => {
    const mdLinkOpen =
      md.renderer.rules.link_open ??
      ((tokens, idx, options, _env, self) => {
        return self.renderToken(tokens, idx, options);
      });
    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      if (!tokens[idx].attrGet("href").startsWith("#")) {
        tokens[idx].attrSet("target", "_blank");
      }

      return mdLinkOpen(tokens, idx, options, env, self);
    };
  });
};

export const mdYoutubeEmbed = (eleventyConfig) => {
  eleventyConfig.addPlugin(embedYouTube);
};

export const mdImplicitFigures = (eleventyConfig) => {
  eleventyConfig.amendLibrary("md", (md) => {
    md.use(implicitFigures, {
      figcaption: false,
      lazyLoading: true,
    });
  });
};
