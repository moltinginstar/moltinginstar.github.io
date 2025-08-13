import { animate } from "./plugins/animate.js";
import { cacheBuster } from "./plugins/cache.js";
import { imageTransform } from "./plugins/image.js";
import {
  mdFootnotes,
  mdCodeHighlighting,
  mdLinksInNewTab,
  mdYoutubeEmbed,
  mdImplicitFigures,
} from "./plugins/markdown.js";
import { rssFeed } from "./plugins/feed.js";
import { pathToUrlTransform } from "./plugins/paths.js";

export default (eleventyConfig) => {
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

  eleventyConfig.addPassthroughCopy("styles");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("public");
  eleventyConfig.addPassthroughCopy("blog/*/assets/*", {
    mode: "html-relative",
  });

  eleventyConfig.addPlugin(animate);

  eleventyConfig.addPlugin(cacheBuster);

  eleventyConfig.addPlugin(imageTransform);

  eleventyConfig.addPlugin(mdFootnotes);
  eleventyConfig.addPlugin(mdCodeHighlighting);
  eleventyConfig.addPlugin(mdLinksInNewTab);
  eleventyConfig.addPlugin(mdYoutubeEmbed);
  eleventyConfig.addPlugin(mdImplicitFigures);

  eleventyConfig.addPlugin(rssFeed);

  eleventyConfig.addPlugin(pathToUrlTransform);
};
