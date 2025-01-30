import fs from "fs";

export const cacheBuster = (eleventyConfig) => {
  eleventyConfig.addFilter("bust", (path) => {
    const url = new URL(path, "https://example.com");
    const relativePath = url.pathname.substring(1);

    try {
      const fileStats = fs.statSync(relativePath);
      const fileTimestamp = fileStats.mtime.getTime();
      url.searchParams.set("v", fileTimestamp);
    } catch (error) {
      console.log(`Error busting cache for ${url}: ${error}`);
    }

    return url.toString().replace(url.origin, "");
  });
};
