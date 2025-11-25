import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";
import fs from "fs";
import viteImagemin from "vite-plugin-imagemin";
import liveReload from "vite-plugin-live-reload";
import htmlInclude from "vite-plugin-html-include";

// 🔹 Nom du projet
const nameProject = "flora";
const themeRoot = `./web/themes/custom/${nameProject}`;

// 🔹 Chemins dynamiques
const htmlDir = `${themeRoot}/src/html`;
const jsDir = `${themeRoot}/src/assets/js`;

// 🔹 Fichiers HTML
const htmlFiles = fs
  .readdirSync(htmlDir)
  .filter((file) => file.endsWith(".html"));

const inputHtml = {};
htmlFiles.forEach((file) => {
  const name = file.replace(".html", "");
  inputHtml[name] = resolve(__dirname, `${htmlDir}/${file}`);
});

// 🔹 Fichiers JS
const jsFiles = fs.readdirSync(jsDir).filter((file) => file.endsWith(".js"));

const inputJs = {};
jsFiles.forEach((file) => {
  const name = file.replace(".js", "");
  inputJs[name] = resolve(__dirname, `${jsDir}/${file}`);
});

// 🔹 Plugin pour retirer crossorigin
const noCrossorigin = () => ({
  name: "no-crossorigin",
  transformIndexHtml(html) {
    return html
      .replace(/(type="module") crossorigin/g, "$1")
      .replace(/(rel="stylesheet") crossorigin/g, "$1");
  },
});

// 🔹 Déplacer HTML final dans dist/html
const moveHtmlToDist = () => ({
  name: "move-html-to-dist",
  closeBundle() {
    const distRoot = resolve(__dirname, `${themeRoot}/dist`);
    const htmlSrc = resolve(distRoot, "src/html");
    const htmlDest = resolve(distRoot, "html");

    if (fs.existsSync(htmlSrc)) {
      fs.mkdirSync(htmlDest, { recursive: true });
      fs.readdirSync(htmlSrc).forEach((f) =>
        fs.renameSync(resolve(htmlSrc, f), resolve(htmlDest, f))
      );
      fs.rmSync(resolve(distRoot, "src"), { recursive: true, force: true });
    }
  },
});

const fixHtmlAssetPaths = () => ({
  name: "fix-html-asset-paths",
  transformIndexHtml(html) {
    // Remplace ../../assets par ../assets
    return html.replace(/(\.\.\/)+assets\//g, "../assets/");
  },
});

// 🔹 Config Vite
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDev = env.APP_ENV === "local";

  return {
    root: themeRoot,
    base: "./",
    build: {
      outDir: "dist",
      minify: "terser",
      terserOptions: {
        keep_classnames: true,
        keep_fnames: true,
        compress: {
          drop_console: !isDev,
          drop_debugger: !isDev,
        },
      },
      //cssCodeSplit: true,
      sourcemap: false, // maps uniquement en dev
      rollupOptions: {
        input: { ...inputJs, ...inputHtml },
        output: {
          manualChunks: undefined,
          entryFileNames: "assets/js/[name].js",
          chunkFileNames: "assets/js/chunks/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const ext = assetInfo.name.split(".").pop();
            if (/css/i.test(ext)) return "assets/css/[name][extname]";
            if (/js/i.test(ext)) return "assets/js/[name][extname]";
            if (/woff|woff2|ttf|eot|otf/i.test(ext))
              return "assets/fonts/[name][extname]";
            if (/png|jpe?g|gif|webp|svg/i.test(ext))
              return "assets/images/[name][extname]";
            return "assets/[name][extname]";
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, `${themeRoot}/src`),
      },
    },
    plugins: [
      htmlInclude({
        root: resolve(__dirname, `${themeRoot}/src/html`),
      }),
      viteImagemin({
        gifsicle: { optimizationLevel: 7 },
        optipng: { optimizationLevel: 7 },
        mozjpeg: { quality: 75 },
        svgo: {
          plugins: [
            { name: "removeViewBox", active: false },
            { name: "removeEmptyAttrs", active: true },
          ],
        },
      }),
      noCrossorigin(),
      liveReload([
        `${themeRoot}/src/html/**/*.html`,
        `${themeRoot}/src/**/*.(scss|css|js)`,
      ]),
      moveHtmlToDist(),
      fixHtmlAssetPaths(),
    ],
    server: {
      open: true,
      port: 3000,
      strictPort: true,
      watch: { usePolling: true },
    },
  };
});
