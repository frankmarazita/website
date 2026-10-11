import { mount } from "./vendor/ascii.rest/mount.js";
import * as mistyForest from "./vendor/ascii.rest/misty-forest.js";

const banner = document.getElementById("banner");
if (banner) mount(banner, mistyForest);
