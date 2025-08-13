import { feedPlugin } from "@11ty/eleventy-plugin-rss";

export const rssFeed = (eleventyConfig) => {
  eleventyConfig.addPlugin(feedPlugin, {
    type: "rss",
    outputPath: "/blog/feed.xml",
    collection: {
      name: "blog",
      limit: 0,
    },
    metadata: {
      language: "en",
      title: "Samblings",
      subtitle: "Scattered notes on whatever holds my attention.",
      base: "https://samblings.com",
      author: {
        name: "Sam",
        email: "hello@moltinginstar.com",
      },
    },
  });
};
