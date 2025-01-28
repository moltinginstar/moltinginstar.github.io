export default {
  tags: ["blog"],
  permalink: false,
  eleventyComputed: {
    docId: (data) => data.page.fileSlug,
  },
};
