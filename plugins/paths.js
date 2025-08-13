import { InputPathToUrlTransformPlugin } from "@11ty/eleventy";

export const pathToUrlTransform = (eleventyConfig) => {
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);
};
