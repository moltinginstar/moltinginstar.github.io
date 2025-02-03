import { animate } from "./plugins/animate.js";
import { cacheBuster } from "./plugins/cache.js";
import {
  mdFootnotes,
  mdCodeHighlighting,
  mdLinksInNewTab,
  mdYoutubeEmbed,
  mdImplicitFigures,
} from "./plugins/markdown.js";
import { rssFeed } from "./plugins/feed.js";

export default (eleventyConfig) => {
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

  eleventyConfig.addPassthroughCopy("styles");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("public");
  eleventyConfig.addPassthroughCopy("blog/assets");

  eleventyConfig.addPlugin(animate);

  eleventyConfig.addPlugin(cacheBuster);

  eleventyConfig.addPlugin(mdFootnotes);
  eleventyConfig.addPlugin(mdCodeHighlighting);
  eleventyConfig.addPlugin(mdLinksInNewTab);
  eleventyConfig.addPlugin(mdYoutubeEmbed);
  eleventyConfig.addPlugin(mdImplicitFigures);

  eleventyConfig.addPlugin(rssFeed);
};
