import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
// Three.js / WebGL scenes need a GL backend in headless Chrome. "swangle" (software)
// works everywhere incl. cloud containers; on a desktop with a GPU "angle" is faster.
Config.setChromiumOpenGlRenderer("swangle");
