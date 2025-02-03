import { feedPlugin } from "@11ty/eleventy-plugin-rss";

export const rssFeed = (eleventyConfig) => {
  // A hack to get the feed plugin to work without permalinks
  eleventyConfig.addCollection("blog", function (collectionApi) {
    const posts = collectionApi.getFilteredByTag("blog");
    posts.forEach((post) => {
      post.url = post.filePathStem.replace("blog/", "blog/#");
    });

    return posts;
  });

  eleventyConfig.addPlugin(feedPlugin, {
    type: "rss",
    outputPath: "/feed.xml",
    collection: {
      name: "blog",
      limit: 0,
    },
    metadata: {
      language: "en",
      title: "Samblings",
      subtitle: "Scattered notes on whatever holds my attention.",
      base: "https://moltinginstar.com/blog/",
      author: {
        name: "Sam",
        email: "hello@moltinginstar.com",
      },
    },
  });
};
