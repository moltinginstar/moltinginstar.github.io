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

  eleventyConfig.addCollection("blogCategories", (collection) => {
    const posts = collection.getFilteredByTag("blog");

    const categories = new Set();
    for (const post of posts) {
      if (!post.data.categories) continue;

      for (const category of post.data.categories) {
        categories.add(category);
      }
      ``;
    }

    return [...categories].sort((a, b) => a.localeCompare(b));
  });

  eleventyConfig.addCollection("blogPostsByCategory", (collectionApi) => {
    const posts = collectionApi.getFilteredByTag("blog");

    const itemsPerPage = 20;

    const postsByCategory = {};
    for (const post of posts) {
      if (!post.data.categories) continue;

      for (const category of post.data.categories) {
        postsByCategory[category] ??= [];
        postsByCategory[category].push(post);
      }
    }
    postsByCategory["all"] = posts;

    const flatPostsByCategory = [];
    for (const category in postsByCategory) {
      const categoryPosts = postsByCategory[category].toReversed();
      const totalPages = Math.ceil(categoryPosts.length / itemsPerPage);

      for (let i = 0; i < categoryPosts.length; i += itemsPerPage) {
        flatPostsByCategory.push({
          category,
          pageNumber: Math.floor(i / itemsPerPage) + 1,
          totalPages,
          items: categoryPosts.slice(i, i + itemsPerPage),
        });
      }
    }

    console.log(flatPostsByCategory);

    return flatPostsByCategory;
  });
};
